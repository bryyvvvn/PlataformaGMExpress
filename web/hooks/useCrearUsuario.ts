import { useState } from "react"

export type CrearUsuarioPayload = {
  rut: string
  nombre: string
  apellido: string
  password: string
  empresaId: string
  telefono: string
  correo: string
  rol?: "TRABAJADOR" | "REPRESENTANTE"
}

type ErrorResponse = {
  error?: string
}

type CrearUsuarioResponse = {
  usuario: {
    id: string
    nombre: string
    nombreUsuario: string | null
    usernameClerk: string | null
    rut: string | null
    correo: string | null
    telefono: string | null
    perfil: "TRABAJADOR" | "REPRESENTANTE"
    estado: "ASOCIADO" | "SIN_EMPRESA"
    empresa: {
      id: number
      nombre: string
    } | null
  }
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return "Ocurrio un error al crear el usuario."
}

export function useCrearUsuario() {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const limpiarEstado = () => {
    setError(null)
    setSuccess(null)
  }

  const crearUsuario = async (datos: CrearUsuarioPayload) => {
    setCargando(true)
    setError(null)
    setSuccess(null)

    try {
      const respuesta = await fetch("/api/admin/crear-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      })

      const data = (await respuesta.json().catch(() => null)) as
        | CrearUsuarioResponse
        | ErrorResponse
        | null

      if (!respuesta.ok) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "No se pudo crear el usuario."
        )
      }

      if (!data || !("usuario" in data)) {
        throw new Error("La respuesta de creacion no es valida.")
      }

      setSuccess("Usuario creado correctamente.")
      return data
    } catch (err) {
      const mensaje = obtenerMensajeError(err)
      setError(mensaje)
      throw new Error(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return { crearUsuario, cargando, error, success, limpiarEstado }
}
