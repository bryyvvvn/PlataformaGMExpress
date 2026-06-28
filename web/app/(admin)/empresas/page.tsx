"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  EmpresasHeader,
  EmpresasStats,
  EmpresasTable,
} from "@/components/admin/empresas/empresas-listado"
import { useEmpresas } from "@/hooks/useEmpresas"

const EmpresaConvenioModal = dynamic(
  () =>
    import("@/components/admin/empresas/empresa-convenio-modal").then(
      (mod) => mod.EmpresaConvenioModal
    ),
  { ssr: false }
)

export default function EmpresasView() {
  const router = useRouter()
  const {
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
  } = useEmpresas()

  const totalTrabajadores = empresas.reduce((sum, e) => sum + e.trabajadores, 0)
  const empresasActivas = empresas.filter((e) => e.estado === "ACTIVA").length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <EmpresasHeader
        empresasActivas={empresasActivas}
        totalTrabajadores={totalTrabajadores}
      />

      <EmpresasStats
        totalEmpresas={empresas.length}
        empresasActivas={empresasActivas}
        totalTrabajadores={totalTrabajadores}
      />

      <EmpresasTable
        empresas={empresas}
        loading={loading}
        error={error}
        errorEstadoEmpresa={errorEstadoEmpresa}
        empresaCambiandoEstadoId={empresaCambiandoEstadoId}
        cargarEmpresas={cargarEmpresas}
        onEditarConvenio={abrirModalConvenio}
        onVerDetalle={(empresa) => router.push(`/empresas/${empresa.id}`)}
        onEditarEmpresa={(empresa) => router.push(`/empresas/${empresa.id}/editar`)}
        onVerTrabajadores={(empresa) =>
          router.push(`/empresas/${empresa.id}/trabajadores`)
        }
        onCambiarEstado={cambiarEstadoEmpresa}
      />

      {empresaConvenioSeleccionada && (
        <EmpresaConvenioModal
          empresa={empresaConvenioSeleccionada}
          convenioForm={convenioForm}
          guardandoConvenio={guardandoConvenio}
          errorConvenio={errorConvenio}
          cerrarModalConvenio={cerrarModalConvenio}
          actualizarCampoConvenio={actualizarCampoConvenio}
          actualizarTipoEmpaquetado={actualizarTipoEmpaquetado}
          guardarConvenio={guardarConvenio}
        />
      )}
    </div>
  )
}
