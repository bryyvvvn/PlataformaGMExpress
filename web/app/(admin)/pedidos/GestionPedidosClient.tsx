"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import type { SemanaConsolidada } from "@/lib/pedidos/consolidado"
import { obtenerDisponibilidadDespuesCierre } from "@/lib/pedidos/cierre-pedidos"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
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

type GestionPedidosClientProps = {
  semana: SemanaConsolidada
}

async function obtenerMensajeError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error
    }
  } catch {
    // La respuesta no contenía JSON válido.
  }

  return "No se pudo descargar el histórico"
}

export function GestionPedidosClient({ semana }: GestionPedidosClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(semana.dias[0]?.fechaISO ?? "")
  const [ahora, setAhora] = useState<Date | null>(null)
  const [descargandoHistorico, setDescargandoHistorico] = useState(false)
  const [descargandoProduccion, setDescargandoProduccion] = useState(false)
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null)

  useEffect(() => {
    const actualizarAhora = () => setAhora(new Date())

    actualizarAhora()
    const interval = window.setInterval(actualizarAhora, 30_000)

    return () => window.clearInterval(interval)
  }, [])

  async function handleExportarHistorico(fechaISO: string) {
    setDescargandoHistorico(true)
    setErrorExportacion(null)

    try {
      const response = await fetch(
        `/api/admin/pedidos/exportar-historico?fecha=${encodeURIComponent(fechaISO)}`
      )

      if (!response.ok) {
        throw new Error(await obtenerMensajeError(response))
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement("a")

      enlace.href = url
      enlace.download = `historico-pedidos-${fechaISO}.xlsx`
      document.body.appendChild(enlace)

      try {
        enlace.click()
      } finally {
        enlace.remove()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      setErrorExportacion(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el histórico"
      )
    } finally {
      setDescargandoHistorico(false)
    }
  }

  async function handleExportarProduccion(fechaISO: string) {
    setDescargandoProduccion(true)
    setErrorExportacion(null)

    try {
      const response = await fetch("/api/admin/pedidos/exportar-produccion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fecha: fechaISO }),
      })

      if (!response.ok) {
        throw new Error(await obtenerMensajeError(response))
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement("a")

      enlace.href = url
      enlace.download = `produccion-${fechaISO}.xlsx`
      document.body.appendChild(enlace)

      try {
        enlace.click()
      } finally {
        enlace.remove()
        URL.revokeObjectURL(url)
      }

      router.refresh()
    } catch (error) {
      setErrorExportacion(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el Excel de producción"
      )
    } finally {
      setDescargandoProduccion(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-8 text-[#75aa46]" />
          <h1 className="text-2xl font-bold text-foreground">
            Gestión de Pedidos Consolidados por Empresa
          </h1>
        </div>
        <p className="text-lg font-medium text-muted-foreground">
          {semana.rango}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#75aa46]/30 bg-[#75aa46]/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-[#5d8a38]">Total Raciones Semana</p>
              <p className="text-2xl font-bold text-[#5d8a38]">
                {semana.total}
              </p>
              <p className="text-xs text-[#75aa46]">
                {semana.confirmadas} confirmadas / {semana.enProduccion} en
                producción
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full bg-[#75aa46]/20">
              <FileSpreadsheet className="size-6 text-[#75aa46]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1b2c56]/30 bg-[#1b2c56]/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-[#1b2c56]">Empresas Activas</p>
              <p className="text-2xl font-bold text-[#1b2c56]">
                {semana.empresasActivas}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full bg-[#1b2c56]/20">
              <Building2 className="size-6 text-[#1b2c56]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-purple-700">Total En Producción</p>
              <p className="text-2xl font-bold text-purple-700">
                {semana.enProduccion}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full bg-purple-500/20">
              <Download className="size-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </section>

      {semana.total === 0 && (
        <Card className="border-dashed bg-slate-50">
          <CardContent className="p-4 text-sm text-muted-foreground">
            No hay pedidos confirmados o en producción para esta semana.
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (typeof value === "string") {
            setActiveTab(value)
            setErrorExportacion(null)
          }
        }}
      >
        <TabsList className="grid h-auto w-full grid-cols-5 bg-slate-100">
          {semana.dias.map((dia) => (
            <TabsTrigger
              key={dia.fechaISO}
              value={dia.fechaISO}
              className="flex flex-col py-3 data-active:text-[#75aa46]"
            >
              <span className="font-semibold">{dia.dia}</span>
              <span className="text-xs text-muted-foreground">{dia.fecha}</span>
              <span className="mt-1 text-xs font-medium">
                {dia.total} raciones
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {semana.dias.map((dia) => {
          const disponibilidad = ahora
            ? obtenerDisponibilidadDespuesCierre(dia.fechaISO, ahora)
            : {
                permitido: false,
                mensaje: "Verificando disponibilidad del histórico...",
              }

          return (
            <TabsContent
              key={dia.fechaISO}
              value={dia.fechaISO}
              className="space-y-4"
            >
            <Card className="bg-slate-50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmados</p>
                    <p className="text-xl font-bold text-[#75aa46]">
                      {dia.confirmadas}
                    </p>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      En Producción
                    </p>
                    <p className="text-xl font-bold text-purple-700">
                      {dia.enProduccion}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total del Día</p>
                  <p className="text-xl font-bold text-[#1b2c56]">
                    {dia.total}
                  </p>
                </div>
              </CardContent>
            </Card>

            {dia.empresas.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Sin pedidos para este día.
                </CardContent>
              </Card>
            ) : (
              <Accordion multiple className="space-y-3">
                {dia.empresas.map((empresa) => (
                  <AccordionItem
                    key={empresa.id}
                    value={String(empresa.id)}
                    className="overflow-hidden rounded-lg border bg-card shadow-sm"
                  >
                    <AccordionTrigger className="px-4 py-3 data-panel-open:bg-slate-50">
                      <div className="flex flex-1 items-center justify-between gap-4 pr-2">
                        <div className="flex items-center gap-4">
                          <div className="flex size-10 items-center justify-center rounded-full bg-[#1b2c56]/10">
                            <Building2 className="size-5 text-[#1b2c56]" />
                          </div>
                          <div className="space-y-1 text-left">
                            <p className="font-semibold">{empresa.nombre}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {empresa.confirmadas > 0 && (
                                <Badge className="bg-[#75aa46] text-white">
                                  {empresa.confirmadas} Confirmadas
                                </Badge>
                              )}
                              {empresa.enProduccion > 0 && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  {empresa.enProduccion} En Producción
                                </Badge>
                              )}
                              {empresa.total === 0 && (
                                <span className="text-sm text-muted-foreground">
                                  Sin pedidos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#1b2c56]">
                          {empresa.total} raciones
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pt-2">
                      {empresa.menus.length === 0 ? (
                        <p className="py-4 text-sm text-muted-foreground">
                          Sin menús consolidados para esta empresa.
                        </p>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold">
                                  Opción de Menú
                                </TableHead>
                                <TableHead className="w-[140px] text-center font-semibold">
                                  Confirmadas
                                </TableHead>
                                <TableHead className="w-[40px]" />
                                <TableHead className="w-[140px] text-center font-semibold">
                                  En Producción
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {empresa.menus.map((menu) => (
                                <TableRow key={menu.key}>
                                  <TableCell className="font-medium">
                                    {menu.nombre}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className="bg-[#75aa46]/10 text-[#5d8a38]">
                                      {menu.confirmadas}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="mx-auto size-4 text-muted-foreground" />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className="bg-purple-100 text-purple-800">
                                      {menu.enProduccion}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-slate-50 font-semibold">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-center text-[#5d8a38]">
                                  {empresa.confirmadas}
                                </TableCell>
                                <TableCell />
                                <TableCell className="text-center text-purple-700">
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
            )}

              <Card className="border-2 border-dashed bg-slate-50">
                <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">Acciones de Exportación</p>
                    <p className="text-sm text-muted-foreground">
                      {disponibilidad.permitido
                        ? "La exportación histórica está disponible."
                        : disponibilidad.mensaje}
                    </p>
                    {errorExportacion && (
                      <p
                        role="alert"
                        className="mt-2 text-sm font-medium text-red-600"
                      >
                        {errorExportacion}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() =>
                        void handleExportarProduccion(dia.fechaISO)
                      }
                      disabled={
                        !activeTab ||
                        !disponibilidad.permitido ||
                        descargandoProduccion ||
                        dia.confirmadas === 0
                      }
                      className="bg-[#75aa46] text-white"
                    >
                      <Download className="size-4" />
                      {descargandoProduccion
                        ? "Generando Excel..."
                        : "Exportar Excel (Producción Actual)"}
                    </Button>
                    <Button
                      onClick={() =>
                        void handleExportarHistorico(dia.fechaISO)
                      }
                      disabled={
                        !activeTab ||
                        !disponibilidad.permitido ||
                        descargandoHistorico
                      }
                      className="bg-[#1b2c56] text-white"
                    >
                      <FileSpreadsheet className="size-4" />
                      {descargandoHistorico
                        ? "Descargando Histórico..."
                        : "Exportar Histórico (Fin de Día)"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
