"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"

import { UsuariosHeader } from "@/components/admin/usuarios/usuarios-header"
import { UsuariosKpiCards } from "@/components/admin/usuarios/usuarios-kpi-cards"
import { UsuariosListado } from "@/components/admin/usuarios/usuarios-listado"
import {
  type PerfilUsuarioApp,
  useUsuariosApp,
} from "@/hooks/useUsuariosApp"
import type { UsuarioApp } from "@/lib/usuarios/tipos"
import { obtenerTerminosTelefonoBusqueda } from "@/lib/usuarios/telefono"

const AsignarRepresentanteModal = dynamic(
  () =>
    import("@/components/admin/usuarios/asignar-representante-modal").then(
      (mod) => mod.AsignarRepresentanteModal
    ),
  { loading: () => null }
)

const EditarUsuarioModal = dynamic(
  () =>
    import("@/components/admin/usuarios/editar-usuario-modal").then(
      (mod) => mod.EditarUsuarioModal
    ),
  { loading: () => null }
)

export default function UsuariosAppPage() {
  const { usuarios, resumen, loading, error, cargarUsuarios } = useUsuariosApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [vistaActiva, setVistaActiva] = useState<PerfilUsuarioApp>("TRABAJADOR")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioApp | null>(null)

  const usuariosPorVista = useMemo(
    () => usuarios.filter((usuario) => usuario.perfil === vistaActiva),
    [usuarios, vistaActiva]
  )

  const usuariosFiltrados = useMemo(() => {
    const criterio = searchTerm.trim().toLocaleLowerCase("es")
    const terminosTelefono = obtenerTerminosTelefonoBusqueda(searchTerm).map(
      (termino) => termino.toLocaleLowerCase("es")
    )

    if (!criterio) return usuariosPorVista

    return usuariosPorVista.filter((usuario) => {
      const coincideTexto = [
        usuario.nombre,
        usuario.nombreUsuario,
        usuario.rut,
        usuario.correo,
        usuario.telefono,
        usuario.empresa?.nombre,
      ].some((valor) => valor?.toLocaleLowerCase("es").includes(criterio))

      const coincideTelefono = terminosTelefono.some((termino) =>
        usuario.telefono?.toLocaleLowerCase("es").includes(termino)
      )

      return coincideTexto || coincideTelefono
    })
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

  const abrirModalEdicion = (usuario: UsuarioApp) => {
    setMensajeExito(null)
    setUsuarioEditando(usuario)
  }

  const confirmarEdicion = async () => {
    setMensajeExito("Usuario actualizado correctamente.")
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
        onEditarUsuario={abrirModalEdicion}
      />

      {modalAbierto && (
        <AsignarRepresentanteModal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          onAsignado={confirmarAsignacion}
        />
      )}

      {usuarioEditando && (
        <EditarUsuarioModal
          usuario={usuarioEditando}
          abierto={true}
          onCerrar={() => setUsuarioEditando(null)}
          onGuardado={confirmarEdicion}
        />
      )}
    </div>
  )
}
