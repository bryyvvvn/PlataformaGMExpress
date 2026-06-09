import { useState, useEffect } from "react";

export type Guarnicion = {
  id: number;
  nombre: string;
};

export type Plato = {
  id: number;
  nombre: string;
  url_imagen: string | null;
  categoria: "ENTRADA" | "FONDO" | "POSTRE" | "BEBIDA" | "JUGO" | "AGUA_SABORIZADA";
  tipo: "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "SIN_GLUTEN" | "PLATO_UNICO";
};

export type PlatoBebida = Plato & {
  calorias?: number | null;
  proteinas?: number | null;
  carbohidratos?: number | null;
  grasas?: number | null;
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
  entradasSeleccionadas?: PlatoMenuDia[];
  entradaDisplay?: string | null;
  bebida?: PlatoBebida | null;
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

export type ModalidadHipocalorica = "SOPA_CREMA" | "DOBLE_POSTRE";

export type DraftMenuDia = {
  entradaId: number | null;
  entradasIds: number[];
  fondoId: number | null;
  postreId: number | null;
  guarnicionId: number | null;
  bebidaPlatoId: number | null;
  modalidadHipocalorica: ModalidadHipocalorica | null;
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

export function construirEntradaDisplay(entradas: PlatoMenuDia[]) {
  if (entradas.length === 0) return null;
  if (entradas.length === 3 && !entradas.some(esEntradaSopa)) return "Ensalada surtida";
  return entradas.map((entrada) => entrada.plato.nombre).join(" + ");
}

export function normalizarTextoBusqueda(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function esEntradaSopa(entrada: PlatoMenuDia) {
  const entradaConEtiqueta = entrada as PlatoMenuDia & {
    etiqueta?: string | null;
    label?: string | null;
    display?: string | null;
    nombre?: string | null;
  };
  const textoEntrada = [
    entrada.plato.nombre,
    entradaConEtiqueta.etiqueta,
    entradaConEtiqueta.label,
    entradaConEtiqueta.display,
    entradaConEtiqueta.nombre,
  ].filter(Boolean).join(" ");

  return /\b(SOPA|CREMA)\b/.test(normalizarTextoBusqueda(textoEntrada));
}

export function esFondoPlatoUnico(fondo: PlatoMenuDia | null | undefined) {
  return fondo?.plato.tipo === "PLATO_UNICO";
}

export function esFondoHipocalorico(fondo: PlatoMenuDia | null | undefined) {
  return fondo?.plato.tipo === "HIPOCALORICO";
}

export function fondoOmiteGuarnicion(fondo: PlatoMenuDia | null | undefined) {
  return esFondoPlatoUnico(fondo) || esFondoHipocalorico(fondo);
}

export function obtenerEntradasEnsalada(entradas: PlatoMenuDia[]) {
  return entradas.filter((entrada) => !esEntradaSopa(entrada));
}

export function tieneSopaCombinada(entradas: PlatoMenuDia[]) {
  return entradas.some(esEntradaSopa) && entradas.length > 1;
}

export function crearDrafts(data: MenuDiaResponse): Record<string, DraftMenuDia> {
  return Object.fromEntries(
    data.dias
      .filter((dia) => dia.fecha)
      .map((dia) => {
        const entradasSeleccionadas = dia.seleccion?.entradasSeleccionadas?.length
          ? dia.seleccion.entradasSeleccionadas
          : dia.seleccion?.entrada
            ? [dia.seleccion.entrada]
            : [];
        const entradasIds = dia.seleccion?.entradasSeleccionadas?.length
          ? dia.seleccion.entradasSeleccionadas.map((entrada) => entrada.detalleId)
          : dia.seleccion?.entrada.detalleId
            ? [dia.seleccion.entrada.detalleId]
            : [];
        const modalidadHipocalorica =
          esFondoHipocalorico(dia.seleccion?.fondo) &&
          entradasSeleccionadas.length === 1 &&
          esEntradaSopa(entradasSeleccionadas[0])
            ? "SOPA_CREMA"
            : null;

        return [
          dia.fecha!,
          {
            entradaId: entradasIds[0] ?? null,
            entradasIds,
            fondoId: dia.seleccion?.fondo.detalleId ?? null,
            postreId: dia.seleccion?.postre.detalleId ?? null,
            guarnicionId: dia.seleccion?.guarnicion?.id ?? null,
            bebidaPlatoId: dia.seleccion?.bebida?.id ?? null,
            modalidadHipocalorica,
          },
        ];
      })
  );
}

export function usePlanificador() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  
  const [menuDia, setMenuDia] = useState<MenuDiaResponse | null>(null);
  const [loadingMenuDia, setLoadingMenuDia] = useState(true);
  const [bebidas, setBebidas] = useState<PlatoBebida[]>([]);
  const [loadingBebidas, setLoadingBebidas] = useState(true);
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

  const cargarBebidas = async () => {
    setLoadingBebidas(true);
    try {
      const response = await fetch("/api/trabajador/otros", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las bebidas");
      }

      const categoriasBebida = new Set(["BEBIDA", "AGUA_SABORIZADA"]);
      setBebidas((data.platos ?? []).filter((plato: PlatoBebida) => categoriasBebida.has(plato.categoria)));
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setLoadingBebidas(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarMenuDia();
      void cargarBebidas();
      void cargarSemanas();
    }, 0);
    return () => window.clearTimeout(timer);
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
        entradasIds: prev[fecha]?.entradasIds ?? [],
        fondoId: prev[fecha]?.fondoId ?? null,
        postreId: prev[fecha]?.postreId ?? null,
        guarnicionId: prev[fecha]?.guarnicionId ?? null,
        bebidaPlatoId: prev[fecha]?.bebidaPlatoId ?? null,
        modalidadHipocalorica: prev[fecha]?.modalidadHipocalorica ?? null,
        ...cambios,
      },
    }));
  };

  const guardarMenuDia = async (dia: DiaMenu) => {
    if (!menuDia?.menu || !dia.fecha) return;

    const draft = drafts[dia.fecha];
    const entradasIds = draft?.entradasIds?.length
      ? draft.entradasIds
      : draft?.entradaId
        ? [draft.entradaId]
        : [];

    const fondo = dia.opciones.fondos.find((item) => item.detalleId === draft?.fondoId);
    const fondoEsHipocalorico = esFondoHipocalorico(fondo);
    const fondoSinGuarnicion = fondoOmiteGuarnicion(fondo);
    const modalidadHipocalorica = draft?.modalidadHipocalorica ?? null;

    if (!draft?.fondoId || !draft.postreId) {
      setMensaje({ tipo: "error", texto: `Debes seleccionar entrada, fondo y postre para ${dia.dia}` });
      return;
    }

    if (fondoEsHipocalorico && !modalidadHipocalorica) {
      setMensaje({ tipo: "error", texto: `Debes seleccionar la modalidad hipocalorica para ${dia.dia}` });
      return;
    }

    if (modalidadHipocalorica === "DOBLE_POSTRE") {
      if (entradasIds.length > 0) {
        setMensaje({ tipo: "error", texto: "Para menu hipocalorico con doble postre, no se debe seleccionar entrada." });
        return;
      }

      setMensaje({
        tipo: "error",
        texto: "El contrato actual de Menu del Dia no permite persistir doble postre. Se requiere soporte futuro para cantidad de postre o modalidad hipocalorica.",
      });
      return;
    }

    if (entradasIds.length === 0) {
      setMensaje({ tipo: "error", texto: `Debes seleccionar entrada, fondo y postre para ${dia.dia}` });
      return;
    }

    if (entradasIds.length > 3) {
      setMensaje({ tipo: "error", texto: `Puedes seleccionar hasta 3 entradas para ${dia.dia}` });
      return;
    }

    const entradasSeleccionadas = entradasIds
      .map((id) => dia.opciones.entradas.find((entrada) => entrada.detalleId === id))
      .filter((entrada): entrada is PlatoMenuDia => Boolean(entrada));

    if (tieneSopaCombinada(entradasSeleccionadas)) {
      setMensaje({ tipo: "error", texto: "La sopa cuenta como entrada completa y no puede combinarse con ensaladas." });
      return;
    }

    if (fondoEsHipocalorico && modalidadHipocalorica === "SOPA_CREMA") {
      if (entradasSeleccionadas.length !== 1 || !esEntradaSopa(entradasSeleccionadas[0])) {
        setMensaje({
          tipo: "error",
          texto: "Para menu hipocalorico con sopa/crema, selecciona unicamente la sopa o crema del dia.",
        });
        return;
      }
    }

    if (!draft.bebidaPlatoId) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar una bebida especial del día. Solo será visible para empresas cuyo convenio permita bebida o agua saborizada; las demás seguirán viendo Jugo del día.",
      });
      return;
    }

    if (!fondoSinGuarnicion && fondo && fondo.guarniciones.length > 0 && !draft.guarnicionId) {
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
          entradaId: entradasIds[0],
          entradasIds,
          fondoId: draft.fondoId,
          postreId: draft.postreId,
          guarnicionId: fondoSinGuarnicion ? null : draft.guarnicionId,
          bebidaPlatoId: draft.bebidaPlatoId,
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
    bebidas,
    loadingBebidas,
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
