"use client";
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
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  UtensilsCrossed,
  FileSpreadsheet
} from "lucide-react";

import { 
  usePlanificador, 
  type PlatoMenuDia,
  type PlatoBebida,
  LETRAS_DIA, 
  formatFechaCorta, 
  PLANTILLA_MINUTA_URL,
  esEntradaSopa,
  esFondoHipocalorico,
  esFondoPlatoUnico,
  fondoOmiteGuarnicion,
  type ModalidadHipocalorica,
  obtenerEntradasEnsalada,
  tieneSopaCombinada,
} from "@/hooks/usePlanificador";

function MenuOptionCard({
  item,
  selected,
  onSelect,
  disabled = false,
  helperText,
  badge,
}: {
  item: PlatoMenuDia;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  helperText?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onSelect();
      }}
      disabled={disabled}
      className={`group flex w-full overflow-hidden rounded-md border text-left transition-all duration-200 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-55 grayscale"
          : selected
          ? "border-[#75AA46] bg-[#75AA46]/5 ring-1 ring-[#75AA46]/30 shadow-sm"
          : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {item.plato.url_imagen ? (
        <div className="relative h-20 w-20 shrink-0 bg-slate-100 border-r border-slate-100">
          <Image
            src={item.plato.url_imagen}
            alt={item.plato.nombre}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 bg-slate-50 border-r border-slate-100 text-[#1B2C56]">
          <UtensilsCrossed className="h-5 w-5 opacity-40" />
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Sin foto</span>
        </div>
      )}
      <div className="min-w-0 flex-1 p-2.5 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest mb-1 ${
               selected ? "bg-[#75AA46]/10 text-[#5d8a38]" : "bg-slate-100 text-slate-500"
            }`}>
              {item.plato.tipo}
            </span>
            {badge && (
              <span className="ml-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700">
                {badge}
              </span>
            )}
            <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-800">{item.plato.nombre}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{item.plato.categoria}</p>
            {helperText && <p className="mt-1 text-[10px] font-semibold text-slate-500">{helperText}</p>}
          </div>
          {selected ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#75AA46] mt-1" />
          ) : (
            <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 bg-white transition-colors group-hover:border-[#75AA46]/50" />
          )}
        </div>
      </div>
    </button>
  );
}

