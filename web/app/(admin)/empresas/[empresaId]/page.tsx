"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  MapPin,
  Minus,
  Pencil,
  UserRound,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ConvenioEmpresa = {
  id: number
  permitePlato: boolean
  permiteEntrada: boolean
  permitePostre: boolean
  permitePan: boolean
  permiteJugo: boolean
  permiteBebida: boolean
  permiteAguaSaborizada: boolean
}

type CampoConvenio = Exclude<keyof ConvenioEmpresa, "id">

type ContactoEmpresa = {
  id: number
  tipo: "TITULAR" | "SUPLENTE"
  nombresApellidos: string | null
  rut: string | null
  rolCargo: string | null
  telefono: string | null
  email: string | null
  fechaNacimiento: string | null
  activo: boolean
}

type EmpresaDetalle = {
  id: number
  nombre: string
  razonSocial: string | null
  rut: string | null
  nombreComercial: string | null
  correo_contacto: string | null
  telefono: string | null
  direccion: string | null
  comuna: string | null
  region: string | null
  sector: string | null
  nombreFaena: string | null
  direccionFaena: string | null
  representanteLegal: string | null
  rutRepresentanteLegal: string | null
  estado: "ACTIVA" | "INACTIVA"
  creado_en: string
  actualizado_en: string
  convenio: ConvenioEmpresa | null
  contactos: ContactoEmpresa[]
  metricas: {
    trabajadores: number
    representantes: number
    pedidos: number
  }
}

type EmpresaDetalleResponse = {
  empresa: EmpresaDetalle
}

const PRODUCTOS_CONVENIO: Array<{
  campo: CampoConvenio
  label: string
}> = [
  { campo: "permitePlato", label: "Plato" },
  { campo: "permiteEntrada", label: "Entrada" },
  { campo: "permitePostre", label: "Postre" },
  { campo: "permitePan", label: "Pan" },
  { campo: "permiteJugo", label: "Jugo" },
  { campo: "permiteBebida", label: "Bebida" },
  { campo: "permiteAguaSaborizada", label: "Agua saborizada" },
]

function mostrarTexto(value: string | null | undefined) {
  const texto = value?.trim()

  return texto && texto.length > 0 ? texto : "No registrado"
}

function formatearFecha(value: string | null | undefined) {
  if (!value) return "No registrado"

  const fecha = new Date(value)

  if (Number.isNaN(fecha.getTime())) {
    return "No registrado"
  }

  return new Intl.DateTimeFormat("es-CL").format(fecha)
}

