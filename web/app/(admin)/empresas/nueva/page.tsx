"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileText,
  User,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ConvenioForm = {
  permitePlato: boolean
  permiteEntrada: boolean
  permitePostre: boolean
  permitePan: boolean
  permiteJugo: boolean
  permiteBebida: boolean
  permiteAguaSaborizada: boolean
  trabajaFinDeSemana: boolean
  tipoEmpaquetado: TipoEmpaquetado | null
}

type TipoEmpaquetado =
  | "BOWL_CRAFT"
  | "C10_ALUMINIO"
  | "SERVICIO_TRADICIONAL_PLATO"

type CampoBooleanoConvenio = Exclude<keyof ConvenioForm, "tipoEmpaquetado">

type CrearEmpresaForm = {
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
}

type ContactoEmpresaForm = {
  nombresApellidos: string
  rut: string
  rolCargo: string
  telefono: string
  email: string
  fechaNacimiento: string
}

type PasoCrearEmpresa = 0 | 1 | 2 | 3

const CONVENIO_DEFAULTS: ConvenioForm = {
  permitePlato: true,
  permiteEntrada: true,
  permitePostre: true,
  permitePan: true,
  permiteJugo: true,
  permiteBebida: false,
  permiteAguaSaborizada: false,
  trabajaFinDeSemana: false,
  tipoEmpaquetado: null,
}

const CREAR_EMPRESA_DEFAULTS: CrearEmpresaForm = {
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
}

const CONTACTO_DEFAULTS: ContactoEmpresaForm = {
  nombresApellidos: "",
  rut: "",
  rolCargo: "",
  telefono: "",
  email: "",
  fechaNacimiento: "",
}

const OPCIONES_CONVENIO: Array<{
  campo: CampoBooleanoConvenio
  label: string
  ayuda?: string
}> = [
  { campo: "permitePlato", label: "Plato" },
  { campo: "permiteEntrada", label: "Entrada" },
  { campo: "permitePostre", label: "Postre" },
  { campo: "permitePan", label: "Pan" },
  { campo: "permiteJugo", label: "Jugo" },
  { campo: "permiteBebida", label: "Bebida" },
  { campo: "permiteAguaSaborizada", label: "Agua saborizada" },
  {
    campo: "trabajaFinDeSemana",
    label: "¿Trabaja fin de semana?",
    ayuda:
      "Si está activado, la empresa podrá operar y visualizar pedidos de lunes a domingo.",
  },
]

const OPCIONES_TIPO_EMPAQUETADO: Array<{
  value: TipoEmpaquetado
  label: string
}> = [
  { value: "BOWL_CRAFT", label: "Bowl craft" },
  { value: "C10_ALUMINIO", label: "C10 aluminio" },
  {
    value: "SERVICIO_TRADICIONAL_PLATO",
    label: "Servicio tradicional en plato",
  },
]

const PASOS_CREAR_EMPRESA: Array<{
  id: PasoCrearEmpresa
  label: string
  icon: LucideIcon
}> = [
  { id: 0, label: "Datos Generales", icon: Building2 },
  { id: 1, label: "Titular", icon: User },
  { id: 2, label: "Suplente", icon: Users },
  { id: 3, label: "Convenio", icon: FileText },
]