export default function PlanificadorPage() {
  const {
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
  } = usePlanificador();

  const actualizarEntradaDraft = (
    fecha: string,
    draftEntradaIds: number[],
    item: PlatoMenuDia,
    entradas: PlatoMenuDia[]
  ) => {
    const seleccionada = draftEntradaIds.includes(item.detalleId);
    const itemEsSopa = esEntradaSopa(item);
    const entradasSinSopa = draftEntradaIds.filter((id) => {
      const entrada = entradas.find((opcion) => opcion.detalleId === id);
      return entrada && !esEntradaSopa(entrada);
    });
    const siguiente = seleccionada
      ? draftEntradaIds.filter((id) => id !== item.detalleId)
      : itemEsSopa
        ? [item.detalleId]
        : entradasSinSopa.length >= 3
          ? entradasSinSopa
          : [...entradasSinSopa, item.detalleId];

    actualizarDraft(fecha, {
      entradaId: siguiente[0] ?? null,
      entradasIds: siguiente,
    });
  };

  const seleccionarEnsaladaSurtida = (fecha: string, entradas: PlatoMenuDia[]) => {
    const entradasIds = obtenerEntradasEnsalada(entradas).slice(0, 3).map((entrada) => entrada.detalleId);

    actualizarDraft(fecha, {
      entradaId: entradasIds[0] ?? null,
      entradasIds,
    });
  };

  const seleccionarFondoDraft = (fecha: string, item: PlatoMenuDia) => {
    actualizarDraft(fecha, {
      fondoId: item.detalleId,
      guarnicionId: null,
      modalidadHipocalorica: null,
    });
  };

  const seleccionarModalidadHipocalorica = (
    fecha: string,
    modalidad: ModalidadHipocalorica,
    draftEntradaIds: number[],
    entradas: PlatoMenuDia[]
  ) => {
    if (modalidad === "SOPA_CREMA") {
      const primeraSopa = draftEntradaIds
        .map((id) => entradas.find((entrada) => entrada.detalleId === id))
        .find((entrada): entrada is PlatoMenuDia => Boolean(entrada) && esEntradaSopa(entrada));
      const entradasIds = primeraSopa ? [primeraSopa.detalleId] : [];

      actualizarDraft(fecha, {
        modalidadHipocalorica: modalidad,
        entradaId: entradasIds[0] ?? null,
        entradasIds,
        guarnicionId: null,
      });
      return;
    }

    actualizarDraft(fecha, {
      modalidadHipocalorica: modalidad,
      entradaId: null,
      entradasIds: [],
      guarnicionId: null,
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-6 bg-slate-50 min-h-screen">
      {/* Header Corporativo */}
      <header className="border-b border-slate-200 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#75AA46]"></span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Módulo Operativo</p>
          </div>
          <h1 className="text-2xl font-bold text-[#1B2C56] tracking-tight">Planificador de Menús</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión y programación de la minuta semanal vía importación de datos.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
          <CalendarDays className="h-4 w-4 text-[#1B2C56]" />
          <span className="text-xs font-semibold text-slate-700">Semana Actual</span>
        </div>
      </header>

      {/* Tarjeta de Importación de Excel */}
      <Card className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-[#1B2C56]"></div>
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1B2C56] uppercase tracking-wider mb-2">
                <FileSpreadsheet className="h-5 w-5 text-[#75AA46]" />
                <span>Importación de Datos (.xlsx)</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Sube el archivo estructurado para actualizar la base de platos de toda la semana.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#1B2C56]/40 hover:bg-slate-100 ${
                    loading ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <UploadCloud className="h-4 w-4 text-slate-500" />
                  Explorar archivo
                </Label>
                <span className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 font-medium shadow-inner">
                  {file ? file.name : "Ningún archivo seleccionado..."}
                </span>
              </div>

              {mensaje && (
                <div className={`mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium border ${mensaje.tipo === "exito" ? "bg-[#75AA46]/10 text-[#5d8a38] border-[#75AA46]/20" : "bg-red-50 text-red-800 border-red-200"}`}>
                  {mensaje.tipo === "exito" && <CheckCircle className="h-4 w-4" />}
                  {mensaje.texto}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0 lg:flex-col xl:flex-row border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="bg-[#75AA46] text-white shadow-sm hover:bg-[#5d8a38] font-semibold h-9"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Cargar Minuta
                  </>
                )}
              </Button>

              <a
                href={PLANTILLA_MINUTA_URL}
                download="formato-minuta.xlsx"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 text-slate-400" />
                Descargar Plantilla
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección Gestión de Semanas */}
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setEliminarSemanasOpen((actual) => !actual)}
          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Historial y Gestión de Semanas</h2>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">
                Revisión y depuración de registros procesados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {semanas.length} registros
            </span>
            {eliminarSemanasOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </button>

        {eliminarSemanasOpen && (
          <div className="border-t border-slate-100 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 font-medium">Selecciona con precaución la semana a eliminar. No reversible.</p>
              <Button variant="outline" size="sm" onClick={cargarSemanas} disabled={loadingSemanas} className="h-8 text-xs font-semibold bg-white shadow-sm">
                {loadingSemanas ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
                Sincronizar
              </Button>
            </div>

            {loadingSemanas ? (
              <div className="h-24 animate-pulse rounded-md border border-slate-200 bg-white" />
            ) : semanas.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm font-medium text-slate-400">
                El historial de minutas está vacío.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {semanas.map((semana) => (
                  <div key={semana.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-bold text-[#1B2C56] text-sm">
                            {formatFechaCorta(semana.fecha_inicio)} al {formatFechaCorta(semana.fecha_fin)}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            ID: {semana.id} · Creado: {new Date(semana.creado_en).toLocaleDateString("es-CL")}
                          </p>
                        </div>
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            semana.pedidos > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-[#75AA46]/30 bg-[#75AA46]/10 text-[#5d8a38]"
                        }`}>
                          {semana.pedidos > 0 ? `${semana.pedidos} pedidos activos` : "Sin uso"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded border border-slate-100 bg-slate-50 p-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Platos</p>
                          <p className="mt-0.5 text-sm font-bold text-slate-800">{semana.detalles}</p>
                        </div>
                        <div className="rounded border border-slate-100 bg-slate-50 p-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Menús Armados</p>
                          <p className="mt-0.5 text-sm font-bold text-slate-800">{semana.seleccionesMenuDia}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {semana.pedidos > 0 ? (
                        <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                           <Clock className="h-3 w-3" /> Bloqueado por historial
                        </p>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => eliminarSemana(semana)}
                          disabled={eliminandoSemanaId !== null}
                          className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors h-8 text-xs font-semibold"
                        >
                          {eliminandoSemanaId === semana.id ? (
                            <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Depurando...</>
                          ) : (
                            <><Trash2 className="mr-1.5 h-3 w-3" /> Eliminar Registro</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Programación Diaria */}
      <section className="space-y-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed className="h-4 w-4 text-[#75AA46]" />
              <h2 className="text-lg font-bold text-[#1B2C56]">Programación Diaria</h2>
            </div>
            <p className="text-sm text-slate-500">
              Estructura el menú final (Entrada, Fondo, Guarnición, Postre, Bebida) que verán los clientes.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={cargarMenuDia} disabled={loadingMenuDia} className="h-8 font-semibold bg-white shadow-sm text-slate-700">
            {loadingMenuDia ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar Vista
          </Button>
        </div>

        {menuDia?.menu && (
          <div className="flex items-center gap-2 rounded-md border-l-4 border-l-[#1B2C56] bg-blue-50/50 px-4 py-3 text-sm font-semibold text-[#1B2C56]">
            <CalendarDays className="h-4 w-4 text-[#1B2C56]" />
            Semana activa: {menuDia.menu.fecha_inicio} al {menuDia.menu.fecha_fin}
          </div>
        )}

        <div className="space-y-4 pt-2">
          {loadingMenuDia ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-md border border-slate-100 bg-slate-50" />
            ))
          ) : menuDia?.dias.length ? (
            menuDia.dias.map((dia) => {
              const draft = dia.fecha ? drafts[dia.fecha] : undefined;
              const totalOpciones = dia.opciones.entradas.length + dia.opciones.fondos.length + dia.opciones.postres.length;
              const abierto = diaAbierto === dia.fecha;
              const entradasIds = draft?.entradasIds?.length
                ? draft.entradasIds
                : draft?.entradaId
                  ? [draft.entradaId]
                  : [];
              const entradasSeleccionadas = entradasIds
                .map((id) => dia.opciones.entradas.find((entrada) => entrada.detalleId === id))
                .filter((entrada): entrada is PlatoMenuDia => Boolean(entrada));
              const entradasEnsalada = obtenerEntradasEnsalada(dia.opciones.entradas);
              const ensaladaSurtidaIds = entradasEnsalada.slice(0, 3).map((entrada) => entrada.detalleId);
              const ensaladaSurtidaSeleccionada =
                entradasIds.length === 3 && ensaladaSurtidaIds.every((id) => entradasIds.includes(id));
              const bebidaSeleccionada = bebidas.find((bebida) => bebida.id === draft?.bebidaPlatoId);
              const fondoSeleccionado = dia.opciones.fondos.find((fondo) => fondo.detalleId === draft?.fondoId);
              const fondoEsHipocalorico = esFondoHipocalorico(fondoSeleccionado);
              const modalidadHipocalorica = draft?.modalidadHipocalorica ?? null;
              const hipocaloricoSopa = fondoEsHipocalorico && modalidadHipocalorica === "SOPA_CREMA";
              const hipocaloricoDoblePostre = fondoEsHipocalorico && modalidadHipocalorica === "DOBLE_POSTRE";
              const entradaBloqueadaPorHipocalorico = fondoEsHipocalorico && !modalidadHipocalorica;
              const sopaCombinada = tieneSopaCombinada(entradasSeleccionadas);
              const bebidaPendiente = totalOpciones > 0 && !draft?.bebidaPlatoId;
              const puedeGuardarDia =
                Boolean(
                  dia.fecha &&
                  menuDia?.menu &&
                  draft?.fondoId &&
                  draft?.postreId &&
                  draft?.bebidaPlatoId &&
                  !sopaCombinada &&
                  (!fondoEsHipocalorico || modalidadHipocalorica)
                ) &&
                guardandoFecha === null;

              return (
                <div key={`${dia.dia}-${dia.fecha ?? "sin-fecha"}`} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setDiaAbierto((actual) => (actual === dia.fecha ? null : dia.fecha))}
                    className={`flex w-full items-center justify-between p-3.5 transition-colors ${abierto ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div aria-label={dia.dia} className={`flex h-10 w-10 items-center justify-center rounded-md font-bold text-white shadow-inner ${abierto ? 'bg-[#75AA46]' : 'bg-[#1B2C56]'}`}>
                        {LETRAS_DIA[dia.dia]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{dia.dia} {formatFechaCorta(dia.fecha)}</p>
                        <p className="text-[11px] font-medium uppercase tracking-wide mt-0.5 text-slate-500">
                          {dia.seleccion ? (
                            <span className="text-[#5d8a38] flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Configurado</span>
                          ) : totalOpciones > 0 ? (
                            <span className="text-amber-600">Pendiente</span>
                          ) : (
                            "Sin datos"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {totalOpciones} disp.
                       </span>
                      {abierto ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </div>
                  </button>

                  {abierto && (
                    <div className="bg-slate-50/50 p-5">
                      {dia.seleccion && (
                        <div className="mb-5 rounded border border-[#75AA46]/30 bg-white p-3 text-xs shadow-sm flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-[#75AA46] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-[#1B2C56] uppercase tracking-wide mb-1">Menú Establecido</p>
                            <p className="text-slate-600 font-medium">
                               {dia.seleccion.entradaDisplay ?? dia.seleccion.entrada.plato.nombre} <span className="text-slate-300 mx-1">|</span> 
                               {dia.seleccion.fondo.plato.nombre} {dia.seleccion.guarnicion ? ` + ${dia.seleccion.guarnicion.nombre}` : ""} <span className="text-slate-300 mx-1">|</span> 
                               {dia.seleccion.postre.plato.nombre}
                               {dia.seleccion.bebida ? <><span className="text-slate-300 mx-1">|</span> {dia.seleccion.bebida.nombre}</> : null}
                            </p>
                          </div>
                        </div>
                      )}

                  {totalOpciones === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                       <UtensilsCrossed className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                       <p className="text-sm font-semibold text-slate-500">Día sin programar</p>
                       <p className="text-xs text-slate-400 mt-1">Sube un Excel para cargar los platos de este día.</p>
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
                      {/* Entradas */}
                      <div className="space-y-3">
                        <div className="border-b border-slate-200 pb-2">
                          <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">1. Entrada</p>
                        </div>
                        {dia.opciones.entradas.length === 0 ? (
                          <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">No disponible</p>
                        ) : (
                          <>
                            {hipocaloricoDoblePostre && (
                              <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                                Entrada reemplazada por doble postre.
                              </p>
                            )}
                            {entradaBloqueadaPorHipocalorico && (
                              <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                                Selecciona primero la modalidad hipocalorica.
                              </p>
                            )}
                            {entradasEnsalada.length >= 3 && !fondoEsHipocalorico && (
                              <button
                                type="button"
                                onClick={() => dia.fecha && seleccionarEnsaladaSurtida(dia.fecha, dia.opciones.entradas)}
                                className={`group flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition-all duration-200 ${
                                  ensaladaSurtidaSeleccionada
                                    ? "border-[#75AA46] bg-[#75AA46]/10 ring-1 ring-[#75AA46]/30 shadow-sm"
                                    : "border-[#1B2C56]/20 bg-white shadow-sm hover:border-[#75AA46]/50 hover:bg-[#75AA46]/5"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[#1B2C56]">Ensalada surtida</p>
                                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                    Selecciona las 3 ensaladas.
                                  </p>
                                </div>
                                {ensaladaSurtidaSeleccionada ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#75AA46]" />
                                ) : (
                                  <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 bg-white transition-colors group-hover:border-[#75AA46]/50" />
                                )}
                              </button>
                            )}
                            {dia.opciones.entradas.map((item) => {
                              const esSopaOCrema = esEntradaSopa(item);
                              const entradaDeshabilitada =
                                hipocaloricoDoblePostre ||
                                entradaBloqueadaPorHipocalorico ||
                                (hipocaloricoSopa && !esSopaOCrema);

                              return (
                                <MenuOptionCard
                                  key={item.detalleId}
                                  item={item}
                                  selected={entradasIds.includes(item.detalleId)}
                                  disabled={entradaDeshabilitada}
                                  helperText={hipocaloricoSopa && !esSopaOCrema ? "No disponible para sopa/crema" : undefined}
                                  onSelect={() => dia.fecha && actualizarEntradaDraft(dia.fecha, entradasIds, item, dia.opciones.entradas)}
                                />
                              );
                            })}
                          </>
                        )}
                        {sopaCombinada && (
                          <p className="rounded border border-red-200 bg-red-50 p-2 text-[11px] font-semibold text-red-700">
                            La sopa cuenta como entrada completa y no puede combinarse con ensaladas.
                          </p>
                        )}
                      </div>

                      {/* Fondos */}
                      <div className="space-y-3">
                        <div className="border-b border-slate-200 pb-2">
                          <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">2. Fondo & Guarnición</p>
                        </div>
                        {dia.opciones.fondos.length === 0 ? (
                          <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">No disponible</p>
                        ) : (
                          dia.opciones.fondos.map((item) => (
                            <div key={item.detalleId} className="space-y-2">
                              <MenuOptionCard
                                item={item}
                                selected={draft?.fondoId === item.detalleId}
                                onSelect={() => dia.fecha && seleccionarFondoDraft(dia.fecha, item)}
                              />
                              {draft?.fondoId === item.detalleId && esFondoPlatoUnico(item) && (
                                <p className="ml-4 rounded border border-blue-200 bg-blue-50 p-3 text-[11px] font-semibold text-blue-800">
                                  Este fondo corresponde a plato unico y no requiere guarnicion.
                                </p>
                              )}
                              {draft?.fondoId === item.detalleId && esFondoHipocalorico(item) && (
                                <div className="ml-4 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-sm">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Modalidad hipocalorica</p>
                                    <p className="mt-1 text-[11px] font-medium text-amber-700">No requiere guarnicion. Selecciona como se reemplaza la entrada.</p>
                                  </div>
                                  <div className="grid gap-2">
                                    <button
                                      type="button"
                                      onClick={() => dia.fecha && seleccionarModalidadHipocalorica(dia.fecha, "SOPA_CREMA", entradasIds, dia.opciones.entradas)}
                                      className={`rounded border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                        modalidadHipocalorica === "SOPA_CREMA"
                                          ? "border-[#75AA46] bg-[#75AA46] text-white shadow-sm"
                                          : "border-amber-200 bg-white text-amber-800 hover:border-[#75AA46]/50"
                                      }`}
                                    >
                                      Sopa/Crema del dia
                                      <span className="mt-0.5 block text-[10px] font-semibold opacity-80">Permite seleccionar solo una sopa o crema.</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => dia.fecha && seleccionarModalidadHipocalorica(dia.fecha, "DOBLE_POSTRE", entradasIds, dia.opciones.entradas)}
                                      className={`rounded border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                        modalidadHipocalorica === "DOBLE_POSTRE"
                                          ? "border-[#75AA46] bg-[#75AA46] text-white shadow-sm"
                                          : "border-amber-200 bg-white text-amber-800 hover:border-[#75AA46]/50"
                                      }`}
                                    >
                                      Doble postre
                                      <span className="mt-0.5 block text-[10px] font-semibold opacity-80">Entrada bloqueada. Requiere soporte futuro para persistir x2.</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                              {draft?.fondoId === item.detalleId && item.guarniciones.length > 0 && !fondoOmiteGuarnicion(item) && (
                                <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm ml-4 relative before:absolute before:left-[-16px] before:top-4 before:h-px before:w-4 before:bg-slate-300">
                                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Seleccionar Guarnición</p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.guarniciones.map((guarnicion) => (
                                      <button
                                        key={guarnicion.id}
                                        type="button"
                                        onClick={() => dia.fecha && actualizarDraft(dia.fecha, { guarnicionId: guarnicion.id })}
                                        className={`rounded border px-3 py-1.5 text-xs font-bold transition-colors ${
                                          draft?.guarnicionId === guarnicion.id
                                            ? "border-[#75AA46] bg-[#75AA46] text-white shadow-sm"
                                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
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

                      {/* Postres */}
                      <div className="space-y-3">
                        <div className="border-b border-slate-200 pb-2">
                          <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">
                            3. Postre
                            {hipocaloricoDoblePostre && (
                              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700">x2</span>
                            )}
                          </p>
                          {hipocaloricoDoblePostre && (
                            <p className="mt-1 text-[11px] font-semibold text-amber-700">Modalidad visual: doble postre. No se persiste x2 con el contrato actual.</p>
                          )}
                        </div>
                        {dia.opciones.postres.length === 0 ? (
                          <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">No disponible</p>
                        ) : (
                          dia.opciones.postres.map((item) => (
                            <MenuOptionCard
                              key={item.detalleId}
                              item={item}
                              selected={draft?.postreId === item.detalleId}
                              badge={hipocaloricoDoblePostre ? "x2" : undefined}
                              onSelect={() => dia.fecha && actualizarDraft(dia.fecha, { postreId: item.detalleId })}
                            />
                          ))
                        )}
                      </div>

                      {/* Bebida */}
                      <div className="space-y-3">
                        <div className="border-b border-slate-200 pb-2">
                          <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">4. Bebida especial del día</p>
                          <p className="mt-1 text-[11px] font-medium text-slate-500">
                            Esta bebida reemplazará el &quot;Jugo del día&quot; solo para empresas cuyo convenio permita la categoría seleccionada. Las empresas sin convenio especial seguirán recibiendo &quot;Jugo del día&quot;.
                          </p>
                        </div>
                        {bebidaSeleccionada && (
                          <div className="rounded-md border border-[#75AA46]/20 bg-[#75AA46]/5 p-3 text-xs">
                            <p className="font-bold uppercase tracking-wide text-[#5d8a38]">Bebida especial seleccionada</p>
                            <p className="mt-1 font-semibold text-slate-700">{bebidaSeleccionada.nombre}</p>
                          </div>
                        )}
                        {bebidaPendiente && (
                          <p className="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] font-semibold text-amber-700">
                            Debes seleccionar una bebida especial del día. Solo será visible para empresas cuyo convenio permita bebida o agua saborizada; las demás seguirán viendo Jugo del día.
                          </p>
                        )}
                        {loadingBebidas ? (
                          <div className="h-16 animate-pulse rounded-md border border-slate-100 bg-white" />
                        ) : bebidas.length === 0 ? (
                          <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">No hay bebidas especiales disponibles</p>
                        ) : (
                          bebidas.map((bebida) => (
                            <BebidaOptionCard
                              key={bebida.id}
                              item={bebida}
                              selected={draft?.bebidaPlatoId === bebida.id}
                              onSelect={() => dia.fecha && actualizarDraft(dia.fecha, { bebidaPlatoId: bebida.id })}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}

                      {totalOpciones > 0 && (
                        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
                          <Button
                            onClick={() => guardarMenuDia(dia)}
                            disabled={!puedeGuardarDia}
                            className="bg-[#1B2C56] text-white shadow-sm hover:bg-[#122042] font-semibold px-6"
                          >
                            {guardandoFecha === dia.fecha ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando en base de datos...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Confirmar Menú del Día
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
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-500">No hay configuración activa para esta semana.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function BebidaOptionCard({
  item,
  selected,
  onSelect,
}: {
  item: PlatoBebida;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full overflow-hidden rounded-md border text-left transition-all duration-200 ${
        selected
          ? "border-[#75AA46] bg-[#75AA46]/5 ring-1 ring-[#75AA46]/30 shadow-sm"
          : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {item.url_imagen ? (
        <div className="relative h-16 w-16 shrink-0 bg-slate-100 border-r border-slate-100">
          <Image
            src={item.url_imagen}
            alt={item.nombre}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 bg-slate-50 border-r border-slate-100 text-[#1B2C56]">
          <UtensilsCrossed className="h-4 w-4 opacity-40" />
          <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Sin foto</span>
        </div>
      )}
      <div className="min-w-0 flex-1 p-2.5 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest mb-1 ${
               selected ? "bg-[#75AA46]/10 text-[#5d8a38]" : "bg-slate-100 text-slate-500"
            }`}>
              {item.categoria}
            </span>
            <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-800">{item.nombre}</p>
          </div>
          {selected ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#75AA46] mt-1" />
          ) : (
            <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 bg-white transition-colors group-hover:border-[#75AA46]/50" />
          )}
        </div>
      </div>
    </button>
  );
}
