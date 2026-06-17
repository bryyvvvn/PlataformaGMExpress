import { useCallback, useEffect, useState } from "react"
import { HORA_LIMITE_DEFAULT } from "@/lib/empresas/constantes"
import type {
  ConfiguracionResponse,
  EmpresaDetalle,
  EmpresaDetalleResponse,
} from "@/lib/empresas/tipos"

export function useEmpresaDetalle(empresaId: string | undefined) {
  const [empresa, setEmpresa] = useState<EmpresaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [horaGlobal, setHoraGlobal] = useState(HORA_LIMITE_DEFAULT)

  const cargarDetalle = useCallback(async () => {
    if (!empresaId) {
      setError("No se pudo cargar el detalle de la empresa")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/empresas/${empresaId}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudo cargar el detalle de la empresa")
      }

      const data = (await response.json()) as EmpresaDetalleResponse
      setEmpresa(data.empresa)
    } catch (err) {
      console.error("[EmpresaDetallePage] Error:", err)
      setError("No se pudo cargar el detalle de la empresa")
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarDetalle()
    })
  }, [cargarDetalle])

  useEffect(() => {
    let cancelado = false

    void fetch("/api/admin/configuracion", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return

        const data = (await response.json()) as ConfiguracionResponse

        if (!cancelado) {
          setHoraGlobal(data.configuracion.horaLimite)
        }
      })
      .catch((err) => {
        console.error("[EmpresaDetallePage] Error cargando configuracion:", err)
      })

    return () => {
      cancelado = true
    }
  }, [])

  return {
    empresa,
    loading,
    error,
    horaGlobal,
    cargarDetalle,
  }
}
