import { CalendarDays, Loader2, RefreshCw, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DiaMenu,
  DraftMenuDia,
  MenuDiaResponse,
  PlatoBebida,
} from "@/hooks/usePlanificador";
import { DiaMenuCard, type DiaMenuSelectionHandlers } from "./dia-menu-card";

type ActualizarDraft = (fecha: string, cambios: Partial<DraftMenuDia>) => void;

export function ProgramacionDiariaSection({
  menuDia,
  loadingMenuDia,
  bebidas,
  loadingBebidas,
  drafts,
  guardandoFecha,
  diaAbierto,
  onToggleDia,
  onCargarMenuDia,
  onActualizarDraft,
  onGuardarMenuDia,
  selectionHandlers,
}: {
  menuDia: MenuDiaResponse | null;
  loadingMenuDia: boolean;
  bebidas: PlatoBebida[];
  loadingBebidas: boolean;
  drafts: Record<string, DraftMenuDia>;
  guardandoFecha: string | null;
  diaAbierto: string | null;
  onToggleDia: (fecha: string | null) => void;
  onCargarMenuDia: () => void;
  onActualizarDraft: ActualizarDraft;
  onGuardarMenuDia: (dia: DiaMenu) => void;
  selectionHandlers: DiaMenuSelectionHandlers;
}) {
  return (
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
        <Button
          variant="outline"
          size="sm"
          onClick={onCargarMenuDia}
          disabled={loadingMenuDia}
          className="h-8 font-semibold bg-white shadow-sm text-slate-700"
        >
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
            const totalOpciones =
              dia.opciones.entradas.length + dia.opciones.fondos.length + dia.opciones.postres.length;

            return (
              <DiaMenuCard
                key={`${dia.dia}-${dia.fecha ?? "sin-fecha"}`}
                dia={dia}
                draft={draft}
                abierto={diaAbierto === dia.fecha}
                totalOpciones={totalOpciones}
                bebidas={bebidas}
                loadingBebidas={loadingBebidas}
                guardandoFecha={guardandoFecha}
                menuActivo={Boolean(menuDia.menu)}
                onToggle={() => onToggleDia(dia.fecha)}
                onActualizarDraft={onActualizarDraft}
                onGuardarMenuDia={onGuardarMenuDia}
                selectionHandlers={selectionHandlers}
              />
            );
          })
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">No hay configuración activa para esta semana.</p>
          </div>
        )}
      </div>
    </section>
  );
}
