import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TimePickerBlock } from "@/components/ui/time-picker-block"
import {
  OPCIONES_CONVENIO,
  OPCIONES_TIPO_EMPAQUETADO,
} from "@/lib/empresas/constantes"
import { calcularCierrePorDespacho } from "@/lib/empresas/normalizadores"
import type {
  CampoBooleanoConvenio,
  ContactoEmpresaForm,
  ContactoFormularioTipo,
  ConvenioForm,
  EmpresaFormularioBase,
  EmpresaRelacionResumen,
  EstadoEmpresaCliente,
  TipoEmpaquetado,
} from "@/lib/empresas/tipos"

type EmpresaFormChange = (
  campo: keyof EmpresaFormularioBase,
  valor: string | boolean | EstadoEmpresaCliente
) => void

type EmpresaFieldsProps = {
  form: EmpresaFormularioBase
  disabled: boolean
  onChange: EmpresaFormChange
  casasMatrices?: EmpresaRelacionResumen[]
}

export function EmpresaDatosGeneralesFields({
  form,
  disabled,
  onChange,
  casasMatrices = [],
}: EmpresaFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre interno de empresa *</Label>
        <Input
          id="nombre"
          value={form.nombre}
          disabled={disabled}
          onChange={(event) => onChange("nombre", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="razonSocial">Razón social *</Label>
        <Input
          id="razonSocial"
          value={form.razonSocial}
          disabled={disabled}
          onChange={(event) => onChange("razonSocial", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rut">RUT *</Label>
        <Input
          id="rut"
          value={form.rut}
          disabled={disabled}
          onChange={(event) => onChange("rut", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombreComercial">Nombre comercial *</Label>
        <Input
          id="nombreComercial"
          value={form.nombreComercial}
          disabled={disabled}
          onChange={(event) => onChange("nombreComercial", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="correoContacto">Correo de contacto *</Label>
        <Input
          id="correoContacto"
          type="email"
          value={form.correo_contacto}
          disabled={disabled}
          onChange={(event) => onChange("correo_contacto", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono *</Label>
        <Input
          id="telefono"
          value={form.telefono}
          disabled={disabled}
          onChange={(event) => onChange("telefono", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <select
          id="estado"
          value={form.estado}
          disabled={disabled}
          onChange={(event) =>
            onChange("estado", event.target.value as EstadoEmpresaCliente)
          }
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="ACTIVA">Activa</option>
          <option value="INACTIVA">Inactiva</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaInicioContrato">Fecha de inicio de contrato</Label>
        <Input
          id="fechaInicioContrato"
          type="date"
          value={form.fechaInicioContrato}
          disabled={disabled}
          onChange={(event) => onChange("fechaInicioContrato", event.target.value)}
        />
      </div>

      <div className="space-y-3 rounded-md border border-slate-200 p-3 md:col-span-2">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.esSucursal}
            disabled={disabled}
            onChange={(event) => onChange("esSucursal", event.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#75aa46]"
          />
          <span className="space-y-1">
            <span className="block font-medium text-[#1B2C56]">
              Esta empresa es una sucursal?
            </span>
            <span className="block text-xs leading-5 text-slate-500">
              Las sucursales comparten RUT con su casa matriz, pero se gestionan
              como empresas independientes para pedidos, convenios y facturacion.
            </span>
            <span className="block text-xs leading-5 text-slate-500">
              Usa nombres como &quot;Starco - La Serena&quot; para diferenciar sucursales.
            </span>
          </span>
        </label>

        {form.esSucursal && (
          <div className="space-y-2">
            <Label htmlFor="casaMatrizId">Casa matriz *</Label>
            <select
              id="casaMatrizId"
              value={form.casaMatrizId}
              disabled={disabled}
              onChange={(event) => onChange("casaMatrizId", event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecciona una casa matriz</option>
              {casasMatrices.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
            {casasMatrices.length === 0 && (
              <p className="text-xs leading-5 text-slate-500">
                No hay empresas principales disponibles para seleccionar.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export function EmpresaUbicacionFields({
  form,
  disabled,
  onChange,
}: EmpresaFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección *</Label>
        <Input
          id="direccion"
          value={form.direccion}
          disabled={disabled}
          onChange={(event) => onChange("direccion", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comuna">Comuna *</Label>
        <Input
          id="comuna"
          value={form.comuna}
          disabled={disabled}
          onChange={(event) => onChange("comuna", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Región *</Label>
        <Input
          id="region"
          value={form.region}
          disabled={disabled}
          onChange={(event) => onChange("region", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sector">Sector *</Label>
        <Input
          id="sector"
          value={form.sector}
          disabled={disabled}
          onChange={(event) => onChange("sector", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombreFaena">Nombre faena *</Label>
        <Input
          id="nombreFaena"
          value={form.nombreFaena}
          disabled={disabled}
          onChange={(event) => onChange("nombreFaena", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccionFaena">Dirección faena *</Label>
        <Input
          id="direccionFaena"
          value={form.direccionFaena}
          disabled={disabled}
          onChange={(event) => onChange("direccionFaena", event.target.value)}
        />
      </div>
    </>
  )
}

export function EmpresaRepresentanteFields({
  form,
  disabled,
  onChange,
}: EmpresaFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="representanteLegal">Representante legal</Label>
        <Input
          id="representanteLegal"
          value={form.representanteLegal}
          disabled={disabled}
          onChange={(event) => onChange("representanteLegal", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rutRepresentanteLegal">RUT representante legal</Label>
        <Input
          id="rutRepresentanteLegal"
          value={form.rutRepresentanteLegal}
          disabled={disabled}
          onChange={(event) =>
            onChange("rutRepresentanteLegal", event.target.value)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaNacimientoRepresentanteLegal">
          Fecha nacimiento representante legal
        </Label>
        <Input
          id="fechaNacimientoRepresentanteLegal"
          type="date"
          value={form.fechaNacimientoRepresentanteLegal}
          disabled={disabled}
          onChange={(event) =>
            onChange("fechaNacimientoRepresentanteLegal", event.target.value)
          }
        />
      </div>
    </>
  )
}

export function EmpresaHoraDespachoField({
  horaDespacho,
  horaDespachoActivada,
  disabled,
  onToggle,
  onChange,
}: {
  horaDespacho: string
  horaDespachoActivada: boolean
  disabled: boolean
  onToggle: (activada: boolean) => void
  onChange: (valor: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Hora de Despacho</Label>

      <label className="flex items-center gap-2 text-sm font-normal text-slate-600">
        <input
          type="checkbox"
          checked={horaDespachoActivada}
          disabled={disabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#75aa46] focus:ring-[#75aa46]"
        />
        Configurar hora específica
      </label>

      {horaDespachoActivada && (
        <TimePickerBlock
          value={horaDespacho || "08:00"}
          onChange={onChange}
          min="06:00"
          max="23:00"
          disabled={disabled}
        />
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        {horaDespachoActivada && horaDespacho
          ? `Cierre de pedidos: ${calcularCierrePorDespacho(horaDespacho)} (3 horas antes del despacho)`
          : "Sin hora específica — aplicará la hora global del sistema"}
      </p>
    </div>
  )
}

export function EmpresaContactoFields({
  tipo,
  form,
  disabled,
  required,
  layout,
  onChange,
}: {
  tipo: Exclude<ContactoFormularioTipo, "cobranza">
  form: ContactoEmpresaForm
  disabled: boolean
  required: boolean
  layout: "step" | "card"
  onChange: (
    tipo: ContactoFormularioTipo,
    campo: keyof ContactoEmpresaForm,
    valor: string
  ) => void
}) {
  const prefix = tipo
  const labelSuffix = required ? " *" : ""
  const nombreId = `${prefix}Nombres`
  const rutId = `${prefix}Rut`
  const rolId = `${prefix}Rol`
  const telefonoId = `${prefix}Telefono`
  const emailId = `${prefix}Email`
  const fechaId = `${prefix}Fecha`

  const nombreField = (
    <div className={layout === "step" ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <Label htmlFor={nombreId}>Nombres y apellidos{labelSuffix}</Label>
      <Input
        id={nombreId}
        value={form.nombresApellidos}
        disabled={disabled}
        onChange={(event) =>
          onChange(tipo, "nombresApellidos", event.target.value)
        }
      />
    </div>
  )

  const remainingFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor={rutId}>RUT</Label>
        <Input
          id={rutId}
          value={form.rut}
          disabled={disabled}
          onChange={(event) => onChange(tipo, "rut", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={rolId}>Rol/cargo{labelSuffix}</Label>
        <Input
          id={rolId}
          value={form.rolCargo}
          disabled={disabled}
          onChange={(event) => onChange(tipo, "rolCargo", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={telefonoId}>Teléfono{labelSuffix}</Label>
        <Input
          id={telefonoId}
          value={form.telefono}
          disabled={disabled}
          onChange={(event) => onChange(tipo, "telefono", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={emailId}>Email{labelSuffix}</Label>
        <Input
          id={emailId}
          type="email"
          value={form.email}
          disabled={disabled}
          onChange={(event) => onChange(tipo, "email", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={fechaId}>Fecha nacimiento{labelSuffix}</Label>
        <Input
          id={fechaId}
          type="date"
          value={form.fechaNacimiento}
          disabled={disabled}
          onChange={(event) =>
            onChange(tipo, "fechaNacimiento", event.target.value)
          }
        />
      </div>
    </>
  )

  if (layout === "card") {
    return (
      <div className="grid gap-4">
        {nombreField}
        <div className="grid gap-4 md:grid-cols-2">{remainingFields}</div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {nombreField}
      {remainingFields}
    </div>
  )
}

export function EmpresaCobranzaFields({
  form,
  disabled,
  layout,
  onChange,
}: {
  form: ContactoEmpresaForm
  disabled: boolean
  layout: "step" | "card"
  onChange: (
    tipo: ContactoFormularioTipo,
    campo: keyof ContactoEmpresaForm,
    valor: string
  ) => void
}) {
  const nombreField = (
    <div className={layout === "step" ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <Label htmlFor="cobranzaNombres">Dato cobranza / Nombre *</Label>
      <Input
        id="cobranzaNombres"
        value={form.nombresApellidos}
        disabled={disabled}
        onChange={(event) =>
          onChange("cobranza", "nombresApellidos", event.target.value)
        }
      />
    </div>
  )

  const remainingFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="cobranzaRol">Rol/cargo *</Label>
        <Input
          id="cobranzaRol"
          value={form.rolCargo}
          disabled={disabled}
          onChange={(event) => onChange("cobranza", "rolCargo", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cobranzaTelefono">Celular *</Label>
        <Input
          id="cobranzaTelefono"
          value={form.telefono}
          disabled={disabled}
          onChange={(event) => onChange("cobranza", "telefono", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cobranzaEmail">Correo *</Label>
        <Input
          id="cobranzaEmail"
          type="email"
          value={form.email}
          disabled={disabled}
          onChange={(event) => onChange("cobranza", "email", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cobranzaFecha">Fecha nacimiento *</Label>
        <Input
          id="cobranzaFecha"
          type="date"
          value={form.fechaNacimiento}
          disabled={disabled}
          onChange={(event) =>
            onChange("cobranza", "fechaNacimiento", event.target.value)
          }
        />
      </div>
    </>
  )

  if (layout === "card") {
    return (
      <div className="grid gap-4">
        {nombreField}
        <div className="grid gap-4 md:grid-cols-2">{remainingFields}</div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {nombreField}
      {remainingFields}
    </div>
  )
}

export function EmpresaConvenioInicialFields({
  convenio,
  disabled,
  onBooleanChange,
  onTipoEmpaquetadoChange,
}: {
  convenio: ConvenioForm
  disabled: boolean
  onBooleanChange: (campo: CampoBooleanoConvenio, checked: boolean) => void
  onTipoEmpaquetadoChange: (tipoEmpaquetado: TipoEmpaquetado | null) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Seleccione los elementos incluidos en el convenio:
      </p>
      <div className="space-y-2">
        <Label htmlFor="tipoEmpaquetado">Tipo de empaquetado</Label>
        <select
          id="tipoEmpaquetado"
          value={convenio.tipoEmpaquetado ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onTipoEmpaquetadoChange(
              event.target.value ? (event.target.value as TipoEmpaquetado) : null
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
              checked={convenio[opcion.campo]}
              disabled={disabled}
              onChange={(event) =>
                onBooleanChange(opcion.campo, event.target.checked)
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
  )
}
