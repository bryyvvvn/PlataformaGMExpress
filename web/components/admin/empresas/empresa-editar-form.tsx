import Link from "next/link"
import { ArrowLeft, Building2, CircleDollarSign, MapPin, Save, UserRound, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  EmpresaCobranzaFields,
  EmpresaContactoFields,
  EmpresaDatosGeneralesFields,
  EmpresaHoraDespachoField,
  EmpresaRepresentanteFields,
  EmpresaUbicacionFields,
} from "@/components/admin/empresas/empresa-form-fields"
import type {
  ContactoEmpresaForm,
  ContactoFormularioTipo,
  EmpresaEditForm,
  EmpresaFormularioBase,
  EstadoEmpresaCliente,
} from "@/lib/empresas/tipos"

type EditarEmpresaChange = (
  campo: keyof EmpresaEditForm,
  valor: string | EstadoEmpresaCliente
) => void

export function EmpresaEditarHeader({
  detalleHref,
  form,
  empresaNombre,
  guardando,
  onCancelar,
}: {
  detalleHref: string
  form: EmpresaEditForm
  empresaNombre: string
  guardando: boolean
  onCancelar: () => void
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3">
        <Link href={detalleHref} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-[#1B2C56]">
              Editar empresa
            </h1>
            <Badge
              variant={form.estado === "ACTIVA" ? "default" : "secondary"}
              className={
                form.estado === "ACTIVA"
                  ? "bg-[#75aa46] text-white"
                  : "bg-slate-200 text-slate-600"
              }
            >
              {form.estado === "ACTIVA" ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            {empresaNombre || "Actualiza los datos administrativos de la empresa"}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={guardando}
        onClick={onCancelar}
      >
        Cancelar
      </Button>
    </div>
  )
}

export function EmpresaEditarForm({
  form,
  guardando,
  horaDespachoActivada,
  contactoTitularForm,
  contactoSuplenteForm,
  contactoCobranzaForm,
  actualizarCampoEmpresa,
  alternarHoraDespacho,
  actualizarContacto,
  guardarCambios,
  onCancelar,
}: {
  form: EmpresaEditForm
  guardando: boolean
  horaDespachoActivada: boolean
  contactoTitularForm: ContactoEmpresaForm
  contactoSuplenteForm: ContactoEmpresaForm
  contactoCobranzaForm: ContactoEmpresaForm
  actualizarCampoEmpresa: EditarEmpresaChange
  alternarHoraDespacho: (activada: boolean) => void
  actualizarContacto: (
    tipo: ContactoFormularioTipo,
    campo: keyof ContactoEmpresaForm,
    valor: string
  ) => void
  guardarCambios: () => void
  onCancelar: () => void
}) {
  const actualizarCampoBase = (
    campo: keyof EmpresaFormularioBase,
    valor: string | EstadoEmpresaCliente
  ) => actualizarCampoEmpresa(campo, valor)

  return (
    <>
      <Card className="rounded-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
            <Building2 className="h-4 w-4" />
            Datos generales
          </CardTitle>
          <CardDescription>Información administrativa principal</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <EmpresaDatosGeneralesFields
            form={form}
            disabled={guardando}
            onChange={actualizarCampoBase}
          />
        </CardContent>
      </Card>

      <Card className="rounded-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
            <MapPin className="h-4 w-4" />
            Ubicación / faena
          </CardTitle>
          <CardDescription>Dirección y datos operativos</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <EmpresaUbicacionFields
            form={form}
            disabled={guardando}
            onChange={actualizarCampoBase}
          />
          <EmpresaHoraDespachoField
            horaDespacho={form.horaDespacho}
            horaDespachoActivada={horaDespachoActivada}
            disabled={guardando}
            onToggle={alternarHoraDespacho}
            onChange={(valor) => actualizarCampoEmpresa("horaDespacho", valor)}
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
        <CardContent className="grid gap-4 md:grid-cols-2">
          <EmpresaRepresentanteFields
            form={form}
            disabled={guardando}
            onChange={actualizarCampoBase}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
              <UserRound className="h-4 w-4" />
              Interlocutor titular
            </CardTitle>
            <CardDescription>
              Contacto principal obligatorio de la empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <EmpresaContactoFields
              tipo="titular"
              form={contactoTitularForm}
              disabled={guardando}
              required
              layout="card"
              onChange={actualizarContacto}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
              <Users className="h-4 w-4" />
              Interlocutor suplente
            </CardTitle>
            <CardDescription>
              Contacto opcional. Si queda vacío, se desactivará el suplente activo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <EmpresaContactoFields
              tipo="suplente"
              form={contactoSuplenteForm}
              disabled={guardando}
              required={false}
              layout="card"
              onChange={actualizarContacto}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
              <CircleDollarSign className="h-4 w-4" />
              Datos de cobranza
            </CardTitle>
            <CardDescription>
              Contacto obligatorio para gestion de cobranza
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <EmpresaCobranzaFields
              form={contactoCobranzaForm}
              disabled={guardando}
              layout="card"
              onChange={actualizarContacto}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={guardando}
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={guardando}
          onClick={guardarCambios}
          className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
        >
          <Save className="mr-2 h-4 w-4" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </>
  )
}
