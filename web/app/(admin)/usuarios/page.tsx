"use client"

import { useMemo, useState } from "react"

import { AsignarRepresentanteModal } from "@/components/admin/usuarios/asignar-representante-modal"
import { UsuariosHeader } from "@/components/admin/usuarios/usuarios-header"
import { UsuariosKpiCards } from "@/components/admin/usuarios/usuarios-kpi-cards"
import { UsuariosListado } from "@/components/admin/usuarios/usuarios-listado"
import {
  type PerfilUsuarioApp,
  useUsuariosApp,
} from "@/hooks/useUsuariosApp"

export default function UsuariosAppPage() {
  const { usuarios, resumen, loading, error, cargarUsuarios } = useUsuariosApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [vistaActiva, setVistaActiva] = useState<PerfilUsuarioApp>("TRABAJADOR")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const usuariosPorVista = useMemo(
    () => usuarios.filter((usuario) => usuario.perfil === vistaActiva),
    [usuarios, vistaActiva]
  )

  const usuariosFiltrados = useMemo(() => {
    const criterio = searchTerm.trim().toLocaleLowerCase("es")

    if (!criterio) return usuariosPorVista

    return usuariosPorVista.filter((usuario) =>
      [
        usuario.nombre,
        usuario.nombreUsuario,
        usuario.rut,
        usuario.correo,
        usuario.empresa?.nombre,
      ].some((valor) => valor?.toLocaleLowerCase("es").includes(criterio))
    )
  }, [searchTerm, usuariosPorVista])

  const abrirModalAsignacion = () => {
    setMensajeExito(null)
    setModalAbierto(true)
  }

  const cambiarVista = (vista: PerfilUsuarioApp) => {
    setVistaActiva(vista)
    setSearchTerm("")
    setMensajeExito(null)
  }

  const confirmarAsignacion = async () => {
    setVistaActiva("REPRESENTANTE")
    setSearchTerm("")
    setMensajeExito("Representante asignado correctamente.")
    await cargarUsuarios()
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] space-y-6 bg-slate-50 p-6">
      <UsuariosHeader onAsignarRepresentante={abrirModalAsignacion} />
      <UsuariosKpiCards resumen={resumen} />
      <UsuariosListado
        usuarios={usuarios}
        usuariosPorVista={usuariosPorVista}
        usuariosFiltrados={usuariosFiltrados}
        resumen={resumen}
        vistaActiva={vistaActiva}
        searchTerm={searchTerm}
        loading={loading}
        error={error}
        mensajeExito={mensajeExito}
        onCambiarVista={cambiarVista}
        onSearchTermChange={setSearchTerm}
        onReintentar={cargarUsuarios}
      />

      <AsignarRepresentanteModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onAsignado={confirmarAsignacion}
      />
    </div>
  )
}
