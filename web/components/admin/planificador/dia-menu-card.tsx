import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Save, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  esEntradaSopa,
  esFondoHipocalorico,
  esFondoPlatoUnico,
  fondoOmiteGuarnicion,
  formatFechaCorta,
  LETRAS_DIA,
  obtenerEntradasEnsalada,
  tieneSopaCombinada,
  type DiaMenu,
  type DraftMenuDia,
  type ModalidadHipocalorica,
  type PlatoBebida,
  type PlatoMenuDia,
} from "@/hooks/usePlanificador";
import { BebidaOptionCard, MenuOptionCard } from "./menu-option-card";

type ActualizarDraft = (fecha: string, cambios: Partial<DraftMenuDia>) => void;

export type DiaMenuSelectionHandlers = {
  actualizarEntradaDraft: (
    fecha: string,
    draftEntradaIds: number[],
    item: PlatoMenuDia,
    entradas: PlatoMenuDia[]
  ) => void;
  seleccionarEnsaladaSurtida: (fecha: string, entradas: PlatoMenuDia[]) => void;
  seleccionarFondoDraft: (fecha: string, item: PlatoMenuDia) => void;
  seleccionarModalidadHipocalorica: (
    fecha: string,
    modalidad: ModalidadHipocalorica,
    draftEntradaIds: number[],
    entradas: PlatoMenuDia[]
  ) => void;
};

