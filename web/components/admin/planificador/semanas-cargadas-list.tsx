import { ChevronDown, ChevronUp, Clock, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFechaCorta, type SemanaCargada } from "@/hooks/usePlanificador";

export function SemanasCargadasList({
  semanas,
  loadingSemanas,
  eliminandoSemanaId,
  open,
  onToggleOpen,
  onSync,
  onEliminarSemana,
}: {
  semanas: SemanaCargada[];
  loadingSemanas: boolean;
  eliminandoSemanaId: number | null;
  open: boolean;
  onToggleOpen: () => void;
  onSync: () => void;
  onEliminarSemana: (semana: SemanaCargada) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggleOpen}
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
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Selecciona con precaución la semana a eliminar. No reversible.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={loadingSemanas}
              className="h-8 text-xs font-semibold bg-white shadow-sm"
            >
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
                <div
                  key={semana.id}
                  className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between"
                >
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
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          semana.pedidos > 0
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-[#75AA46]/30 bg-[#75AA46]/10 text-[#5d8a38]"
                        }`}
                      >
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
                        onClick={() => onEliminarSemana(semana)}
                        disabled={eliminandoSemanaId !== null}
                        className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors h-8 text-xs font-semibold"
                      >
                        {eliminandoSemanaId === semana.id ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Depurando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-1.5 h-3 w-3" /> Eliminar Registro
                          </>
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
  );
}
