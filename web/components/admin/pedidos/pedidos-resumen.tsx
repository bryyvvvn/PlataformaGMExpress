import { AlertCircle, Building2, Factory, FileSpreadsheet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { HoraLimiteGlobal } from "@/components/admin/hora-limite-global"
import type { SemanaConsolidada } from "@/lib/pedidos/consolidado"

export function HoraLimitePedidosCard() {
  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <HoraLimiteGlobal />
      </CardContent>
    </Card>
  )
}

export function PedidosKpis({ semana }: { semana: SemanaConsolidada }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-[#75AA46]"></div>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Volumen Semanal</p>
            <p className="text-3xl font-bold text-[#75AA46]">
              {semana.total} <span className="text-sm font-medium text-slate-400">raciones</span>
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {semana.confirmadas} previas · {semana.enProduccion} cocinando
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#75AA46]/10">
            <FileSpreadsheet className="size-6 text-[#75AA46]" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-[#1B2C56]"></div>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Red de Clientes</p>
            <p className="text-3xl font-bold text-[#1B2C56]">
              {semana.empresasActivas} <span className="text-sm font-medium text-slate-400">empresas</span>
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Con pedidos activos</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#1B2C56]/10">
            <Building2 className="size-6 text-[#1B2C56]" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-amber-500"></div>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">En Línea de Fuego</p>
            <p className="text-3xl font-bold text-amber-600">
              {semana.enProduccion} <span className="text-sm font-medium text-slate-400">platos</span>
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Producción actual (Despachos)</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-amber-50">
            <Factory className="size-6 text-amber-600" />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function PedidosEmptySemana({ semana }: { semana: SemanaConsolidada }) {
  if (semana.total !== 0) return null

  return (
    <Card className="rounded-md border border-dashed border-slate-300 bg-slate-50 shadow-sm">
      <CardContent className="p-8 text-center">
         <AlertCircle className="size-8 text-slate-400 mx-auto mb-2" />
         <p className="text-sm font-semibold text-slate-600">No hay movimiento registrado</p>
         <p className="text-xs text-slate-500 mt-1">Aún no existen pedidos confirmados o en producción para esta semana.</p>
      </CardContent>
    </Card>
  )
}
