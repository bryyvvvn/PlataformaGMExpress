import { useState, useEffect } from "react";

export type Guarnicion = {
  id: number;
  nombre: string;
};

export type Plato = {
  id: number;
  nombre: string;
  url_imagen: string | null;
  categoria: "ENTRADA" | "FONDO" | "POSTRE" | "BEBESTIBLE";
  tipo: "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "SIN_GLUTEN";
};

export type PlatoMenuDia = {
  detalleId: number;
  fecha: string | null;
  plato: Plato;
  guarniciones: Guarnicion[];
};

export type SeleccionMenuDia = {
  id: number;
  entrada: PlatoMenuDia;
  fondo: PlatoMenuDia;
  postre: PlatoMenuDia;
  guarnicion: Guarnicion | null;
};

export type DiaMenu = {
  dia: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes";
  fecha: string | null;
  opciones: {
    entradas: PlatoMenuDia[];
    fondos: PlatoMenuDia[];
    postres: PlatoMenuDia[];
  };
  seleccion: SeleccionMenuDia | null;
};

export type MenuDiaResponse = {
  menu: {
    id: number;
    fecha_inicio: string | null;
    fecha_fin: string | null;
  } | null;
  dias: DiaMenu[];
};

export type SemanaCargada = {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  creado_en: string;
  detalles: number;
  seleccionesMenuDia: number;
  pedidos: number;
};

export type DraftMenuDia = {
  entradaId: number | null;
  fondoId: number | null;
  postreId: number | null;
  guarnicionId: number | null;
};

export const LETRAS_DIA: Record<DiaMenu["dia"], string> = {
  Lunes: "L",
  Martes: "M",
  Miércoles: "M",
  Jueves: "J",
  Viernes: "V",
};

export const PLANTILLA_MINUTA_URL = "/formato-minuta.xlsx";

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado";
}

export function formatFechaCorta(fecha: string | null) {
  if (!fecha) return "Sin fecha";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

export function getFechaActualChile() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function crearDrafts(data: MenuDiaResponse): Record<string, DraftMenuDia> {
  return Object.fromEntries(
    data.dias
      .filter((dia) => dia.fecha)
      .map((dia) => [
        dia.fecha!,
        {
          entradaId: dia.seleccion?.entrada.detalleId ?? null,
          fondoId: dia.seleccion?.fondo.detalleId ?? null,
          postreId: dia.seleccion?.postre.detalleId ?? null,
          guarnicionId: dia.seleccion?.guarnicion?.id ?? null,
        },
      ])
  );
}

export function usePlanificador() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  
  const [menuDia, setMenuDia] = useState<MenuDiaResponse | null>(null);
  const [loadingMenuDia, setLoadingMenuDia] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, DraftMenuDia>>({});
  const [guardandoFecha, setGuardandoFecha] = useState<string | null>(null);
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);
  
  const [semanas, setSemanas] = useState<SemanaCargada[]>([]);
  const [loadingSemanas, setLoadingSemanas] = useState(true);
  const [eliminandoSemanaId, setEliminandoSemanaId] = useState<number | null>(null);
  const [eliminarSemanasOpen, setEliminarSemanasOpen] = useState(false);

  const cargarSemanas = async () => {
    setLoadingSemanas(true);
    try {
      const response = await fetch("/api/admin/menu-weeks", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las semanas");
      }

      setSemanas(data.semanas);
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setLoadingSemanas(false);
    }
  };

  const cargarMenuDia = async () => {
    setLoadingMenuDia(true);
    try {
      const response = await fetch("/api/admin/menu-dia", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el menú del día");
      }

      setMenuDia(data);
      setDrafts(crearDrafts(data));
      setDiaAbierto((actual) => {
        if (actual && data.dias.some((dia: DiaMenu) => dia.fecha === actual)) return actual;
        const hoy = getFechaActualChile();
        return data.dias.find((dia: DiaMenu) => dia.fecha === hoy)?.fecha ?? data.dias.find((dia: DiaMenu) => dia.fecha)?.fecha ?? null;
      });
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setLoadingMenuDia(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarMenuDia();
      void cargarSemanas();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMensaje(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMensaje(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-minuta", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al subir el archivo");
      }

      setMensaje({ tipo: "exito", texto: "¡Minuta semanal cargada exitosamente!" });
      setFile(null);
      await cargarMenuDia();
      await cargarSemanas();
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const actualizarDraft = (fecha: string, cambios: Partial<DraftMenuDia>) => {
    setDrafts((prev) => ({
      ...prev,
      [fecha]: {
        entradaId: prev[fecha]?.entradaId ?? null,
        fondoId: prev[fecha]?.fondoId ?? null,
        postreId: prev[fecha]?.postreId ?? null,
        guarnicionId: prev[fecha]?.guarnicionId ?? null,
        ...cambios,
      },
    }));
  };

  const guardarMenuDia = async (dia: DiaMenu) => {
    if (!menuDia?.menu || !dia.fecha) return;

    const draft = drafts[dia.fecha];
    if (!draft?.entradaId || !draft.fondoId || !draft.postreId) {
      setMensaje({ tipo: "error", texto: `Debes seleccionar entrada, fondo y postre para ${dia.dia}` });
      return;
    }

    const fondo = dia.opciones.fondos.find((item) => item.detalleId === draft.fondoId);
    if (fondo && fondo.guarniciones.length > 0 && !draft.guarnicionId) {
      setMensaje({ tipo: "error", texto: `Debes seleccionar una guarnición para ${dia.dia}` });
      return;
    }

    setGuardandoFecha(dia.fecha);
    setMensaje(null);

    try {
      const response = await fetch("/api/admin/menu-dia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuSemanalId: menuDia.menu.id,
          fecha: dia.fecha,
          entradaId: draft.entradaId,
          fondoId: draft.fondoId,
          postreId: draft.postreId,
          guarnicionId: draft.guarnicionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar el menú del día");
      }

      await cargarMenuDia();
      setMensaje({ tipo: "exito", texto: `Menú del día guardado para ${dia.dia}` });
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setGuardandoFecha(null);
    }
  };

  const eliminarSemana = async (semana: SemanaCargada) => {
    if (semana.pedidos > 0) {
      setMensaje({ tipo: "error", texto: "No se puede eliminar una semana con pedidos asociados." });
      return;
    }

    const ok = window.confirm(`¿Eliminar la semana del ${formatFechaCorta(semana.fecha_inicio)} al ${formatFechaCorta(semana.fecha_fin)}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setEliminandoSemanaId(semana.id);
    setMensaje(null);

    try {
      const response = await fetch(`/api/admin/menu-weeks?id=${semana.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo eliminar la semana");
      }

      setMensaje({ tipo: "exito", texto: "Semana eliminada correctamente" });
      await cargarMenuDia();
      await cargarSemanas();
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setEliminandoSemanaId(null);
    }
  };

  return {
    file,
    loading,
    mensaje,
    menuDia,
    loadingMenuDia,
    drafts,
    guardandoFecha,
    diaAbierto,
    setDiaAbierto,
    semanas,
    loadingSemanas,
    eliminandoSemanaId,
    eliminarSemanasOpen,
    setEliminarSemanasOpen,
    cargarSemanas,
    cargarMenuDia,
    handleFileChange,
    handleUpload,
    actualizarDraft,
    guardarMenuDia,
    eliminarSemana,
  };
}