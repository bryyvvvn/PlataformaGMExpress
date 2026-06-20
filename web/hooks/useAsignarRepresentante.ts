"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  BuscarUsuariosAsignablesResponse,
  EmpresaAsignable,
  EmpresasAsignablesResponse,
  UsuarioAsignable,
} from "@/lib/usuarios/tipos"

type UseAsignarRepresentanteParams = {
  abierto: boolean
  onCerrar: () => void
  onAsignado: () => Promise<void> | void
}

export function useAsignarRepresentante({
  abierto,
  onCerrar,
  onAsignado,
}: UseAsignarRepresentanteParams) {
  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState<UsuarioAsignable[]>([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioAsignable | null>(null)
  const [empresaId, setEmpresaId] = useState("")
  const [empresas, setEmpresas] = useState<EmpresaAsignable[]>([])
  const [buscando, setBuscando] = useState(false)
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)

  const empresasActivas = useMemo(
    () => empresas.filter((empresa) => empresa.estado !== "INACTIVA"),
    [empresas]
  )

  const empresaSeleccionada = useMemo(
    () => empresasActivas.find((empresa) => String(empresa.id) === empresaId),
    [empresaId, empresasActivas]
  )

  const limpiarEstado = useCallback(() => {
    setBusqueda("")
    setResultados([])
    setUsuarioSeleccionado(null)
    setEmpresaId("")
    setErrorBusqueda(null)
    setErrorEmpresas(null)
    setErrorFormulario(null)
  }, [])

  const cerrar = useCallback(() => {
    if (guardando) return
    limpiarEstado()
    onCerrar()
  }, [guardando, limpiarEstado, onCerrar])

  const cargarEmpresas = useCallback(async () => {
    setCargandoEmpresas(true)
    setErrorEmpresas(null)

    try {
      const response = await fetch("/api/admin/empresas", {
        cache: "no-store",
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        throw new Error(data?.error ?? "No se pudieron cargar las empresas")
      }

      const data = (await response.json()) as EmpresasAsignablesResponse
      setEmpresas(data.empresas)
    } catch (err) {
      console.error("[useAsignarRepresentante] empresas:", err)
      setErrorEmpresas(
        err instanceof Error ? err.message : "No se pudieron cargar las empresas"
      )
    } finally {
      setCargandoEmpresas(false)
    }
  }, [])

  useEffect(() => {
    if (!abierto) return

    queueMicrotask(() => {
      void cargarEmpresas()
    })
  }, [abierto, cargarEmpresas])

  useEffect(() => {
    if (!abierto) return

    const criterio = busqueda.trim()

    if (criterio.length < 2) {
      queueMicrotask(() => {
        setResultados([])
        setBuscando(false)
        setErrorBusqueda(null)
      })
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setBuscando(true)
      setErrorBusqueda(null)

      try {
        const response = await fetch(
          `/api/admin/usuarios-app/buscar?q=${encodeURIComponent(criterio)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string
          } | null

          throw new Error(data?.error ?? "No se pudo buscar usuarios")
        }

        const data = (await response.json()) as BuscarUsuariosAsignablesResponse
        setResultados(data.usuarios)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return

        console.error("[useAsignarRepresentante] busqueda:", err)
        setErrorBusqueda(
          err instanceof Error ? err.message : "No se pudo buscar usuarios"
        )
      } finally {
        if (!controller.signal.aborted) {
          setBuscando(false)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [abierto, busqueda])

  const actualizarBusqueda = (value: string) => {
    setBusqueda(value)
    setUsuarioSeleccionado(null)
    setErrorFormulario(null)
  }

  const seleccionarUsuario = (usuario: UsuarioAsignable) => {
    setUsuarioSeleccionado(usuario)
    setErrorFormulario(null)
  }

  const seleccionarEmpresa = (value: string) => {
    setEmpresaId(value)
    setErrorFormulario(null)
  }

  const confirmarAsignacion = async () => {
    setErrorFormulario(null)

    if (!usuarioSeleccionado) {
      setErrorFormulario("Selecciona un usuario registrado.")
      return
    }

    const empresaIdNumber = Number(empresaId)

    if (!Number.isInteger(empresaIdNumber) || empresaIdNumber <= 0) {
      setErrorFormulario("Selecciona una empresa para el representante.")
      return
    }

    setGuardando(true)

    try {
      const response = await fetch(
        "/api/admin/usuarios-app/asignar-representante",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioId: usuarioSeleccionado.id,
            empresaId: empresaIdNumber,
          }),
        }
      )

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        throw new Error(data?.error ?? "No se pudo asignar el representante")
      }

      await onAsignado()
      limpiarEstado()
      onCerrar()
    } catch (err) {
      console.error("[useAsignarRepresentante] asignacion:", err)
      setErrorFormulario(
        err instanceof Error ? err.message : "No se pudo asignar el representante"
      )
    } finally {
      setGuardando(false)
    }
  }

  return {
    busqueda,
    resultados,
    usuarioSeleccionado,
    empresaId,
    empresasActivas,
    empresaSeleccionada,
    buscando,
    cargandoEmpresas,
    guardando,
    errorBusqueda,
    errorEmpresas,
    errorFormulario,
    cerrar,
    actualizarBusqueda,
    seleccionarUsuario,
    seleccionarEmpresa,
    confirmarAsignacion,
  }
}
