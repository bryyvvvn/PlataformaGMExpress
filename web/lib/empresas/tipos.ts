export type TipoEmpaquetado =
  | "BOWL_CRAFT"
  | "C10_ALUMINIO"
  | "SERVICIO_TRADICIONAL_PLATO"

export type EstadoEmpresaCliente = "ACTIVA" | "INACTIVA"
export type TipoContactoEmpresa = "TITULAR" | "SUPLENTE" | "COBRANZA"
export type ContactoFormularioTipo = "titular" | "suplente" | "cobranza"

export type ConvenioForm = {
  permitePlato: boolean
  permiteEntrada: boolean
  permitePostre: boolean
  permitePan: boolean
  permiteJugo: boolean
  permiteBebida: boolean
  permiteAguaSaborizada: boolean
  trabajaFinDeSemana: boolean
  permiteCena: boolean
  tipoEmpaquetado: TipoEmpaquetado | null
}

export type ConvenioEmpresa = ConvenioForm & {
  id: number
}

export type CampoBooleanoConvenio = Exclude<
  keyof ConvenioForm,
  "tipoEmpaquetado"
>

export type CampoProductoConvenio = Exclude<
  keyof ConvenioEmpresa,
  "id" | "tipoEmpaquetado" | "trabajaFinDeSemana" | "permiteCena"
>

export type EmpresaFormularioBase = {
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
  fechaNacimientoRepresentanteLegal: string
  estado: EstadoEmpresaCliente
}

export type CrearEmpresaForm = EmpresaFormularioBase

export type EmpresaEditForm = EmpresaFormularioBase & {
  horaDespacho: string
}

export type ContactoEmpresaForm = {
  nombresApellidos: string
  rut: string
  rolCargo: string
  telefono: string
  email: string
  fechaNacimiento: string
}

export type PasoCrearEmpresa = 0 | 1 | 2 | 3 | 4

export type ContactoEmpresa = {
  id: number
  tipo: TipoContactoEmpresa
  nombresApellidos: string | null
  rut: string | null
  rolCargo: string | null
  telefono: string | null
  email: string | null
  fechaNacimiento: string | null
  activo: boolean
}

export type EmpresaDetalleBase = {
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
  fechaNacimientoRepresentanteLegal: string | null
  estado: EstadoEmpresaCliente
  horaDespacho: string | null
}

export type EmpresaDetalle = EmpresaDetalleBase & {
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

export type EmpresaEdicionDetalle = EmpresaDetalleBase & {
  contactos: ContactoEmpresa[]
}

export type EmpresaDetalleResponse = {
  empresa: EmpresaDetalle
}

export type EmpresaEdicionResponse = {
  empresa: EmpresaEdicionDetalle
}

export type ConfiguracionResponse = {
  configuracion: {
    horaLimite: string
  }
}

export type EmpresaCliente = {
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
  estado: EstadoEmpresaCliente
  trabajadores: number
  representantes: number
  pedidos: number
  convenio: ConvenioEmpresa | null
}

export type EmpresasResponse = {
  empresas: EmpresaCliente[]
}
