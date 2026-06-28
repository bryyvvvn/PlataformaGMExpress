import type {
  ContactoEmpresaForm,
  CrearEmpresaForm,
  EmpresaEditForm,
  PasoCrearEmpresa,
} from "@/lib/empresas/tipos"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function esEmailValido(email: string) {
  return EMAIL_REGEX.test(email.trim())
}

export function normalizarMensajeError(mensaje: string) {
  return mensaje.replace("email valido", "email válido")
}

export function campoCompleto(valor: string) {
  return valor.trim().length > 0
}

export function datosGeneralesCompletos(
  form: CrearEmpresaForm | EmpresaEditForm
) {
  return (
    campoCompleto(form.nombre) &&
    campoCompleto(form.razonSocial) &&
    campoCompleto(form.rut) &&
    campoCompleto(form.nombreComercial) &&
    campoCompleto(form.correo_contacto) &&
    campoCompleto(form.telefono) &&
    campoCompleto(form.direccion) &&
    campoCompleto(form.comuna) &&
    campoCompleto(form.region) &&
    campoCompleto(form.sector) &&
    campoCompleto(form.nombreFaena) &&
    campoCompleto(form.direccionFaena) &&
    (!form.esSucursal || campoCompleto(form.casaMatrizId))
  )
}

export function contactoCompleto(contacto: ContactoEmpresaForm) {
  return (
    campoCompleto(contacto.nombresApellidos) &&
    campoCompleto(contacto.rolCargo) &&
    campoCompleto(contacto.telefono) &&
    campoCompleto(contacto.email) &&
    campoCompleto(contacto.fechaNacimiento)
  )
}

export function contactoVacio(contacto: ContactoEmpresaForm) {
  return Object.values(contacto).every((valor) => !campoCompleto(valor))
}

function validarEmailContacto(contacto: ContactoEmpresaForm, mensaje: string) {
  return esEmailValido(contacto.email) ? null : mensaje
}

export function validarEmailsCrearEmpresa({
  form,
  contactoTitular,
  contactoSuplente,
  contactoCobranza,
  usarTitularComoCobranza,
}: {
  form: CrearEmpresaForm
  contactoTitular: ContactoEmpresaForm
  contactoSuplente: ContactoEmpresaForm
  contactoCobranza: ContactoEmpresaForm
  usarTitularComoCobranza: boolean
}) {
  if (!esEmailValido(form.correo_contacto)) {
    return {
      paso: 0 as PasoCrearEmpresa,
      mensaje: "El correo de contacto de la empresa debe tener un formato válido.",
    }
  }

  const errorTitular = validarEmailContacto(
    contactoTitular,
    "El correo del interlocutor titular debe tener un formato válido."
  )
  if (errorTitular) {
    return { paso: 1 as PasoCrearEmpresa, mensaje: errorTitular }
  }

  if (!contactoVacio(contactoSuplente)) {
    const errorSuplente = validarEmailContacto(
      contactoSuplente,
      "El correo del interlocutor suplente debe tener un formato válido."
    )
    if (errorSuplente) {
      return { paso: 2 as PasoCrearEmpresa, mensaje: errorSuplente }
    }
  }

  if (!usarTitularComoCobranza) {
    const errorCobranza = validarEmailContacto(
      contactoCobranza,
      "El correo de cobranza debe tener un formato válido."
    )
    if (errorCobranza) {
      return { paso: 3 as PasoCrearEmpresa, mensaje: errorCobranza }
    }
  }

  return null
}