export default function NuevaEmpresaPage() {
  const router = useRouter()
  const [pasoCrearEmpresa, setPasoCrearEmpresa] = useState<PasoCrearEmpresa>(0)
  const [guardandoEmpresa, setGuardandoEmpresa] = useState(false)
  const [errorCrearEmpresa, setErrorCrearEmpresa] = useState<string | null>(null)
  const [crearEmpresaForm, setCrearEmpresaForm] =
    useState<CrearEmpresaForm>(CREAR_EMPRESA_DEFAULTS)
  const [crearEmpresaConvenio, setCrearEmpresaConvenio] =
    useState<ConvenioForm>(CONVENIO_DEFAULTS)
  const [contactoTitularForm, setContactoTitularForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)
  const [contactoSuplenteForm, setContactoSuplenteForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)

  const pasoActual = PASOS_CREAR_EMPRESA[pasoCrearEmpresa]
  const PasoActualIcon = pasoActual.icon

  const actualizarCampoCrearEmpresa = <K extends keyof CrearEmpresaForm>(
    campo: K,
    valor: CrearEmpresaForm[K]
  ) => {
    setCrearEmpresaForm((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const actualizarConvenioCrearEmpresa = (
    campo: CampoBooleanoConvenio,
    checked: boolean
  ) => {
    setCrearEmpresaConvenio((prev) => ({
      ...prev,
      [campo]: checked,
    }))
  }

  const actualizarTipoEmpaquetadoCrearEmpresa = (
    tipoEmpaquetado: TipoEmpaquetado | null
  ) => {
    setCrearEmpresaConvenio((prev) => ({
      ...prev,
      tipoEmpaquetado,
    }))
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

  const avanzarPasoCrearEmpresa = () => {
    if (pasoCrearEmpresa === 0 && crearEmpresaForm.nombre.trim().length === 0) {
      setErrorCrearEmpresa("El nombre de la empresa es obligatorio")
      return
    }

    const titularCompleto =
      contactoTitularForm.nombresApellidos.trim().length > 0 &&
      contactoTitularForm.rolCargo.trim().length > 0 &&
      contactoTitularForm.telefono.trim().length > 0 &&
      contactoTitularForm.email.trim().length > 0

    if (pasoCrearEmpresa === 1 && !titularCompleto) {
      setErrorCrearEmpresa("Completa los datos obligatorios del interlocutor titular")
      return
    }

    setErrorCrearEmpresa(null)

    setPasoCrearEmpresa((prev) => {
      if (prev === 0) return 1
      if (prev === 1) return 2
      if (prev === 2) return 3
      return prev
    })
  }

  const retrocederPasoCrearEmpresa = () => {
    setErrorCrearEmpresa(null)

    setPasoCrearEmpresa((prev) => {
      if (prev === 3) return 2
      if (prev === 2) return 1
      if (prev === 1) return 0
      return prev
    })
  }

  const saltarSuplente = () => {
    setContactoSuplenteForm(CONTACTO_DEFAULTS)
    setErrorCrearEmpresa(null)
    setPasoCrearEmpresa(3)
  }

  const cancelar = () => {
    if (guardandoEmpresa) return
    router.push("/empresas")
  }

  const crearEmpresa = async () => {
    if (crearEmpresaForm.nombre.trim().length === 0) {
      setPasoCrearEmpresa(0)
      setErrorCrearEmpresa("El nombre de la empresa es obligatorio")
      return
    }

    setGuardandoEmpresa(true)
    setErrorCrearEmpresa(null)

    try {
      const response = await fetch("/api/admin/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...crearEmpresaForm,
          convenio: crearEmpresaConvenio,
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
        throw new Error(data?.error ?? "No se pudo crear la empresa")
      }

      router.push("/empresas")
    } catch (err) {
      console.error("[NuevaEmpresaPage] Error creando empresa:", err)
      setErrorCrearEmpresa(err instanceof Error ? err.message : "No se pudo crear la empresa")
    } finally {
      setGuardandoEmpresa(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Empresas
          </p>
          <h1 className="text-xl font-semibold text-[#1B2C56]">
            Agregar Nueva Empresa
          </h1>
          <p className="text-sm text-slate-600">
            Complete los datos para registrar una nueva empresa cliente
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={guardandoEmpresa}
          onClick={cancelar}
        >
          Cancelar
        </Button>
      </div>

      <div className="w-full rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex w-full items-start">
          {PASOS_CREAR_EMPRESA.map((paso, index) => {
            const Icon = paso.icon
            const isCompleted = pasoCrearEmpresa > paso.id
            const isCurrent = pasoCrearEmpresa === paso.id

            return (
              <div key={paso.id} className="flex flex-1 items-start">
                <div className="flex min-w-[76px] flex-col items-center sm:min-w-[110px]">
                  <div
                    className={
                      isCompleted
                        ? "flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#75aa46] bg-[#75aa46] text-white shadow-sm"
                        : isCurrent
                          ? "flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#75aa46] bg-white text-[#75aa46] shadow-sm"
                          : "flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400"
                    }
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={
                      isCurrent || isCompleted
                        ? "mt-2 max-w-[92px] text-center text-xs font-semibold text-[#1b2c56] sm:max-w-none sm:text-sm"
                        : "mt-2 max-w-[92px] text-center text-xs font-medium text-slate-500 sm:max-w-none sm:text-sm"
                    }
                  >
                    {paso.label}
                  </span>
                </div>

                {index < PASOS_CREAR_EMPRESA.length - 1 && (
                  <div
                    className={
                      isCompleted
                        ? "mt-[22px] h-0.5 flex-1 bg-[#75aa46]"
                        : "mt-[22px] h-0.5 flex-1 bg-slate-200"
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Card className="w-full rounded-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
            <PasoActualIcon className="h-5 w-5" />
            {pasoCrearEmpresa === 0 && "Datos Generales de la Empresa"}
            {pasoCrearEmpresa === 1 && "Interlocutor Titular"}
            {pasoCrearEmpresa === 2 && "Interlocutor Suplente"}
            {pasoCrearEmpresa === 3 && "Convenio Inicial"}
          </CardTitle>
          <CardDescription>
            {pasoCrearEmpresa === 0 &&
              "Ingrese la información administrativa de la empresa"}
            {pasoCrearEmpresa === 1 && "Datos del contacto principal de la empresa"}
            {pasoCrearEmpresa === 2 && "Datos del contacto suplente, si corresponde"}
            {pasoCrearEmpresa === 3 && "Seleccione los productos incluidos en el convenio"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {pasoCrearEmpresa === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre interno de empresa *</Label>
                <Input
                  id="nombre"
                  value={crearEmpresaForm.nombre}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("nombre", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón social</Label>
                <Input
                  id="razonSocial"
                  value={crearEmpresaForm.razonSocial}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("razonSocial", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={crearEmpresaForm.rut}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("rut", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreComercial">Nombre comercial</Label>
                <Input
                  id="nombreComercial"
                  value={crearEmpresaForm.nombreComercial}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("nombreComercial", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correoContacto">Correo de contacto</Label>
                <Input
                  id="correoContacto"
                  type="email"
                  value={crearEmpresaForm.correo_contacto}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("correo_contacto", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={crearEmpresaForm.telefono}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("telefono", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={crearEmpresaForm.estado}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa(
                      "estado",
                      event.target.value as CrearEmpresaForm["estado"]
                    )
                  }
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ACTIVA">Activa</option>
                  <option value="INACTIVA">Inactiva</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={crearEmpresaForm.direccion}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("direccion", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comuna">Comuna</Label>
                <Input
                  id="comuna"
                  value={crearEmpresaForm.comuna}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("comuna", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  value={crearEmpresaForm.region}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("region", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={crearEmpresaForm.sector}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("sector", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreFaena">Nombre faena</Label>
                <Input
                  id="nombreFaena"
                  value={crearEmpresaForm.nombreFaena}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("nombreFaena", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccionFaena">Dirección faena</Label>
                <Input
                  id="direccionFaena"
                  value={crearEmpresaForm.direccionFaena}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("direccionFaena", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representanteLegal">Representante legal</Label>
                <Input
                  id="representanteLegal"
                  value={crearEmpresaForm.representanteLegal}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa("representanteLegal", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rutRepresentanteLegal">
                  RUT representante legal
                </Label>
                <Input
                  id="rutRepresentanteLegal"
                  value={crearEmpresaForm.rutRepresentanteLegal}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarCampoCrearEmpresa(
                      "rutRepresentanteLegal",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          )}

          {pasoCrearEmpresa === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="titularNombres">Nombres y apellidos</Label>
                <Input
                  id="titularNombres"
                  value={contactoTitularForm.nombresApellidos}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarContacto("titular", "nombresApellidos", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularRut">RUT</Label>
                <Input
                  id="titularRut"
                  value={contactoTitularForm.rut}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarContacto("titular", "rut", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularRol">Rol/cargo</Label>
                <Input
                  id="titularRol"
                  value={contactoTitularForm.rolCargo}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarContacto("titular", "rolCargo", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularTelefono">Teléfono</Label>
                <Input
                  id="titularTelefono"
                  value={contactoTitularForm.telefono}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarContacto("titular", "telefono", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titularEmail">Email</Label>
                <Input
                  id="titularEmail"
                  type="email"
                  value={contactoTitularForm.email}
                  disabled={guardandoEmpresa}
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
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarContacto("titular", "fechaNacimiento", event.target.value)
                  }
                />
              </div>
            </div>
          )}

          {pasoCrearEmpresa === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="suplenteNombres">Nombres y apellidos</Label>
                <Input
                  id="suplenteNombres"
                  value={contactoSuplenteForm.nombresApellidos}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarContacto("suplente", "nombresApellidos", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suplenteRut">RUT</Label>
                <Input
                  id="suplenteRut"
                  value={contactoSuplenteForm.rut}
                  disabled={guardandoEmpresa}
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
                  disabled={guardandoEmpresa}
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
                  disabled={guardandoEmpresa}
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
                  disabled={guardandoEmpresa}
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
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarContacto("suplente", "fechaNacimiento", event.target.value)
                  }
                />
              </div>
            </div>
          )}

          {pasoCrearEmpresa === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Seleccione los elementos incluidos en el convenio:
              </p>
              <div className="space-y-2">
                <Label htmlFor="tipoEmpaquetado">Tipo de empaquetado</Label>
                <select
                  id="tipoEmpaquetado"
                  value={crearEmpresaConvenio.tipoEmpaquetado ?? ""}
                  disabled={guardandoEmpresa}
                  onChange={(event) =>
                    actualizarTipoEmpaquetadoCrearEmpresa(
                      event.target.value
                        ? (event.target.value as TipoEmpaquetado)
                        : null
                    )
                  }
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No definido</option>
                  {OPCIONES_TIPO_EMPAQUETADO.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {OPCIONES_CONVENIO.map((opcion) => (
                  <div
                    key={opcion.campo}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <input
                      id={opcion.campo}
                      type="checkbox"
                      checked={crearEmpresaConvenio[opcion.campo]}
                      disabled={guardandoEmpresa}
                      onChange={(event) =>
                        actualizarConvenioCrearEmpresa(opcion.campo, event.target.checked)
                      }
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#75aa46]"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor={opcion.campo}
                        className="cursor-pointer text-sm font-medium"
                      >
                        {opcion.label}
                      </Label>
                      {opcion.ayuda && (
                        <p className="text-xs leading-5 text-muted-foreground">
                          {opcion.ayuda}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {errorCrearEmpresa && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-destructive">
          {errorCrearEmpresa}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {pasoCrearEmpresa > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={guardandoEmpresa}
              onClick={retrocederPasoCrearEmpresa}
              className="border-[#1b2c56] text-[#1b2c56] hover:bg-[#1b2c56] hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {pasoCrearEmpresa === 2 && (
            <Button
              type="button"
              variant="ghost"
              disabled={guardandoEmpresa}
              onClick={saltarSuplente}
              className="text-slate-500 hover:text-slate-700"
            >
              Saltar este paso
            </Button>
          )}

          {pasoCrearEmpresa < 3 ? (
            <Button
              type="button"
              disabled={guardandoEmpresa}
              onClick={avanzarPasoCrearEmpresa}
              className="bg-[#1b2c56] text-white hover:bg-[#152242]"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={guardandoEmpresa}
              onClick={crearEmpresa}
              className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
            >
              <Check className="mr-2 h-4 w-4" />
              {guardandoEmpresa ? "Guardando..." : "Guardar Empresa"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
