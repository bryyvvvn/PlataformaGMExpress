"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  UtensilsCrossed,
} from "lucide-react";

type Guarnicion = {
  id: number;
  nombre: string;
};

type Plato = {
  id: number;
  nombre: string;
  url_imagen: string | null;
  categoria: "ENTRADA" | "FONDO" | "POSTRE" | "BEBESTIBLE";
  tipo: "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "SIN_GLUTEN";
};

type PlatoMenuDia = {
  detalleId: number;
  fecha: string | null;
  plato: Plato;
  guarniciones: Guarnicion[];
};

type SeleccionMenuDia = {
  id: number;
  entrada: PlatoMenuDia;
  fondo: PlatoMenuDia;
  postre: PlatoMenuDia;
  guarnicion: Guarnicion | null;
};

type DiaMenu = {
  dia: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes";
  fecha: string | null;
  opciones: {
    entradas: PlatoMenuDia[];
    fondos: PlatoMenuDia[];
    postres: PlatoMenuDia[];
  };
  seleccion: SeleccionMenuDia | null;
};

type MenuDiaResponse = {
  menu: {
    id: number;
    fecha_inicio: string | null;
    fecha_fin: string | null;
  } | null;
  dias: DiaMenu[];
};

type SemanaCargada = {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  creado_en: string;
  detalles: number;
  seleccionesMenuDia: number;
  pedidos: number;
};

const LETRAS_DIA: Record<DiaMenu["dia"], string> = {
  Lunes: "L",
  Martes: "M",
  Miércoles: "M",
  Jueves: "J",
  Viernes: "V",
};

const PLANTILLA_MINUTA_URL = "/formato-minuta.xlsx";

type DraftMenuDia = {
  entradaId: number | null;
  fondoId: number | null;
  postreId: number | null;
  guarnicionId: number | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado";
}

