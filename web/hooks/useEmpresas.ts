import { useState, useCallback, useEffect } from "react"
import { CONVENIO_DEFAULTS } from "@/lib/empresas/constantes"
import type {
  CampoBooleanoConvenio,
  ConvenioForm,
  EmpresaCliente,
  EmpresasResponse,
  TipoEmpaquetado,
} from "@/lib/empresas/tipos"

export type {
  CampoBooleanoConvenio,
  ConvenioEmpresa,
  ConvenioForm,
  EmpresaCliente,
  EmpresasResponse,
  TipoEmpaquetado,
} from "@/lib/empresas/tipos"
export {
  CONVENIO_DEFAULTS,
  OPCIONES_CONVENIO,
  OPCIONES_TIPO_EMPAQUETADO,
} from "@/lib/empresas/constantes"

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
            trabajaFinDeSemana: Boolean(empresa.convenio.trabajaFinDeSemana),
            tipoEmpaquetado: empresa.convenio.tipoEmpaquetado,
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

  const actualizarCampoConvenio = (campo: CampoBooleanoConvenio, checked: boolean) => {
    setConvenioForm((prev) => ({ ...prev, [campo]: checked }))
  }

  const actualizarTipoEmpaquetado = (tipoEmpaquetado: TipoEmpaquetado | null) => {
    setConvenioForm((prev) => ({ ...prev, tipoEmpaquetado }))
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
    actualizarTipoEmpaquetado,
    guardarConvenio,
    
    empresaCambiandoEstadoId,
    errorEstadoEmpresa,
    cambiarEstadoEmpresa,
  }
}
