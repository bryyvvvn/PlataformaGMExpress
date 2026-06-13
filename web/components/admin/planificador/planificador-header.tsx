import { CalendarDays } from "lucide-react";

export function PlanificadorHeader() {
  return (
    <header className="border-b border-slate-200 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-[#75AA46]"></span>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Módulo Operativo</p>
        </div>
        <h1 className="text-2xl font-bold text-[#1B2C56] tracking-tight">Planificador de Menús</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestión y programación de la minuta semanal vía importación de datos.
        </p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-md bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
        <CalendarDays className="h-4 w-4 text-[#1B2C56]" />
        <span className="text-xs font-semibold text-slate-700">Semana Actual</span>
      </div>
    </header>
  );
}
