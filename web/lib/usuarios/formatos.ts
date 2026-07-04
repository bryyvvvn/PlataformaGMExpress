import type { EstadoVinculacionUsuario, PerfilUsuarioApp } from "@/lib/usuarios/tipos"

export function etiquetaPerfil(perfil: PerfilUsuarioApp) {
  return perfil === "REPRESENTANTE" ? "Representante" : "Trabajador"
}

export function etiquetaEstado(estado: EstadoVinculacionUsuario) {
  return estado === "ASOCIADO" ? "Asociado" : "Sin empresa"
}

export function obtenerNombreVisible(usuario: {
  nombre: string | null
  apellido: string | null
  nombreUsuario: string | null
  correo: string | null
}) {
  const nombreCompleto = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .join(" ")
    .trim()

  return (
    nombreCompleto ||
    usuario.nombreUsuario?.trim() ||
    usuario.correo?.trim() ||
    "Usuario sin nombre"
  )
}
