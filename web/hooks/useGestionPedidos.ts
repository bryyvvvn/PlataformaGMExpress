import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import type { SemanaConsolidada } from "@/lib/pedidos/consolidado"
import { FORM_MANUAL_INICIAL } from "@/lib/pedidos/constantes"
import {
  descargarArchivoExcel,
  obtenerMensajeError,
} from "@/lib/pedidos/exportaciones"
import type {
  EmpresaAdminResponse,
  EmpresaOption,
  MensajePedidoManual,
  PedidoManual,
  PedidoManualForm,
} from "@/lib/pedidos/tipos"
import { validarFormularioPedidoManual } from "@/lib/pedidos/validaciones"

export function useGestionPedidos(semana: SemanaConsolidada) {
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
  const [mensajeManual, setMensajeManual] =
    useState<MensajePedidoManual | null>(null)
  const [formManual, setFormManual] =
    useState<PedidoManualForm>(FORM_MANUAL_INICIAL)

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

  const cargarPedidosManuales = useCallback(async () => {
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
  }, [])

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

  function seleccionarTab(value: string) {
    setActiveTab(value)
    setErrorExportacion(null)
  }

  function actualizarFormManual<K extends keyof PedidoManualForm>(
    campo: K,
    valor: PedidoManualForm[K]
  ) {
    setFormManual((actual) => ({ ...actual, [campo]: valor }))
  }

  function abrirModalManual() {
    setFormManual((actual) => ({
      ...FORM_MANUAL_INICIAL,
      fecha: activeTab || semana.dias[0]?.fechaISO || "",
      empresaId: actual.empresaId,
    }))
    setMensajeManual(null)
    setModalManualOpen(true)
  }

  function cerrarModalManual() {
    setModalManualOpen(false)
  }

  async function guardarPedidoManual() {
    const validacion = validarFormularioPedidoManual(formManual)

    if ("error" in validacion) {
      setMensajeManual({ tipo: "error", texto: validacion.error })
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
          cantidad: validacion.cantidad,
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

      await descargarArchivoExcel(response, `historico-pedidos-${fechaISO}.xlsx`)
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

      await descargarArchivoExcel(response, `produccion-${fechaISO}.xlsx`)
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
  )

  return {
    activeTab,
    ahora,
    descargandoHistorico,
    descargandoProduccion,
    errorExportacion,
    empresas,
    pedidosManuales,
    loadingManuales,
    modalManualOpen,
    guardandoManual,
    mensajeManual,
    formManual,
    empresaManualSeleccionada,
    seleccionarTab,
    abrirModalManual,
    cerrarModalManual,
    actualizarFormManual,
    guardarPedidoManual,
    handleExportarHistorico,
    handleExportarProduccion,
  }
}
