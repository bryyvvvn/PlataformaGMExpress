import { ClipboardPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SemanaConsolidada } from "@/lib/pedidos/consolidado"

export function PedidosHeader({
  semana,
  onAgregarManual,
}: {
  semana: SemanaConsolidada
  onAgregarManual: () => void
}) {
  return (
    <header className="border-b border-slate-200 pb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-[#1B2C56]"></span>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Logística & Producción</p>
        </div>
        <h1 className="text-2xl font-bold text-[#1B2C56] tracking-tight">Consolidado de Pedidos</h1>
        <p className="text-sm text-slate-500 mt-1">Gestión de raciones, monitor de empresas y despachos. {semana.rango}</p>
      </div>
      <Button
        onClick={onAgregarManual}
        className="bg-[#1B2C56] text-white shadow-sm hover:bg-[#122042] font-semibold h-10 px-5"
      >
        <ClipboardPlus className="mr-2 h-4 w-4" />
        Agregar pedido manual
      </Button>
    </header>
  )
}
