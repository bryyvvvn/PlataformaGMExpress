"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Building2,
  ClipboardPlus,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Factory,
  CheckCircle2
} from "lucide-react"
import type { SemanaConsolidada } from "@/lib/pedidos/consolidado"
import { HoraLimiteGlobal } from "@/components/admin/hora-limite-global"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

type EmpresaOption = {
  id: number
  nombre: string
}

type EmpresaAdminResponse = EmpresaOption & {
  estado?: string
}

type PedidoManual = {
  id: number
  empresaId: number
  empresa: EmpresaOption
  fecha: string
  cantidad: number
  observacion: string | null
  creadoPor: string | null
  creadoEn: string
}

const FORM_MANUAL_INICIAL = {
  empresaId: "",
  fecha: "",
  cantidad: "1",
  observacion: "",
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
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([])
  const [pedidosManuales, setPedidosManuales] = useState<PedidoManual[]>([])
  const [loadingManuales, setLoadingManuales] = useState(true)
  const [modalManualOpen, setModalManualOpen] = useState(false)
  const [guardandoManual, setGuardandoManual] = useState(false)
  const [mensajeManual, setMensajeManual] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null)
  const [formManual, setFormManual] = useState(FORM_MANUAL_INICIAL)

  useEffect(() => {
    const actualizarAhora = () => setAhora(new Date())

    actualizarAhora()
    const interval = window.setInterval(actualizarAhora, 30_000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const response = await fetch("/api/admin/empresas", { cache: "no-store" })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar las empresas")
        }

        const empresasData = (data.empresas ?? []) as EmpresaAdminResponse[]

        setEmpresas(
          empresasData
            .filter((empresa) => empresa.estado === "ACTIVA")
            .map((empresa) => ({ id: empresa.id, nombre: empresa.nombre }))
        )
      } catch (error) {
        setMensajeManual({
          tipo: "error",
          texto: error instanceof Error ? error.message : "No se pudieron cargar las empresas",
        })
      }
    }

    void cargarEmpresas()
  }, [])

  async function cargarPedidosManuales() {
    try {
      const response = await fetch("/api/admin/pedidos-manuales", { cache: "no-store" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar los pedidos manuales")
      }

      setPedidosManuales(data.pedidosManuales ?? [])
    } catch (error) {
      setMensajeManual({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudieron cargar los pedidos manuales",
      })
    } finally {
      setLoadingManuales(false)
    }
  }

  useEffect(() => {
    let cancelado = false

    void fetch("/api/admin/pedidos-manuales", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar los pedidos manuales")
        }

        if (!cancelado) {
          setPedidosManuales(data.pedidosManuales ?? [])
        }
      })
      .catch((error) => {
        if (!cancelado) {
          setMensajeManual({
            tipo: "error",
            texto:
              error instanceof Error
                ? error.message
                : "No se pudieron cargar los pedidos manuales",
          })
        }
      })
      .finally(() => {
        if (!cancelado) {
          setLoadingManuales(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [])

  function abrirModalManual() {
    setFormManual((actual) => ({
      ...FORM_MANUAL_INICIAL,
      fecha: activeTab || semana.dias[0]?.fechaISO || "",
      empresaId: actual.empresaId,
    }))
    setMensajeManual(null)
    setModalManualOpen(true)
  }

  async function guardarPedidoManual() {
    const cantidad = Number(formManual.cantidad)

    if (!formManual.empresaId) {
      setMensajeManual({ tipo: "error", texto: "Selecciona una empresa" })
      return
    }

    if (!formManual.fecha) {
      setMensajeManual({ tipo: "error", texto: "Selecciona una fecha" })
      return
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setMensajeManual({ tipo: "error", texto: "La cantidad debe ser mayor a 0" })
      return
    }

    if (formManual.observacion.trim().length > 500) {
      setMensajeManual({ tipo: "error", texto: "La observación no puede superar 500 caracteres" })
      return
    }

    setGuardandoManual(true)
    setMensajeManual(null)

    try {
      const response = await fetch("/api/admin/pedidos-manuales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: Number(formManual.empresaId),
          fecha: formManual.fecha,
          cantidad,
          observacion: formManual.observacion,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el pedido manual")
      }

      setMensajeManual({ tipo: "exito", texto: "Pedido manual creado correctamente" })
      setFormManual(FORM_MANUAL_INICIAL)
      setModalManualOpen(false)
      setLoadingManuales(true)
      await cargarPedidosManuales()
      router.refresh()
    } catch (error) {
      setMensajeManual({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo crear el pedido manual",
      })
    } finally {
      setGuardandoManual(false)
    }
  }

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

  const empresaManualSeleccionada = empresas.find(
  (empresa) => String(empresa.id) === formManual.empresaId
);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header Corporativo */}
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
          onClick={abrirModalManual}
          className="bg-[#1B2C56] text-white shadow-sm hover:bg-[#122042] font-semibold h-10 px-5"
        >
          <ClipboardPlus className="mr-2 h-4 w-4" />
          Agregar pedido manual
        </Button>
      </header>

      <Card className="rounded-md border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <HoraLimiteGlobal />
        </CardContent>
      </Card>

      {mensajeManual && !modalManualOpen && (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            mensajeManual.tipo === "exito"
              ? "border-[#75AA46]/20 bg-[#75AA46]/10 text-[#5d8a38]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {mensajeManual.texto}
        </div>
      )}

      {modalManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1B2C56]">Agregar pedido manual</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Pedido fuera de plazo o pedido solicitado por canal externo.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalManualOpen(false)}
                  disabled={guardandoManual}
                >
                  Cerrar
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Empresa
                </Label>
                <Select
                  value={formManual.empresaId}
                  onValueChange={(value) =>
                    setFormManual((actual) => ({ ...actual, empresaId: value ?? "" }))
                  }
                  disabled={guardandoManual}
                >
                  <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-200">
                    <span className={empresaManualSeleccionada ? "text-slate-900" : "text-slate-400"}>
                      {empresaManualSeleccionada?.nombre ?? "Selecciona una empresa..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    side="bottom"
                    sideOffset={4}
                    alignItemWithTrigger={false}
                    className="z-50 max-h-64 bg-white border-slate-200 shadow-md"
                  >
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={String(empresa.id)} className="cursor-pointer">
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Fecha del pedido
                  </Label>
                  <Input
                    type="date"
                    value={formManual.fecha}
                    onChange={(event) => setFormManual((actual) => ({ ...actual, fecha: event.target.value }))}
                    disabled={guardandoManual}
                    className="h-10 bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Cantidad de almuerzos
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={formManual.cantidad}
                    onChange={(event) => setFormManual((actual) => ({ ...actual, cantidad: event.target.value }))}
                    disabled={guardandoManual}
                    className="h-10 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Observación opcional
                </Label>
                <textarea
                  value={formManual.observacion}
                  onChange={(event) => setFormManual((actual) => ({ ...actual, observacion: event.target.value }))}
                  disabled={guardandoManual}
                  maxLength={500}
                  className="min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#1B2C56] focus:bg-white"
                  placeholder="Ej: Solicitud por WhatsApp para invitados"
                />
                <p className="text-right text-[10px] font-medium text-slate-400">
                  {formManual.observacion.length}/500
                </p>
              </div>

              {mensajeManual && (
                <div
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    mensajeManual.tipo === "exito"
                      ? "border-[#75AA46]/20 bg-[#75AA46]/10 text-[#5d8a38]"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {mensajeManual.texto}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <Button
                variant="outline"
                onClick={() => setModalManualOpen(false)}
                disabled={guardandoManual}
                className="h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => void guardarPedidoManual()}
                disabled={guardandoManual}
                className="h-9 bg-[#75AA46] text-white hover:bg-[#5d8a38]"
              >
                {guardandoManual ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <ClipboardPlus className="mr-2 h-4 w-4" />
                    Guardar pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas KPI Superiores */}
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

      {semana.total === 0 && (
        <Card className="rounded-md border border-dashed border-slate-300 bg-slate-50 shadow-sm">
          <CardContent className="p-8 text-center">
             <AlertCircle className="size-8 text-slate-400 mx-auto mb-2" />
             <p className="text-sm font-semibold text-slate-600">No hay movimiento registrado</p>
             <p className="text-xs text-slate-500 mt-1">Aún no existen pedidos confirmados o en producción para esta semana.</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs y Contenido Diario */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (typeof value === "string") {
            setActiveTab(value)
            setErrorExportacion(null)
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
              <span className="text-lg font-bold">{dia.fecha.split('-')[0]}</span>
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
                mensaje: "Verificando conexión...",
              }
          const disponibilidadProduccion = ahora
            ? obtenerDisponibilidadProduccion(dia.fechaISO, ahora)
            : {
                permitido: false,
                mensaje: "Verificando conexión...",
              }

          return (
            <TabsContent
              key={dia.fechaISO}
              value={dia.fechaISO}
              className="space-y-5 outline-none animate-in fade-in-50"
            >
            {/* Pipeline del Día */}
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

            {/* Pedidos Manuales */}
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
                            {new Date(pedidoManual.creadoEn).toLocaleDateString("es-CL")}
                            {pedidoManual.creadoPor ? ` - ${pedidoManual.creadoPor}` : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Listado de Empresas */}
            {dia.empresas.length === 0 ? (
              <Card className="rounded-md border border-dashed border-slate-300 bg-slate-50 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-semibold text-slate-500">El registro de este día está vacío.</p>
                </CardContent>
              </Card>
            ) : (
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
            )}

            {/* Centro de Exportación */}
            <Card className="rounded-md border border-slate-200 bg-white shadow-sm mt-6">
              <CardContent className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="size-4 text-[#1B2C56]" />
                    <p className="text-sm font-bold text-[#1B2C56] uppercase tracking-wide">Centro de Exportación</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                     <div className={`p-3 rounded border text-xs ${disponibilidadProduccion.permitido ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <p className="font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                           {disponibilidadProduccion.permitido ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />} 
                           Corte de Producción
                        </p>
                        <p>{disponibilidadProduccion.mensaje}</p>
                     </div>
                     <div className={`p-3 rounded border text-xs ${disponibilidadHistorico.permitido ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
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
                    onClick={() => void handleExportarProduccion(dia.fechaISO)}
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
                    onClick={() => void handleExportarHistorico(dia.fechaISO)}
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

            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
