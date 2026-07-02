"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"

import { UsuariosHeader } from "@/components/admin/usuarios/usuarios-header"
import { UsuariosKpiCards } from "@/components/admin/usuarios/usuarios-kpi-cards"
import { UsuariosListado } from "@/components/admin/usuarios/usuarios-listado"
import {
  type PerfilUsuarioApp,
  type UsuarioApp,
  useUsuariosApp,
} from "@/hooks/useUsuariosApp"
import { obtenerTerminosTelefonoBusqueda } from "@/lib/usuarios/telefono"

const AgregarUsuarioModal = dynamic(
  () =>
    import("@/components/admin/usuarios/agregar-usuario-modal").then(
      (mod) => mod.AgregarUsuarioModal
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
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioApp | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

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

  const abrirModalAgregarUsuario = () => {
    setMensajeExito(null)
    setModalAgregarAbierto(true)
  }

  const abrirModalEdicion = (usuario: UsuarioApp) => {
    setMensajeExito(null)
    setUsuarioEditando(usuario)
  }

  const cerrarModalEdicion = () => {
    setUsuarioEditando(null)
  }

  const cambiarVista = (vista: PerfilUsuarioApp) => {
    setVistaActiva(vista)
    setSearchTerm("")
    setMensajeExito(null)
  }

  const confirmarAgregarUsuarioMock = () => {
    setMensajeExito(
      "Formulario mock enviado. La creacion con Clerk se conectara en una siguiente etapa."
    )
  }

  const confirmarEdicion = async () => {
    setMensajeExito("Usuario actualizado correctamente.")
    await cargarUsuarios()
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] space-y-6 bg-slate-50 p-6">
      <UsuariosHeader onAgregarUsuario={abrirModalAgregarUsuario} />
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
        onEditarUsuario={abrirModalEdicion}
        onReintentar={cargarUsuarios}
      />

      {modalAgregarAbierto && (
        <AgregarUsuarioModal
          abierto={modalAgregarAbierto}
          onCerrar={() => setModalAgregarAbierto(false)}
          onMockGuardado={confirmarAgregarUsuarioMock}
        />
      )}

      {usuarioEditando && (
        <EditarUsuarioModal
          abierto={true}
          usuario={usuarioEditando}
          onCerrar={cerrarModalEdicion}
          onGuardado={confirmarEdicion}
        />
      )}
    </div>
  )
}
