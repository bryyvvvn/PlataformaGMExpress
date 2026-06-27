import Link from "next/link"
import type { ReactNode } from "react"
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
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LABELS_TIPO_CONTACTO,
  PRODUCTOS_CONVENIO,
} from "@/lib/empresas/constantes"
import {
  formatearFecha,
  mostrarTexto,
  mostrarTipoEmpaquetado,
} from "@/lib/empresas/formatos"
import type { EmpresaDetalle } from "@/lib/empresas/tipos"

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

export function EmpresaDetalleHeader({
  empresa,
  subtitulo,
}: {
  empresa: EmpresaDetalle
  subtitulo: string
}) {
  return (
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
            <Badge
              variant="secondary"
              className={
                empresa.esSucursal
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }
            >
              {empresa.esSucursal ? "Sucursal" : "Casa matriz"}
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
  )
}

export function EmpresaDetalleMetricas({
  empresa,
}: {
  empresa: EmpresaDetalle
}) {
  return (
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
  )
}

export function EmpresaDetalleDatosGenerales({
  empresa,
  horaLimiteEfectivaTexto,
}: {
  empresa: EmpresaDetalle
  horaLimiteEfectivaTexto: string
}) {
  return (
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
        <Dato label="Razon social" value={mostrarTexto(empresa.razonSocial)} />
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
        <Dato
          label="Tipo"
          value={empresa.esSucursal ? "Sucursal" : "Casa matriz"}
        />
        {empresa.esSucursal && (
          <Dato
            label="Casa matriz"
            value={empresa.casaMatriz?.nombre ?? "Sin casa matriz"}
          />
        )}
        {!empresa.esSucursal && empresa.sucursales.length > 0 && (
          <Dato
            label="Sucursales"
            value={empresa.sucursales.map((sucursal) => sucursal.nombre).join(", ")}
          />
        )}
        <Dato label="Creada" value={formatearFecha(empresa.creado_en)} />
        <Dato label="Hora límite de pedidos" value={horaLimiteEfectivaTexto} />
      </CardContent>
    </Card>
  )
}

export function EmpresaDetalleUbicacion({
  empresa,
}: {
  empresa: EmpresaDetalle
}) {
  return (
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
        <Dato label="Nombre faena" value={mostrarTexto(empresa.nombreFaena)} />
        <Dato
          label="Direccion faena"
          value={mostrarTexto(empresa.direccionFaena)}
        />
      </CardContent>
    </Card>
  )
}

export function EmpresaDetalleRepresentante({
  empresa,
}: {
  empresa: EmpresaDetalle
}) {
  return (
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
        <Dato
          label="Fecha nacimiento representante legal"
          value={formatearFecha(empresa.fechaNacimientoRepresentanteLegal)}
        />
      </CardContent>
    </Card>
  )
}

export function EmpresaDetalleConvenio({
  empresa,
}: {
  empresa: EmpresaDetalle
}) {
  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-4 py-3">
        <CardTitle className="text-sm font-semibold text-[#1B2C56]">Convenio</CardTitle>
        <CardDescription>
          Productos disponibles para la empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {empresa.convenio ? (
          <div className="space-y-4">
            <Dato
              label="Tipo de empaquetado"
              value={mostrarTipoEmpaquetado(empresa.convenio.tipoEmpaquetado)}
            />
            <Dato
              label="Trabaja fin de semana"
              value={Boolean(empresa.convenio.trabajaFinDeSemana) ? "Sí" : "No"}
            />

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
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin convenio registrado.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function EmpresaDetalleContactos({
  empresa,
}: {
  empresa: EmpresaDetalle
}) {
  return (
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
                  <Badge variant="secondary">
                    {LABELS_TIPO_CONTACTO[contacto.tipo]}
                  </Badge>
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
                  {contacto.tipo !== "COBRANZA" && (
                    <Dato label="RUT" value={mostrarTexto(contacto.rut)} />
                  )}
                  <Dato label="Rol/cargo" value={mostrarTexto(contacto.rolCargo)} />
                  <Dato label="Telefono" value={mostrarTexto(contacto.telefono)} />
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
  )
}
