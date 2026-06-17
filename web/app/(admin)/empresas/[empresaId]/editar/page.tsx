"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  EmpresaEditarForm,
  EmpresaEditarHeader,
} from "@/components/admin/empresas/empresa-editar-form"
import { useEditarEmpresa } from "@/hooks/useEditarEmpresa"

export default function EditarEmpresaPage() {
  const router = useRouter()
  const params = useParams<{ empresaId?: string | string[] }>()
  const empresaId = Array.isArray(params.empresaId)
    ? params.empresaId[0]
    : params.empresaId
  const {
    loading,
    guardando,
    error,
    empresaCargada,
    empresaNombre,
    form,
    horaDespachoActivada,
    contactoTitularForm,
    contactoSuplenteForm,
    contactoCobranzaForm,
    detalleHref,
    cargarEmpresa,
    actualizarCampoEmpresa,
    alternarHoraDespacho,
    actualizarContacto,
    guardarCambios,
  } = useEditarEmpresa(empresaId)

  const cancelar = () => router.push(detalleHref)

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <p className="text-sm text-slate-600">Cargando empresa...</p>
      </div>
    )
  }

  if (!empresaId || (!empresaCargada && error)) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <Link href="/empresas" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-3 px-4 py-6">
            <p className="text-sm text-slate-600">
              {error ?? "No se pudo cargar la empresa"}
            </p>
            {empresaId && (
              <Button variant="outline" onClick={cargarEmpresa}>
                Reintentar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <EmpresaEditarHeader
        detalleHref={detalleHref}
        form={form}
        empresaNombre={empresaNombre}
        guardando={guardando}
        onCancelar={cancelar}
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <EmpresaEditarForm
        form={form}
        guardando={guardando}
        horaDespachoActivada={horaDespachoActivada}
        contactoTitularForm={contactoTitularForm}
        contactoSuplenteForm={contactoSuplenteForm}
        contactoCobranzaForm={contactoCobranzaForm}
        actualizarCampoEmpresa={actualizarCampoEmpresa}
        alternarHoraDespacho={alternarHoraDespacho}
        actualizarContacto={actualizarContacto}
        guardarCambios={guardarCambios}
        onCancelar={cancelar}
      />
    </div>
  )
}