export function DiaMenuCard({
  dia,
  draft,
  abierto,
  totalOpciones,
  bebidas,
  loadingBebidas,
  guardandoFecha,
  menuActivo,
  onToggle,
  onActualizarDraft,
  onGuardarMenuDia,
  selectionHandlers,
}: {
  dia: DiaMenu;
  draft: DraftMenuDia | undefined;
  abierto: boolean;
  totalOpciones: number;
  bebidas: PlatoBebida[];
  loadingBebidas: boolean;
  guardandoFecha: string | null;
  menuActivo: boolean;
  onToggle: () => void;
  onActualizarDraft: ActualizarDraft;
  onGuardarMenuDia: (dia: DiaMenu) => void;
  selectionHandlers: DiaMenuSelectionHandlers;
}) {
  const entradasIds = draft?.entradasIds?.length ? draft.entradasIds : draft?.entradaId ? [draft.entradaId] : [];
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
        menuActivo &&
        draft?.fondoId &&
        draft?.postreId &&
        draft?.bebidaPlatoId &&
        !sopaCombinada &&
        (!fondoEsHipocalorico || modalidadHipocalorica)
    ) && guardandoFecha === null;

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between p-3.5 transition-colors ${
          abierto ? "bg-slate-50 border-b border-slate-200" : "hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            aria-label={dia.dia}
            className={`flex h-10 w-10 items-center justify-center rounded-md font-bold text-white shadow-inner ${
              abierto ? "bg-[#75AA46]" : "bg-[#1B2C56]"
            }`}
          >
            {LETRAS_DIA[dia.dia]}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">
              {dia.dia} {formatFechaCorta(dia.fecha)}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wide mt-0.5 text-slate-500">
              {dia.seleccion ? (
                <span className="text-[#5d8a38] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configurado
                </span>
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
          {dia.seleccion && <MenuDiaResumen dia={dia} />}

          {totalOpciones === 0 ? (
            <DiaSinProgramar />
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
              <EntradasColumn
                dia={dia}
                entradasIds={entradasIds}
                entradasEnsalada={entradasEnsalada}
                ensaladaSurtidaSeleccionada={ensaladaSurtidaSeleccionada}
                fondoEsHipocalorico={fondoEsHipocalorico}
                hipocaloricoSopa={hipocaloricoSopa}
                hipocaloricoDoblePostre={hipocaloricoDoblePostre}
                entradaBloqueadaPorHipocalorico={entradaBloqueadaPorHipocalorico}
                sopaCombinada={sopaCombinada}
                selectionHandlers={selectionHandlers}
              />

              <FondosColumn
                dia={dia}
                draft={draft}
                entradasIds={entradasIds}
                modalidadHipocalorica={modalidadHipocalorica}
                onActualizarDraft={onActualizarDraft}
                selectionHandlers={selectionHandlers}
              />

              <PostresColumn
                dia={dia}
                draft={draft}
                hipocaloricoDoblePostre={hipocaloricoDoblePostre}
                onActualizarDraft={onActualizarDraft}
              />

              <BebidasColumn
                dia={dia}
                draft={draft}
                bebidas={bebidas}
                bebidaSeleccionada={bebidaSeleccionada}
                bebidaPendiente={bebidaPendiente}
                loadingBebidas={loadingBebidas}
                onActualizarDraft={onActualizarDraft}
              />
            </div>
          )}

          {totalOpciones > 0 && (
            <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
              <Button
                onClick={() => onGuardarMenuDia(dia)}
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
}

function MenuDiaResumen({ dia }: { dia: DiaMenu }) {
  if (!dia.seleccion) return null;

  return (
    <div className="mb-5 rounded border border-[#75AA46]/30 bg-white p-3 text-xs shadow-sm flex items-start gap-3">
      <CheckCircle2 className="h-4 w-4 text-[#75AA46] shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-[#1B2C56] uppercase tracking-wide mb-1">Menú Establecido</p>
        <p className="text-slate-600 font-medium">
          {dia.seleccion.entradaDisplay ?? dia.seleccion.entrada.plato.nombre}{" "}
          <span className="text-slate-300 mx-1">|</span>
          {dia.seleccion.fondo.plato.nombre}
          {dia.seleccion.guarnicion ? ` + ${dia.seleccion.guarnicion.nombre}` : ""}{" "}
          <span className="text-slate-300 mx-1">|</span>
          {dia.seleccion.postre.plato.nombre}
          {dia.seleccion.bebida ? (
            <>
              <span className="text-slate-300 mx-1">|</span> {dia.seleccion.bebida.nombre}
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function DiaSinProgramar() {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
      <UtensilsCrossed className="h-8 w-8 text-slate-300 mx-auto mb-2" />
      <p className="text-sm font-semibold text-slate-500">Día sin programar</p>
      <p className="text-xs text-slate-400 mt-1">Sube un Excel para cargar los platos de este día.</p>
    </div>
  );
}

function EntradasColumn({
  dia,
  entradasIds,
  entradasEnsalada,
  ensaladaSurtidaSeleccionada,
  fondoEsHipocalorico,
  hipocaloricoSopa,
  hipocaloricoDoblePostre,
  entradaBloqueadaPorHipocalorico,
  sopaCombinada,
  selectionHandlers,
}: {
  dia: DiaMenu;
  entradasIds: number[];
  entradasEnsalada: PlatoMenuDia[];
  ensaladaSurtidaSeleccionada: boolean;
  fondoEsHipocalorico: boolean;
  hipocaloricoSopa: boolean;
  hipocaloricoDoblePostre: boolean;
  entradaBloqueadaPorHipocalorico: boolean;
  sopaCombinada: boolean;
  selectionHandlers: DiaMenuSelectionHandlers;
}) {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">1. Entrada</p>
      </div>
      {dia.opciones.entradas.length === 0 ? (
        <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">
          No disponible
        </p>
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
              onClick={() => dia.fecha && selectionHandlers.seleccionarEnsaladaSurtida(dia.fecha, dia.opciones.entradas)}
              className={`group flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition-all duration-200 ${
                ensaladaSurtidaSeleccionada
                  ? "border-[#75AA46] bg-[#75AA46]/10 ring-1 ring-[#75AA46]/30 shadow-sm"
                  : "border-[#1B2C56]/20 bg-white shadow-sm hover:border-[#75AA46]/50 hover:bg-[#75AA46]/5"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1B2C56]">Ensalada surtida</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">Selecciona las 3 ensaladas.</p>
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
              hipocaloricoDoblePostre || entradaBloqueadaPorHipocalorico || (hipocaloricoSopa && !esSopaOCrema);

            return (
              <MenuOptionCard
                key={item.detalleId}
                item={item}
                selected={entradasIds.includes(item.detalleId)}
                disabled={entradaDeshabilitada}
                helperText={hipocaloricoSopa && !esSopaOCrema ? "No disponible para sopa/crema" : undefined}
                onSelect={() =>
                  dia.fecha &&
                  selectionHandlers.actualizarEntradaDraft(dia.fecha, entradasIds, item, dia.opciones.entradas)
                }
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
  );
}

function FondosColumn({
  dia,
  draft,
  entradasIds,
  modalidadHipocalorica,
  onActualizarDraft,
  selectionHandlers,
}: {
  dia: DiaMenu;
  draft: DraftMenuDia | undefined;
  entradasIds: number[];
  modalidadHipocalorica: ModalidadHipocalorica | null;
  onActualizarDraft: ActualizarDraft;
  selectionHandlers: DiaMenuSelectionHandlers;
}) {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">2. Fondo & Guarnición</p>
      </div>
      {dia.opciones.fondos.length === 0 ? (
        <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">
          No disponible
        </p>
      ) : (
        dia.opciones.fondos.map((item) => (
          <div key={item.detalleId} className="space-y-2">
            <MenuOptionCard
              item={item}
              selected={draft?.fondoId === item.detalleId}
              onSelect={() => dia.fecha && selectionHandlers.seleccionarFondoDraft(dia.fecha, item)}
            />
            {draft?.fondoId === item.detalleId && esFondoPlatoUnico(item) && (
              <p className="ml-4 rounded border border-blue-200 bg-blue-50 p-3 text-[11px] font-semibold text-blue-800">
                Este fondo corresponde a plato unico y no requiere guarnicion.
              </p>
            )}
            {draft?.fondoId === item.detalleId && esFondoHipocalorico(item) && (
              <div className="ml-4 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Modalidad hipocalorica
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-amber-700">
                    No requiere guarnicion. Selecciona como se reemplaza la entrada.
                  </p>
                </div>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      dia.fecha &&
                      selectionHandlers.seleccionarModalidadHipocalorica(
                        dia.fecha,
                        "SOPA_CREMA",
                        entradasIds,
                        dia.opciones.entradas
                      )
                    }
                    className={`rounded border px-3 py-2 text-left text-xs font-bold transition-colors ${
                      modalidadHipocalorica === "SOPA_CREMA"
                        ? "border-[#75AA46] bg-[#75AA46] text-white shadow-sm"
                        : "border-amber-200 bg-white text-amber-800 hover:border-[#75AA46]/50"
                    }`}
                  >
                    Sopa/Crema del dia
                    <span className="mt-0.5 block text-[10px] font-semibold opacity-80">
                      Permite seleccionar solo una sopa o crema.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dia.fecha &&
                      selectionHandlers.seleccionarModalidadHipocalorica(
                        dia.fecha,
                        "DOBLE_POSTRE",
                        entradasIds,
                        dia.opciones.entradas
                      )
                    }
                    className={`rounded border px-3 py-2 text-left text-xs font-bold transition-colors ${
                      modalidadHipocalorica === "DOBLE_POSTRE"
                        ? "border-[#75AA46] bg-[#75AA46] text-white shadow-sm"
                        : "border-amber-200 bg-white text-amber-800 hover:border-[#75AA46]/50"
                    }`}
                  >
                    Doble postre
                    <span className="mt-0.5 block text-[10px] font-semibold opacity-80">
                      Entrada bloqueada. Requiere soporte futuro para persistir x2.
                    </span>
                  </button>
                </div>
              </div>
            )}
            {draft?.fondoId === item.detalleId && item.guarniciones.length > 0 && !fondoOmiteGuarnicion(item) && (
              <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm ml-4 relative before:absolute before:left-[-16px] before:top-4 before:h-px before:w-4 before:bg-slate-300">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Seleccionar Guarnición
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.guarniciones.map((guarnicion) => (
                    <button
                      key={guarnicion.id}
                      type="button"
                      onClick={() => dia.fecha && onActualizarDraft(dia.fecha, { guarnicionId: guarnicion.id })}
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
  );
}

function PostresColumn({
  dia,
  draft,
  hipocaloricoDoblePostre,
  onActualizarDraft,
}: {
  dia: DiaMenu;
  draft: DraftMenuDia | undefined;
  hipocaloricoDoblePostre: boolean;
  onActualizarDraft: ActualizarDraft;
}) {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">
          3. Postre
          {hipocaloricoDoblePostre && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700">
              x2
            </span>
          )}
        </p>
        {hipocaloricoDoblePostre && (
          <p className="mt-1 text-[11px] font-semibold text-amber-700">
            Modalidad visual: doble postre. No se persiste x2 con el contrato actual.
          </p>
        )}
      </div>
      {dia.opciones.postres.length === 0 ? (
        <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">
          No disponible
        </p>
      ) : (
        dia.opciones.postres.map((item) => (
          <MenuOptionCard
            key={item.detalleId}
            item={item}
            selected={draft?.postreId === item.detalleId}
            badge={hipocaloricoDoblePostre ? "x2" : undefined}
            onSelect={() => dia.fecha && onActualizarDraft(dia.fecha, { postreId: item.detalleId })}
          />
        ))
      )}
    </div>
  );
}

function BebidasColumn({
  dia,
  draft,
  bebidas,
  bebidaSeleccionada,
  bebidaPendiente,
  loadingBebidas,
  onActualizarDraft,
}: {
  dia: DiaMenu;
  draft: DraftMenuDia | undefined;
  bebidas: PlatoBebida[];
  bebidaSeleccionada: PlatoBebida | undefined;
  bebidaPendiente: boolean;
  loadingBebidas: boolean;
  onActualizarDraft: ActualizarDraft;
}) {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-widest">4. Bebida especial del día</p>
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          Esta bebida reemplazará el &quot;Jugo del día&quot; solo para empresas cuyo convenio permita la categoría
          seleccionada. Las empresas sin convenio especial seguirán recibiendo &quot;Jugo del día&quot;.
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
          Debes seleccionar una bebida especial del día. Solo será visible para empresas cuyo convenio permita bebida o
          agua saborizada; las demás seguirán viendo Jugo del día.
        </p>
      )}
      {loadingBebidas ? (
        <div className="h-16 animate-pulse rounded-md border border-slate-100 bg-white" />
      ) : bebidas.length === 0 ? (
        <p className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400 text-center">
          No hay bebidas especiales disponibles
        </p>
      ) : (
        bebidas.map((bebida) => (
          <BebidaOptionCard
            key={bebida.id}
            item={bebida}
            selected={draft?.bebidaPlatoId === bebida.id}
            onSelect={() => dia.fecha && onActualizarDraft(dia.fecha, { bebidaPlatoId: bebida.id })}
          />
        ))
      )}
    </div>
  );
}
