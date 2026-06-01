import { useState, useCallback, useEffect } from "react"

export type ConvenioEmpresa = {
  id: number
  permitePlato: boolean
  permiteEntrada: boolean
  permitePostre: boolean
  permitePan: boolean
  permiteJugo: boolean
  permiteBebida: boolean
  permiteAguaSaborizada: boolean
}

export type EmpresaCliente = {
  id: number
  nombre: string
  razonSocial: string | null
  rut: string | null
  nombreComercial: string | null
  correo_contacto: string | null
  telefono: string | null
  direccion: string | null
  comuna: string | null
  region: string | null
  sector: string | null
  estado: "ACTIVA" | "INACTIVA"
  trabajadores: number
  representantes: number
  pedidos: number
  convenio: ConvenioEmpresa | null
}

export type EmpresasResponse = {
  empresas: EmpresaCliente[]
}

export type ConvenioForm = Omit<ConvenioEmpresa, "id">

export const CONVENIO_DEFAULTS: ConvenioForm = {
  permitePlato: true,
  permiteEntrada: true,
  permitePostre: true,
  permitePan: true,
  permiteJugo: true,
  permiteBebida: false,
  permiteAguaSaborizada: false,
}

export const OPCIONES_CONVENIO: Array<{ campo: keyof ConvenioForm; label: string }> = [
  { campo: "permitePlato", label: "Plato" },
  { campo: "permiteEntrada", label: "Entrada" },
  { campo: "permitePostre", label: "Postre" },
  { campo: "permitePan", label: "Pan" },
  { campo: "permiteJugo", label: "Jugo" },
  { campo: "permiteBebida", label: "Bebida" },
  { campo: "permiteAguaSaborizada", label: "Agua saborizada" },
]

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<EmpresaCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [empresaConvenioSeleccionada, setEmpresaConvenioSeleccionada] = useState<EmpresaCliente | null>(null)
  const [convenioForm, setConvenioForm] = useState<ConvenioForm>(CONVENIO_DEFAULTS)
  const [guardandoConvenio, setGuardandoConvenio] = useState(false)
  const [errorConvenio, setErrorConvenio] = useState<string | null>(null)
  
  const [empresaCambiandoEstadoId, setEmpresaCambiandoEstadoId] = useState<number | null>(null)
  const [errorEstadoEmpresa, setErrorEstadoEmpresa] = useState<string | null>(null)

  const cargarEmpresas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/empresas", { cache: "no-store" })
      if (!response.ok) throw new Error("No se pudieron cargar las empresas")
      
      const data = (await response.json()) as EmpresasResponse
      setEmpresas(data.empresas)
    } catch (err) {
      console.error("[useEmpresas] Error:", err)
      setError("No se pudieron cargar las empresas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarEmpresas()
    })
  }, [cargarEmpresas])

  const abrirModalConvenio = (empresa: EmpresaCliente) => {
    setEmpresaConvenioSeleccionada(empresa)
    setConvenioForm(
      empresa.convenio
        ? {
            permitePlato: empresa.convenio.permitePlato,
            permiteEntrada: empresa.convenio.permiteEntrada,
            permitePostre: empresa.convenio.permitePostre,
            permitePan: empresa.convenio.permitePan,
            permiteJugo: empresa.convenio.permiteJugo,
            permiteBebida: empresa.convenio.permiteBebida,
            permiteAguaSaborizada: empresa.convenio.permiteAguaSaborizada,
          }
        : CONVENIO_DEFAULTS
    )
    setErrorConvenio(null)
  }

  const cerrarModalConvenio = () => {
    if (guardandoConvenio) return
    setEmpresaConvenioSeleccionada(null)
    setErrorConvenio(null)
  }

  const actualizarCampoConvenio = (campo: keyof ConvenioForm, checked: boolean) => {
    setConvenioForm((prev) => ({ ...prev, [campo]: checked }))
  }

  const guardarConvenio = async () => {
    if (!empresaConvenioSeleccionada) return
    setGuardandoConvenio(true)
    setErrorConvenio(null)

    try {
      const response = await fetch(`/api/admin/empresas/${empresaConvenioSeleccionada.id}/convenio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convenioForm),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "No se pudo actualizar el convenio")
      }

      setEmpresaConvenioSeleccionada(null)
      setErrorConvenio(null)
      await cargarEmpresas()
    } catch (err) {
      console.error("[useEmpresas] Error guardando convenio:", err)
      setErrorConvenio(err instanceof Error ? err.message : "No se pudo actualizar el convenio")
    } finally {
      setGuardandoConvenio(false)
    }
  }

  const cambiarEstadoEmpresa = async (empresa: EmpresaCliente) => {
    const nuevoEstado = empresa.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA"
    setErrorEstadoEmpresa(null)
    setEmpresaCambiandoEstadoId(empresa.id)

    try {
      const response = await fetch(`/api/admin/empresas/${empresa.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "No se pudo actualizar el estado de la empresa")
      }

      await cargarEmpresas()
    } catch (err) {
      console.error("[useEmpresas] Error actualizando estado:", err)
      setErrorEstadoEmpresa(err instanceof Error ? err.message : "No se pudo actualizar el estado de la empresa")
    } finally {
      setEmpresaCambiandoEstadoId(null)
    }
  }

  return {
    empresas,
    loading,
    error,
    cargarEmpresas,
    
    empresaConvenioSeleccionada,
    convenioForm,
    guardandoConvenio,
    errorConvenio,
    abrirModalConvenio,
    cerrarModalConvenio,
    actualizarCampoConvenio,
    guardarConvenio,
    
    empresaCambiandoEstadoId,
    errorEstadoEmpresa,
    cambiarEstadoEmpresa,
  }
}