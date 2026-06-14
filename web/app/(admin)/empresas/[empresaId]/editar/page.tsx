"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Building2, MapPin, Save, UserRound, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TimePickerBlock } from "@/components/ui/time-picker-block"
import { getHoraLimiteEfectiva } from "@/lib/horario-pedidos"

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
  horaDespacho: string | null
  contactos: ContactoEmpresa[]
}

type EmpresaDetalleResponse = {
  empresa: EmpresaDetalle
}

type EmpresaEditForm = {
  nombre: string
  razonSocial: string
  rut: string
  nombreComercial: string
  correo_contacto: string
  telefono: string
  direccion: string
  comuna: string
  region: string
  sector: string
  nombreFaena: string
  direccionFaena: string
  representanteLegal: string
  rutRepresentanteLegal: string
  estado: "ACTIVA" | "INACTIVA"
  horaDespacho: string
}

type ContactoEmpresaForm = {
  nombresApellidos: string
  rut: string
  rolCargo: string
  telefono: string
  email: string
  fechaNacimiento: string
}

const EMPRESA_DEFAULTS: EmpresaEditForm = {
  nombre: "",
  razonSocial: "",
  rut: "",
  nombreComercial: "",
  correo_contacto: "",
  telefono: "",
  direccion: "",
  comuna: "",
  region: "",
  sector: "",
  nombreFaena: "",
  direccionFaena: "",
  representanteLegal: "",
  rutRepresentanteLegal: "",
  estado: "ACTIVA",
  horaDespacho: "",
}

const CONTACTO_DEFAULTS: ContactoEmpresaForm = {
  nombresApellidos: "",
  rut: "",
  rolCargo: "",
  telefono: "",
  email: "",
  fechaNacimiento: "",
}

function textoFormulario(value: string | null | undefined) {
  return value ?? ""
}

function fechaParaInput(value: string | null | undefined) {
  if (!value) return ""

  const fecha = new Date(value)

  if (Number.isNaN(fecha.getTime())) {
    return ""
  }

  return fecha.toISOString().slice(0, 10)
}

function calcularCierrePorDespacho(horaDespacho: string): string {
  // horaGlobal no se usa cuando horaDespacho esta definido
  return getHoraLimiteEfectiva(horaDespacho, horaDespacho).horaLimite
}

function contactoAFormulario(contacto: ContactoEmpresa | undefined): ContactoEmpresaForm {
  if (!contacto) {
    return CONTACTO_DEFAULTS
  }

  return {
    nombresApellidos: textoFormulario(contacto.nombresApellidos),
    rut: textoFormulario(contacto.rut),
    rolCargo: textoFormulario(contacto.rolCargo),
    telefono: textoFormulario(contacto.telefono),
    email: textoFormulario(contacto.email),
    fechaNacimiento: fechaParaInput(contacto.fechaNacimiento),
  }
}