function formatFechaCorta(fecha: string | null) {
  if (!fecha) return "Sin fecha";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function getFechaActualChile() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function crearDrafts(data: MenuDiaResponse): Record<string, DraftMenuDia> {
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

function MenuOptionCard({
  item,
  selected,
  onSelect,
}: {
  item: PlatoMenuDia;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full overflow-hidden rounded-xl border text-left transition-all ${
        selected
          ? "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100 ring-1 ring-emerald-200"
          : "border-slate-200 bg-white shadow-sm hover:border-emerald-200 hover:bg-slate-50 hover:shadow-md"
      }`}
    >
      {item.plato.url_imagen ? (
        <Image
          src={item.plato.url_imagen}
          alt={item.plato.nombre}
          width={96}
          height={96}
          unoptimized
          className="h-24 w-24 shrink-0 object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 bg-emerald-50 text-emerald-700">
          <UtensilsCrossed className="h-6 w-6" />
          <span className="text-[10px] font-medium text-emerald-700/75">Sin foto</span>
        </div>
      )}
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {item.plato.tipo}
            </span>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{item.plato.nombre}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{item.plato.categoria}</p>
          </div>
          {selected ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 bg-white transition-colors group-hover:border-emerald-300" />
          )}
        </div>
      </div>
    </button>
  );
}

export default function PlanificadorPage() {
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50">
              <Image src="/logo-gm-verde-azul.png" alt="GM Express" width={96} height={96} className="h-14 w-auto object-contain" priority />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Planificador de Menús</h1>
              <p className="mt-1 text-sm text-slate-500">Carga el archivo Excel para actualizar la minuta de la semana.</p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Panel Administrativo
          </div>
        </div>
      </header>

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <UploadCloud className="h-4 w-4 text-emerald-600" />
                <span>Archivo (.xlsx)</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Carga el archivo Excel para actualizar la minuta de la semana.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  id="minuta"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="sr-only"
                />
                <Label
                  htmlFor="minuta"
                  className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 ${
                    loading ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <UploadCloud className="h-4 w-4 text-emerald-600" />
                  Seleccionar archivo
                </Label>
                <span className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  {file ? file.name : "Ningún archivo seleccionado"}
                </span>
              </div>

              {mensaje && (
                <div className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${mensaje.tipo === "exito" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                  {mensaje.tipo === "exito" && <CheckCircle className="h-4 w-4" />}
                  {mensaje.texto}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0 lg:flex-col xl:flex-row">
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Cargar
                  </>
                )}
              </Button>

              <a
                href={PLANTILLA_MINUTA_URL}
                download="formato-minuta.xlsx"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Download className="h-4 w-4" />
                Descargar Excel
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setEliminarSemanasOpen((actual) => !actual)}
          className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Eliminar semana cargada</h2>
              <p className="text-xs text-slate-500">
                Revisa y elimina una minuta ya procesada, siempre que no tenga pedidos asociados.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {semanas.length} semanas
            {eliminarSemanasOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </span>
        </button>

        {eliminarSemanasOpen && (
          <div className="border-t border-slate-100 bg-slate-50/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Selecciona con cuidado la semana exacta que quieres eliminar.</p>
              <Button variant="outline" size="sm" onClick={cargarSemanas} disabled={loadingSemanas} className="border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
                {loadingSemanas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Actualizar
              </Button>
            </div>

            {loadingSemanas ? (
              <div className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ) : semanas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-sm text-slate-500">
                No hay semanas cargadas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {semanas.map((semana) => (
                  <div key={semana.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {formatFechaCorta(semana.fecha_inicio)} - {formatFechaCorta(semana.fecha_fin)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          ID #{semana.id} · creada {new Date(semana.creado_en).toLocaleString("es-CL")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          semana.pedidos > 0 ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {semana.pedidos > 0 ? `${semana.pedidos} pedidos` : "Sin pedidos"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="font-medium">Platos/detalles</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{semana.detalles}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="font-medium">Menús elegidos</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{semana.seleccionesMenuDia}</p>
                      </div>
                    </div>

                    {semana.pedidos > 0 && (
                      <p className="mt-3 rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                        No se puede eliminar porque existen pedidos históricos asociados a esta semana.
                      </p>
                    )}

                    <Button
                      variant="destructive"
                      onClick={() => eliminarSemana(semana)}
                      disabled={semana.pedidos > 0 || eliminandoSemanaId !== null}
                      className="mt-4 w-full bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-300"
                    >
                      {eliminandoSemanaId === semana.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar semana
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-600">
              <UtensilsCrossed className="h-5 w-5" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Menú del día</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona el menú completo por fecha: entrada, fondo, guarnición y postre.
            </p>
          </div>

          <Button variant="outline" onClick={cargarMenuDia} disabled={loadingMenuDia} className="border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
            {loadingMenuDia ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
        </div>

        {menuDia?.menu && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            Semana del {menuDia.menu.fecha_inicio} al {menuDia.menu.fecha_fin}
          </div>
        )}

        <div className="space-y-5">
          {loadingMenuDia ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="min-h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4" />
            ))
          ) : menuDia?.dias.length ? (
            menuDia.dias.map((dia) => {
              const draft = dia.fecha ? drafts[dia.fecha] : undefined;
              const totalOpciones = dia.opciones.entradas.length + dia.opciones.fondos.length + dia.opciones.postres.length;
              const abierto = diaAbierto === dia.fecha;

              return (
                <div key={`${dia.dia}-${dia.fecha ?? "sin-fecha"}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setDiaAbierto((actual) => (actual === dia.fecha ? null : dia.fecha))}
                    className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div aria-label={dia.dia} className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white shadow-sm">
                        {LETRAS_DIA[dia.dia]}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-950">{dia.dia} {formatFechaCorta(dia.fecha)}</p>
                        <p className="text-xs text-slate-500">
                          {dia.seleccion ? "Menú guardado" : totalOpciones > 0 ? "Pendiente de selección" : "Sin platos cargados"}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {totalOpciones} opciones
                      {abierto ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </span>
                  </button>

                  {abierto && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                      {dia.seleccion && (
                        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                          Guardado: {dia.seleccion.entrada.plato.nombre} + {dia.seleccion.fondo.plato.nombre}
                          {dia.seleccion.guarnicion ? ` con ${dia.seleccion.guarnicion.nombre}` : ""} + {dia.seleccion.postre.plato.nombre}
                        </div>
                      )}

                  {totalOpciones === 0 ? (
                    <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                      Sin platos cargados para esta fecha
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Entrada</p>
                          <p className="text-xs text-slate-500">Elige una opción de inicio</p>
                        </div>
                        {dia.opciones.entradas.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500">Sin entradas</p>
                        ) : (
                          dia.opciones.entradas.map((item) => (
                            <MenuOptionCard
                              key={item.detalleId}
                              item={item}
                              selected={draft?.entradaId === item.detalleId}
                              onSelect={() => dia.fecha && actualizarDraft(dia.fecha, { entradaId: item.detalleId })}
                            />
                          ))
                        )}
                      </div>

                      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Fondo</p>
                          <p className="text-xs text-slate-500">Selecciona plato principal y guarnición</p>
                        </div>
                        {dia.opciones.fondos.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500">Sin fondos</p>
                        ) : (
                          dia.opciones.fondos.map((item) => (
                            <div key={item.detalleId} className="space-y-2">
                              <MenuOptionCard
                                item={item}
                                selected={draft?.fondoId === item.detalleId}
                                onSelect={() => dia.fecha && actualizarDraft(dia.fecha, { fondoId: item.detalleId, guarnicionId: null })}
                              />
                              {draft?.fondoId === item.detalleId && item.guarniciones.length > 0 && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Guarnición</p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.guarniciones.map((guarnicion) => (
                                      <button
                                        key={guarnicion.id}
                                        type="button"
                                        onClick={() => dia.fecha && actualizarDraft(dia.fecha, { guarnicionId: guarnicion.id })}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                          draft?.guarnicionId === guarnicion.id
                                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                        }`}
                                      >
                                        {guarnicion.nombre}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Postre</p>
                          <p className="text-xs text-slate-500">Cierra el menú completo</p>
                        </div>
                        {dia.opciones.postres.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500">Sin postres</p>
                        ) : (
                          dia.opciones.postres.map((item) => (
                            <MenuOptionCard
                              key={item.detalleId}
                              item={item}
                              selected={draft?.postreId === item.detalleId}
                              onSelect={() => dia.fecha && actualizarDraft(dia.fecha, { postreId: item.detalleId })}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}

                      {totalOpciones > 0 && (
                        <div className="mt-5 flex justify-end">
                          <Button
                            onClick={() => guardarMenuDia(dia)}
                            disabled={!dia.fecha || !menuDia?.menu || guardandoFecha !== null}
                            className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                          >
                            {guardandoFecha === dia.fecha ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar menú del día
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay minuta cargada para mostrar.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
