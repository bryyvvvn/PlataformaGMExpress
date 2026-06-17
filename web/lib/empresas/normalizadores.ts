import { getHoraLimiteEfectiva } from "@/lib/horario-pedidos"
import { CONTACTO_DEFAULTS } from "@/lib/empresas/constantes"
import type {
  ContactoEmpresa,
  ContactoEmpresaForm,
  ConvenioForm,
  CrearEmpresaForm,
  EmpresaEditForm,
} from "@/lib/empresas/tipos"

export function textoFormulario(value: string | null | undefined) {
  return value ?? ""
}

export function fechaParaInput(value: string | null | undefined) {
  if (!value) return ""

  const fecha = new Date(value)

  if (Number.isNaN(fecha.getTime())) {
    return ""
  }

  return fecha.toISOString().slice(0, 10)
}

export function contactoAFormulario(
  contacto: ContactoEmpresa | undefined
): ContactoEmpresaForm {
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

export function crearPayloadCrearEmpresa({
  form,
  convenio,
  contactoTitular,
  contactoSuplente,
  contactoCobranza,
  usarTitularComoCobranza,
}: {
  form: CrearEmpresaForm
  convenio: ConvenioForm
  contactoTitular: ContactoEmpresaForm
  contactoSuplente: ContactoEmpresaForm
  contactoCobranza: ContactoEmpresaForm
  usarTitularComoCobranza: boolean
}) {
  return {
    ...form,
    fechaNacimientoRepresentanteLegal:
      form.fechaNacimientoRepresentanteLegal || null,
    convenio,
    contactoTitular: {
      ...contactoTitular,
      fechaNacimiento: contactoTitular.fechaNacimiento || null,
    },
    contactoSuplente: {
      ...contactoSuplente,
      fechaNacimiento: contactoSuplente.fechaNacimiento || null,
    },
    usarTitularComoCobranza,
    contactoCobranza: usarTitularComoCobranza
      ? null
      : {
          ...contactoCobranza,
          rut: "",
          fechaNacimiento: contactoCobranza.fechaNacimiento || null,
        },
  }
}

export function crearPayloadEditarEmpresa({
  form,
  contactoTitular,
  contactoSuplente,
  contactoCobranza,
}: {
  form: EmpresaEditForm
  contactoTitular: ContactoEmpresaForm
  contactoSuplente: ContactoEmpresaForm
  contactoCobranza: ContactoEmpresaForm
}) {
  return {
    ...form,
    horaDespacho: form.horaDespacho || null,
    fechaNacimientoRepresentanteLegal:
      form.fechaNacimientoRepresentanteLegal || null,
    contactoTitular: {
      ...contactoTitular,
      fechaNacimiento: contactoTitular.fechaNacimiento || null,
    },
    contactoSuplente: {
      ...contactoSuplente,
      fechaNacimiento: contactoSuplente.fechaNacimiento || null,
    },
    contactoCobranza: {
      ...contactoCobranza,
      rut: "",
      fechaNacimiento: contactoCobranza.fechaNacimiento || null,
    },
  }
}

export function calcularCierrePorDespacho(horaDespacho: string): string {
  return getHoraLimiteEfectiva(horaDespacho, horaDespacho).horaLimite
}