export default function EditarEmpresaPage() {
  const router = useRouter()
  const params = useParams<{ empresaId?: string | string[] }>()
  const empresaId = Array.isArray(params.empresaId)
    ? params.empresaId[0]
    : params.empresaId

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [empresaCargada, setEmpresaCargada] = useState(false)
  const [empresaNombre, setEmpresaNombre] = useState("")
  const [form, setForm] = useState<EmpresaEditForm>(EMPRESA_DEFAULTS)
  const [horaDespachoActivada, setHoraDespachoActivada] = useState(false)
  const [contactoTitularForm, setContactoTitularForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)
  const [contactoSuplenteForm, setContactoSuplenteForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)

  const detalleHref = empresaId ? `/empresas/${empresaId}` : "/empresas"

  const hidratarFormulario = useCallback((empresa: EmpresaDetalle) => {
    const contactoTitular = empresa.contactos.find(
      (contacto) => contacto.tipo === "TITULAR" && contacto.activo
    )
    const contactoSuplente = empresa.contactos.find(
      (contacto) => contacto.tipo === "SUPLENTE" && contacto.activo
    )

    setEmpresaCargada(true)
    setEmpresaNombre(empresa.nombre)
    setHoraDespachoActivada(empresa.horaDespacho !== null)
    setForm({
      nombre: empresa.nombre,
      razonSocial: textoFormulario(empresa.razonSocial),
      rut: textoFormulario(empresa.rut),
      nombreComercial: textoFormulario(empresa.nombreComercial),
      correo_contacto: textoFormulario(empresa.correo_contacto),
      telefono: textoFormulario(empresa.telefono),
      direccion: textoFormulario(empresa.direccion),
      comuna: textoFormulario(empresa.comuna),
      region: textoFormulario(empresa.region),
      sector: textoFormulario(empresa.sector),
      nombreFaena: textoFormulario(empresa.nombreFaena),
      direccionFaena: textoFormulario(empresa.direccionFaena),
      representanteLegal: textoFormulario(empresa.representanteLegal),
      rutRepresentanteLegal: textoFormulario(empresa.rutRepresentanteLegal),
      estado: empresa.estado,
      horaDespacho: textoFormulario(empresa.horaDespacho),
    })
    setContactoTitularForm(contactoAFormulario(contactoTitular))
    setContactoSuplenteForm(contactoAFormulario(contactoSuplente))
  }, [])

  const cargarEmpresa = useCallback(async () => {
    if (!empresaId) {
      setError("No se pudo cargar la empresa")
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
        throw new Error("No se pudo cargar la empresa")
      }

      const data = (await response.json()) as EmpresaDetalleResponse
      hidratarFormulario(data.empresa)
    } catch (err) {
      console.error("[EditarEmpresaPage] Error cargando empresa:", err)
      setError("No se pudo cargar la empresa")
    } finally {
      setLoading(false)
    }
  }, [empresaId, hidratarFormulario])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarEmpresa()
    })
  }, [cargarEmpresa])

  const actualizarCampoEmpresa = <K extends keyof EmpresaEditForm>(
    campo: K,
    valor: EmpresaEditForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const alternarHoraDespacho = (activada: boolean) => {
    setHoraDespachoActivada(activada)
    actualizarCampoEmpresa("horaDespacho", activada ? form.horaDespacho || "08:00" : "")
  }

  const actualizarContacto = (
    tipo: "titular" | "suplente",
    campo: keyof ContactoEmpresaForm,
    valor: string
  ) => {
    const setContacto =
      tipo === "titular" ? setContactoTitularForm : setContactoSuplenteForm

    setContacto((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const titularCompleto = () =>
    contactoTitularForm.nombresApellidos.trim().length > 0 &&
    contactoTitularForm.rut.trim().length > 0 &&
    contactoTitularForm.rolCargo.trim().length > 0 &&
    contactoTitularForm.telefono.trim().length > 0 &&
    contactoTitularForm.email.trim().length > 0

  const guardarCambios = async () => {
    if (!empresaId) return

    if (form.nombre.trim().length === 0) {
      setError("El nombre de la empresa es obligatorio")
      return
    }

    if (!titularCompleto()) {
      setError("Completa los datos obligatorios del interlocutor titular")
      return
    }

    setGuardando(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/empresas/${empresaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          horaDespacho: form.horaDespacho || null,
          contactoTitular: {
            ...contactoTitularForm,
            fechaNacimiento: contactoTitularForm.fechaNacimiento || null,
          },
          contactoSuplente: {
            ...contactoSuplenteForm,
            fechaNacimiento: contactoSuplenteForm.fechaNacimiento || null,
          },
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "No se pudo actualizar la empresa")
      }

      router.push(`/empresas/${empresaId}`)
    } catch (err) {
      console.error("[EditarEmpresaPage] Error guardando empresa:", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar la empresa")
    } finally {
      setGuardando(false)
    }
  }

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
          onClick={() => router.push(detalleHref)}
        >
          Cancelar
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="rounded-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
            <Building2 className="h-4 w-4" />
            Datos generales
          </CardTitle>
          <CardDescription>Información administrativa principal</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre interno de empresa *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              disabled={guardando}
              onChange={(event) => actualizarCampoEmpresa("nombre", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razonSocial">Razón social</Label>
            <Input
              id="razonSocial"
              value={form.razonSocial}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa("razonSocial", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rut">RUT</Label>
            <Input
              id="rut"
              value={form.rut}
              disabled={guardando}
              onChange={(event) => actualizarCampoEmpresa("rut", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreComercial">Nombre comercial</Label>
            <Input
              id="nombreComercial"
              value={form.nombreComercial}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa("nombreComercial", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correoContacto">Correo de contacto</Label>
            <Input
              id="correoContacto"
              type="email"
              value={form.correo_contacto}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa("correo_contacto", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={form.telefono}
              disabled={guardando}
              onChange={(event) => actualizarCampoEmpresa("telefono", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              value={form.estado}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa(
                  "estado",
                  event.target.value as EmpresaEditForm["estado"]
                )
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
            </select>
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={form.direccion}
              disabled={guardando}
              onChange={(event) => actualizarCampoEmpresa("direccion", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comuna">Comuna</Label>
            <Input
              id="comuna"
              value={form.comuna}
              disabled={guardando}
              onChange={(event) => actualizarCampoEmpresa("comuna", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Región</Label>
            <Input
              id="region"
              value={form.region}
              disabled={guardando}
              onChange={(event) => actualizarCampoEmpresa("region", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              value={form.sector}
              disabled={guardando}
              onChange={(event) => actualizarCampoEmpresa("sector", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreFaena">Nombre faena</Label>
            <Input
              id="nombreFaena"
              value={form.nombreFaena}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa("nombreFaena", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccionFaena">Dirección faena</Label>
            <Input
              id="direccionFaena"
              value={form.direccionFaena}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa("direccionFaena", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Hora de Despacho</Label>

            <label className="flex items-center gap-2 text-sm font-normal text-slate-600">
              <input
                type="checkbox"
                checked={horaDespachoActivada}
                disabled={guardando}
                onChange={(event) => alternarHoraDespacho(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#75aa46] focus:ring-[#75aa46]"
              />
              Configurar hora específica
            </label>

            {horaDespachoActivada && (
              <TimePickerBlock
                value={form.horaDespacho || "08:00"}
                onChange={(valor) => actualizarCampoEmpresa("horaDespacho", valor)}
                min="06:00"
                max="23:00"
                disabled={guardando}
              />
            )}

            <p className="text-xs leading-relaxed text-slate-500">
              {horaDespachoActivada && form.horaDespacho
                ? `Cierre de pedidos: ${calcularCierrePorDespacho(form.horaDespacho)} (3 horas antes del despacho)`
                : "Sin hora específica — aplicará la hora global del sistema"}
            </p>
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="representanteLegal">Representante legal</Label>
            <Input
              id="representanteLegal"
              value={form.representanteLegal}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa("representanteLegal", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rutRepresentanteLegal">RUT representante legal</Label>
            <Input
              id="rutRepresentanteLegal"
              value={form.rutRepresentanteLegal}
              disabled={guardando}
              onChange={(event) =>
                actualizarCampoEmpresa("rutRepresentanteLegal", event.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="titularNombres">Nombres y apellidos *</Label>
              <Input
                id="titularNombres"
                value={contactoTitularForm.nombresApellidos}
                disabled={guardando}
                onChange={(event) =>
                  actualizarContacto("titular", "nombresApellidos", event.target.value)
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titularRut">RUT *</Label>
                <Input
                  id="titularRut"
                  value={contactoTitularForm.rut}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("titular", "rut", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularRol">Rol/cargo *</Label>
                <Input
                  id="titularRol"
                  value={contactoTitularForm.rolCargo}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("titular", "rolCargo", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularTelefono">Teléfono *</Label>
                <Input
                  id="titularTelefono"
                  value={contactoTitularForm.telefono}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("titular", "telefono", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularEmail">Email *</Label>
                <Input
                  id="titularEmail"
                  type="email"
                  value={contactoTitularForm.email}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("titular", "email", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularFecha">Fecha nacimiento</Label>
                <Input
                  id="titularFecha"
                  type="date"
                  value={contactoTitularForm.fechaNacimiento}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("titular", "fechaNacimiento", event.target.value)
                  }
                />
              </div>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="suplenteNombres">Nombres y apellidos</Label>
              <Input
                id="suplenteNombres"
                value={contactoSuplenteForm.nombresApellidos}
                disabled={guardando}
                onChange={(event) =>
                  actualizarContacto("suplente", "nombresApellidos", event.target.value)
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="suplenteRut">RUT</Label>
                <Input
                  id="suplenteRut"
                  value={contactoSuplenteForm.rut}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("suplente", "rut", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suplenteRol">Rol/cargo</Label>
                <Input
                  id="suplenteRol"
                  value={contactoSuplenteForm.rolCargo}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("suplente", "rolCargo", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suplenteTelefono">Teléfono</Label>
                <Input
                  id="suplenteTelefono"
                  value={contactoSuplenteForm.telefono}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("suplente", "telefono", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suplenteEmail">Email</Label>
                <Input
                  id="suplenteEmail"
                  type="email"
                  value={contactoSuplenteForm.email}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("suplente", "email", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suplenteFecha">Fecha nacimiento</Label>
                <Input
                  id="suplenteFecha"
                  type="date"
                  value={contactoSuplenteForm.fechaNacimiento}
                  disabled={guardando}
                  onChange={(event) =>
                    actualizarContacto("suplente", "fechaNacimiento", event.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={guardando}
          onClick={() => router.push(detalleHref)}
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
    </div>
  )
}
