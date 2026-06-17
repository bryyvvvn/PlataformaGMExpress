"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  EmpresaDetalleContactos,
  EmpresaDetalleConvenio,
  EmpresaDetalleDatosGenerales,
  EmpresaDetalleHeader,
  EmpresaDetalleMetricas,
  EmpresaDetalleRepresentante,
  EmpresaDetalleUbicacion,
} from "@/components/admin/empresas/empresa-detalle"
import { useEmpresaDetalle } from "@/hooks/useEmpresaDetalle"
import { getHoraLimiteEfectiva } from "@/lib/horario-pedidos"

export default function EmpresaDetallePage() {
  const params = useParams<{ empresaId?: string | string[] }>()
  const empresaId = Array.isArray(params.empresaId)
    ? params.empresaId[0]
    : params.empresaId
  const { empresa, loading, error, horaGlobal, cargarDetalle } =
    useEmpresaDetalle(empresaId)

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <p className="text-sm text-slate-600">
          Cargando detalle de empresa...
        </p>
      </div>
    )
  }

  if (error || !empresa) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <Link
          href="/empresas"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-3 px-4 py-6">
            <p className="text-sm text-slate-600">
              {error ?? "No se pudo cargar el detalle de la empresa"}
            </p>
            <Button variant="outline" onClick={cargarDetalle}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const subtitulo =
    empresa.razonSocial ??
    empresa.correo_contacto ??
    "Sin razon social o correo registrado"

  const horarioEfectivo = getHoraLimiteEfectiva(empresa.horaDespacho, horaGlobal)
  const horaLimiteEfectivaTexto = `${horarioEfectivo.horaLimite} (${
    horarioEfectivo.fuenteHora === "empresa" ? "calculada desde despacho" : "hora global"
  })`

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <EmpresaDetalleHeader empresa={empresa} subtitulo={subtitulo} />

      <EmpresaDetalleMetricas empresa={empresa} />

      <div className="grid gap-4 lg:grid-cols-2">
        <EmpresaDetalleDatosGenerales
          empresa={empresa}
          horaLimiteEfectivaTexto={horaLimiteEfectivaTexto}
        />
        <EmpresaDetalleUbicacion empresa={empresa} />
        <EmpresaDetalleRepresentante empresa={empresa} />
        <EmpresaDetalleConvenio empresa={empresa} />
      </div>

      <EmpresaDetalleContactos empresa={empresa} />
    </div>
  )
}
