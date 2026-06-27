import type {
  CampoBooleanoConvenio,
  CampoProductoConvenio,
  ContactoEmpresaForm,
  ConvenioForm,
  CrearEmpresaForm,
  EmpresaEditForm,
  TipoContactoEmpresa,
  TipoEmpaquetado,
} from "@/lib/empresas/tipos"

export const HORA_LIMITE_DEFAULT = "10:00"

export const CONVENIO_DEFAULTS: ConvenioForm = {
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

export const CREAR_EMPRESA_DEFAULTS: CrearEmpresaForm = {
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
  fechaNacimientoRepresentanteLegal: "",
  estado: "ACTIVA",
  esSucursal: false,
  casaMatrizId: "",
}

export const EMPRESA_EDIT_DEFAULTS: EmpresaEditForm = {
  ...CREAR_EMPRESA_DEFAULTS,
  horaDespacho: "",
}

export const CONTACTO_DEFAULTS: ContactoEmpresaForm = {
  nombresApellidos: "",
  rut: "",
  rolCargo: "",
  telefono: "",
  email: "",
  fechaNacimiento: "",
}

export const OPCIONES_CONVENIO: Array<{
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

export const PRODUCTOS_CONVENIO: Array<{
  campo: CampoProductoConvenio
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

export const OPCIONES_TIPO_EMPAQUETADO: Array<{
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

export const LABELS_TIPO_EMPAQUETADO: Record<TipoEmpaquetado, string> = {
  BOWL_CRAFT: "Bowl craft",
  C10_ALUMINIO: "C10 aluminio",
  SERVICIO_TRADICIONAL_PLATO: "Servicio tradicional en plato",
}

export const LABELS_TIPO_CONTACTO: Record<TipoContactoEmpresa, string> = {
  TITULAR: "Interlocutor titular",
  SUPLENTE: "Interlocutor suplente",
  COBRANZA: "Datos de cobranza",
}
