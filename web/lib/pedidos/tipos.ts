export type EmpresaOption = {
  id: number
  nombre: string
}

export type EmpresaAdminResponse = EmpresaOption & {
  estado?: string
}

export type PedidoManual = {
  id: number
  empresaId: number
  empresa: EmpresaOption
  fecha: string
  cantidad: number
  observacion: string | null
  creadoPor: string | null
  creadoEn: string
}

export type PedidoManualForm = {
  empresaId: string
  fecha: string
  cantidad: string
  observacion: string
}

export type MensajePedidoManual = {
  tipo: "exito" | "error"
  texto: string
}
