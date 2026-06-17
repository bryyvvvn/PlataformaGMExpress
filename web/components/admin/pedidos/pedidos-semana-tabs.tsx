import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  Factory,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import {
  obtenerDisponibilidadHistorico,
  obtenerDisponibilidadProduccion,
} from "@/lib/pedidos/cierre-pedidos"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { DiaData, SemanaConsolidada } from "@/lib/pedidos/consolidado"
import { formatearFechaCreacionPedidoManual } from "@/lib/pedidos/formatos"
import type { PedidoManual } from "@/lib/pedidos/tipos"

export function PedidosSemanaTabs({
  semana,
  activeTab,
  ahora,
  pedidosManuales,
  loadingManuales,
  errorExportacion,
  descargandoProduccion,
  descargandoHistorico,
  onTabChange,
  onExportarProduccion,
  onExportarHistorico,
}: {
  semana: SemanaConsolidada
  activeTab: string
  ahora: Date | null
  pedidosManuales: PedidoManual[]
  loadingManuales: boolean
  errorExportacion: string | null
  descargandoProduccion: boolean
  descargandoHistorico: boolean
  onTabChange: (value: string) => void
  onExportarProduccion: (fechaISO: string) => void
  onExportarHistorico: (fechaISO: string) => void
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (typeof value === "string") {
          onTabChange(value)
        }
      }}
      className="space-y-6"
    >
      <TabsList className="flex w-full gap-2 bg-transparent p-0 overflow-x-auto h-auto">
        {semana.dias.map((dia) => (
          <TabsTrigger
            key={dia.fechaISO}
            value={dia.fechaISO}
            className="flex-1 min-w-[120px] flex-col items-start gap-1 rounded-md border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all data-[state=active]:border-[#1B2C56] data-[state=active]:bg-[#1B2C56] data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">{dia.dia}</span>
            <span className="text-lg font-bold">{dia.fecha.split("-")[0]}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-black/10">
              {dia.total} rac.
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {semana.dias.map((dia) => {
        const pedidosManualesDia = pedidosManuales.filter(
          (pedidoManual) => pedidoManual.fecha === dia.fechaISO
        )
        const totalManualesDia = pedidosManualesDia.reduce(
          (total, pedidoManual) => total + pedidoManual.cantidad,
          0
        )
        const disponibilidadHistorico = ahora
          ? obtenerDisponibilidadHistorico(dia.fechaISO, ahora)
          : {
              permitido: false,
              motivo: "ANTES_DEL_CIERRE" as const,
              mensaje: "Verificando conexión...",
            }
        const disponibilidadProduccion = ahora
          ? obtenerDisponibilidadProduccion(dia.fechaISO, ahora)
          : {
              permitido: false,
              motivo: "DESPUES_DEL_CIERRE" as const,
              mensaje: "Verificando conexión...",
            }

        return (
          <TabsContent
            key={dia.fechaISO}
            value={dia.fechaISO}
            className="space-y-5 outline-none animate-in fade-in-50"
          >
            <PedidosDiaPipeline dia={dia} />

            <PedidosManualesDiaCard
              pedidosManualesDia={pedidosManualesDia}
              totalManualesDia={totalManualesDia}
              loadingManuales={loadingManuales}
            />

            <PedidosEmpresasDia dia={dia} />

            <PedidosExportacionCard
              activeTab={activeTab}
              dia={dia}
              disponibilidadProduccion={disponibilidadProduccion}
              disponibilidadHistorico={disponibilidadHistorico}
              descargandoProduccion={descargandoProduccion}
              descargandoHistorico={descargandoHistorico}
              errorExportacion={errorExportacion}
              onExportarProduccion={onExportarProduccion}
              onExportarHistorico={onExportarHistorico}
            />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

function PedidosDiaPipeline({ dia }: { dia: DiaData }) {
  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm border-l-4 border-l-[#1B2C56]">
      <CardContent className="flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
        <div className="flex items-center w-full sm:w-auto">
          <div className="pr-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">1. Confirmados</p>
            <p className="text-2xl font-bold text-[#75AA46]">{dia.confirmadas}</p>
          </div>
          <div className="px-6 border-l border-slate-100 relative">
            <ArrowRight className="absolute -left-3 top-1/2 -translate-y-1/2 size-5 text-slate-300 bg-white" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">2. En Producción</p>
            <p className="text-2xl font-bold text-amber-600">{dia.enProduccion}</p>
          </div>
        </div>
        <div className="w-full sm:w-auto sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Carga Total Diaria</p>
          <p className="text-2xl font-bold text-[#1B2C56]">{dia.total} <span className="text-sm font-medium text-slate-400">platos</span></p>
        </div>
      </CardContent>
    </Card>
  )
}

function PedidosManualesDiaCard({
  pedidosManualesDia,
  totalManualesDia,
  loadingManuales,
}: {
  pedidosManualesDia: PedidoManual[]
  totalManualesDia: number
  loadingManuales: boolean
}) {
  return (
    <Card className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1B2C56]">
            Pedidos manuales / fuera de plazo
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
            Solicitudes creadas por administracion, separadas de pedidos de trabajadores.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded border border-[#75AA46]/30 bg-[#75AA46]/10 px-2.5 py-1 text-xs font-bold text-[#5d8a38]">
          {totalManualesDia} almuerzos manuales
        </span>
      </div>
      <CardContent className="p-0">
        {loadingManuales ? (
          <div className="p-5 text-sm font-medium text-slate-500">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Cargando pedidos manuales...
          </div>
        ) : pedidosManualesDia.length === 0 ? (
          <p className="p-5 text-sm font-medium text-slate-400">
            No hay pedidos manuales registrados para este dia.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Empresa
                </TableHead>
                <TableHead className="h-9 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Cantidad
                </TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Observacion
                </TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Creado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidosManualesDia.map((pedidoManual) => (
                <TableRow key={pedidoManual.id} className="text-xs hover:bg-slate-50/50">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#1B2C56]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#1B2C56]">
                        Manual
                      </span>
                      <span className="font-bold text-slate-800">
                        {pedidoManual.empresa.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className="font-bold text-[#75AA46]">
                      {pedidoManual.cantidad}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md py-3 font-medium text-slate-600">
                    {pedidoManual.observacion || "Sin observacion"}
                  </TableCell>
                  <TableCell className="py-3 text-slate-500">
                    {formatearFechaCreacionPedidoManual(pedidoManual.creadoEn)}
                    {pedidoManual.creadoPor ? ` - ${pedidoManual.creadoPor}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function PedidosEmpresasDia({ dia }: { dia: DiaData }) {
  if (dia.empresas.length === 0) {
    return (
      <Card className="rounded-md border border-dashed border-slate-300 bg-slate-50 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">El registro de este día está vacío.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
         <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-wider">Desglose por Cliente</p>
      </div>
      <Accordion multiple className="w-full">
        {dia.empresas.map((empresa) => (
          <AccordionItem
            key={empresa.id}
            value={String(empresa.id)}
            className="border-b border-slate-100 last:border-0"
          >
            <AccordionTrigger className="px-5 py-3 hover:bg-slate-50 transition-colors hover:no-underline">
              <div className="flex flex-1 items-center justify-between gap-4 pr-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded border border-slate-200 bg-white shadow-sm">
                    <Building2 className="size-4 text-[#1B2C56]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-sm">{empresa.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {empresa.confirmadas > 0 && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#75AA46]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#5d8a38]">
                          {empresa.confirmadas} Conf.
                        </span>
                      )}
                      {empresa.enProduccion > 0 && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          {empresa.enProduccion} Prod.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#1B2C56] bg-slate-100 px-2.5 py-1 rounded">
                  {empresa.total} req.
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-5 pb-4 pt-1 bg-white">
              {empresa.menus.length === 0 ? (
                <p className="py-2 text-xs text-slate-500">Datos de menús no disponibles.</p>
              ) : (
                <div className="rounded border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1B2C56]/5 hover:bg-[#1B2C56]/5 border-b border-slate-200">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#1B2C56] h-8">
                          Detalle del Menú
                        </TableHead>
                        <TableHead className="w-[120px] text-center text-[10px] font-bold uppercase tracking-widest text-[#1B2C56] h-8">
                          Confirmadas
                        </TableHead>
                        <TableHead className="w-[120px] text-center text-[10px] font-bold uppercase tracking-widest text-[#1B2C56] h-8">
                          Producción
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresa.menus.map((menu) => (
                        <TableRow key={menu.key} className="text-xs hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-slate-700 py-2">
                            {menu.nombre}
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <span className="font-bold text-[#75AA46]">{menu.confirmadas}</span>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <span className="font-bold text-amber-600">{menu.enProduccion}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50">
                        <TableCell className="font-bold text-slate-800 text-xs py-2 uppercase tracking-wide">Totales</TableCell>
                        <TableCell className="text-center font-bold text-[#75AA46] text-sm py-2">
                          {empresa.confirmadas}
                        </TableCell>
                        <TableCell className="text-center font-bold text-amber-600 text-sm py-2">
                          {empresa.enProduccion}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function PedidosExportacionCard({
  activeTab,
  dia,
  disponibilidadProduccion,
  disponibilidadHistorico,
  descargandoProduccion,
  descargandoHistorico,
  errorExportacion,
  onExportarProduccion,
  onExportarHistorico,
}: {
  activeTab: string
  dia: DiaData
  disponibilidadProduccion: ReturnType<typeof obtenerDisponibilidadProduccion>
  disponibilidadHistorico: ReturnType<typeof obtenerDisponibilidadHistorico>
  descargandoProduccion: boolean
  descargandoHistorico: boolean
  errorExportacion: string | null
  onExportarProduccion: (fechaISO: string) => void
  onExportarHistorico: (fechaISO: string) => void
}) {
  return (
    <Card className="rounded-md border border-slate-200 bg-white shadow-sm mt-6">
      <CardContent className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Download className="size-4 text-[#1B2C56]" />
            <p className="text-sm font-bold text-[#1B2C56] uppercase tracking-wide">Centro de Exportación</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
             <div className={`p-3 rounded border text-xs ${disponibilidadProduccion.permitido ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                <p className="font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                   {disponibilidadProduccion.permitido ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />} 
                   Corte de Producción
                </p>
                <p>{disponibilidadProduccion.mensaje}</p>
             </div>
             <div className={`p-3 rounded border text-xs ${disponibilidadHistorico.permitido ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                <p className="font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                   {disponibilidadHistorico.permitido ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />} 
                   Histórico Consolidado
                </p>
                <p>{disponibilidadHistorico.permitido ? "La exportación histórica está lista." : disponibilidadHistorico.mensaje}</p>
             </div>
          </div>

          {errorExportacion && (
            <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-xs font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle className="size-4" /> {errorExportacion}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 shrink-0">
          <Button
            onClick={() => onExportarProduccion(dia.fechaISO)}
            disabled={!activeTab || !disponibilidadProduccion.permitido || descargandoProduccion || dia.confirmadas === 0}
            className="bg-[#75AA46] text-white hover:bg-[#5d8a38] shadow-sm font-semibold h-10 w-full"
          >
            {descargandoProduccion ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Procesando...</>
            ) : (
              <><Factory className="size-4 mr-2" /> Planilla Producción</>
            )}
          </Button>
          <Button
            onClick={() => onExportarHistorico(dia.fechaISO)}
            disabled={!activeTab || !disponibilidadHistorico.permitido || descargandoHistorico}
            className="bg-[#1B2C56] text-white hover:bg-[#121f3d] shadow-sm font-semibold h-10 w-full"
          >
            {descargandoHistorico ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Extrayendo...</>
            ) : (
              <><FileSpreadsheet className="size-4 mr-2" /> Histórico Cierre</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