function Dato({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export default function EmpresaDetallePage() {
  const params = useParams<{ empresaId?: string | string[] }>()
  const empresaId = Array.isArray(params.empresaId)
    ? params.empresaId[0]
    : params.empresaId

  const [empresa, setEmpresa] = useState<EmpresaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDetalle = useCallback(async () => {
    if (!empresaId) {
      setError("No se pudo cargar el detalle de la empresa")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/empresas/${empresaId}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudo cargar el detalle de la empresa")
      }

      const data = (await response.json()) as EmpresaDetalleResponse
      setEmpresa(data.empresa)
    } catch (err) {
      console.error("[EmpresaDetallePage] Error:", err)
      setError("No se pudo cargar el detalle de la empresa")
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarDetalle()
    })
  }, [cargarDetalle])

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <div className="flex flex-col gap-3">
        <Link
          href="/empresas"
          className={buttonVariants({
            variant: "outline",
            className: "w-fit",
          })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-[#1B2C56]">
                {empresa.nombre}
              </h1>
              <Badge
                variant={empresa.estado === "ACTIVA" ? "default" : "secondary"}
                className={
                  empresa.estado === "ACTIVA"
                    ? "bg-[#75aa46] text-white"
                    : "bg-slate-200 text-slate-600"
                }
              >
                {empresa.estado === "ACTIVA" ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{subtitulo}</p>
          </div>

          <Link
            href={`/empresas/${empresa.id}/editar`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar empresa
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-4 pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4" />
              Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-semibold text-[#1B2C56]">
              {empresa.metricas.trabajadores}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-4 pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <UserRound className="h-4 w-4" />
              Representantes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-semibold text-[#75AA46]">
              {empresa.metricas.representantes}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-4 pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <ClipboardList className="h-4 w-4" />
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-semibold text-[#1B2C56]">
              {empresa.metricas.pedidos}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
              <Building2 className="h-4 w-4" />
              Datos generales
            </CardTitle>
            <CardDescription>
              Informacion administrativa de la empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Dato label="Nombre" value={empresa.nombre} />
            <Dato
              label="Razon social"
              value={mostrarTexto(empresa.razonSocial)}
            />
            <Dato label="RUT" value={mostrarTexto(empresa.rut)} />
            <Dato
              label="Nombre comercial"
              value={mostrarTexto(empresa.nombreComercial)}
            />
            <Dato
              label="Correo contacto"
              value={mostrarTexto(empresa.correo_contacto)}
            />
            <Dato label="Telefono" value={mostrarTexto(empresa.telefono)} />
            <Dato
              label="Estado"
              value={empresa.estado === "ACTIVA" ? "Activa" : "Inactiva"}
            />
            <Dato label="Creada" value={formatearFecha(empresa.creado_en)} />
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
              <MapPin className="h-4 w-4" />
              Ubicacion / faena
            </CardTitle>
            <CardDescription>Direccion y datos operativos</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Dato label="Direccion" value={mostrarTexto(empresa.direccion)} />
            <Dato label="Comuna" value={mostrarTexto(empresa.comuna)} />
            <Dato label="Region" value={mostrarTexto(empresa.region)} />
            <Dato label="Sector" value={mostrarTexto(empresa.sector)} />
            <Dato
              label="Nombre faena"
              value={mostrarTexto(empresa.nombreFaena)}
            />
            <Dato
              label="Direccion faena"
              value={mostrarTexto(empresa.direccionFaena)}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
              <UserRound className="h-4 w-4" />
              Representante legal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Dato
              label="Representante legal"
              value={mostrarTexto(empresa.representanteLegal)}
            />
            <Dato
              label="RUT representante legal"
              value={mostrarTexto(empresa.rutRepresentanteLegal)}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-[#1B2C56]">Convenio</CardTitle>
            <CardDescription>
              Productos disponibles para la empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {empresa.convenio ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {PRODUCTOS_CONVENIO.map((producto) => {
                  const permitido = empresa.convenio?.[producto.campo] ?? false

                  return (
                    <div
                      key={producto.campo}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                    >
                      <span className="text-sm font-medium">
                        {producto.label}
                      </span>
                      <Badge
                        variant={permitido ? "default" : "secondary"}
                        className={permitido ? "bg-[#75aa46] text-white" : ""}
                      >
                        {permitido ? (
                          <Check className="mr-1 h-3 w-3" />
                        ) : (
                          <Minus className="mr-1 h-3 w-3" />
                        )}
                        {permitido ? "Permitido" : "No incluido"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin convenio registrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
            <CalendarDays className="h-4 w-4" />
            Contactos
          </CardTitle>
          <CardDescription>
            Interlocutores registrados para esta empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {empresa.contactos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin contactos registrados.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {empresa.contactos.map((contacto) => (
                <div
                  key={contacto.id}
                  className="rounded-md border border-slate-200 p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{contacto.tipo}</Badge>
                    <Badge
                      variant={contacto.activo ? "default" : "secondary"}
                      className={contacto.activo ? "bg-[#75aa46] text-white" : ""}
                    >
                      {contacto.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Dato
                      label="Nombre"
                      value={mostrarTexto(contacto.nombresApellidos)}
                    />
                    <Dato label="RUT" value={mostrarTexto(contacto.rut)} />
                    <Dato
                      label="Rol/cargo"
                      value={mostrarTexto(contacto.rolCargo)}
                    />
                    <Dato
                      label="Telefono"
                      value={mostrarTexto(contacto.telefono)}
                    />
                    <Dato label="Email" value={mostrarTexto(contacto.email)} />
                    <Dato
                      label="Fecha nacimiento"
                      value={formatearFecha(contacto.fechaNacimiento)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
