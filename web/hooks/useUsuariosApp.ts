"use client"

import { useCallback, useEffect, useState } from "react"

export type PerfilUsuarioApp = "TRABAJADOR" | "REPRESENTANTE"
export type EstadoVinculacionUsuario = "ASOCIADO" | "SIN_EMPRESA"

export type UsuarioApp = {
  id: string
  nombre: string
  nombreUsuario: string | null
  rut: string | null
  correo: string | null
  empresa: {
    id: number
    nombre: string
  } | null
  perfil: PerfilUsuarioApp
  estado: EstadoVinculacionUsuario
}

export type ResumenUsuariosApp = {
  total: number
  trabajadores: number
  representantes: number
  sinEmpresa: number
}

type UsuariosAppResponse = {
  usuarios: UsuarioApp[]
  resumen: ResumenUsuariosApp
}

const RESUMEN_INICIAL: ResumenUsuariosApp = {
  total: 0,
  trabajadores: 0,
  representantes: 0,
  sinEmpresa: 0,
}

export function useUsuariosApp() {
  const [usuarios, setUsuarios] = useState<UsuarioApp[]>([])
  const [resumen, setResumen] = useState<ResumenUsuariosApp>(RESUMEN_INICIAL)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/usuarios-app", {
        cache: "no-store",
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        throw new Error(data?.error ?? "No se pudieron cargar los usuarios")
      }

      const data = (await response.json()) as UsuariosAppResponse
      setUsuarios(data.usuarios)
      setResumen(data.resumen)
    } catch (err) {
      console.error("[useUsuariosApp] Error:", err)
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los usuarios"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarUsuarios()
    })
  }, [cargarUsuarios])

  return {
    usuarios,
    resumen,
    loading,
    error,
    cargarUsuarios,
  }
}
