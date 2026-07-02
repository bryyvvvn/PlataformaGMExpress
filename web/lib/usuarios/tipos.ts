export type PerfilUsuarioApp = "TRABAJADOR" | "REPRESENTANTE"
export type EstadoVinculacionUsuario = "ASOCIADO" | "SIN_EMPRESA"

export type UsuarioEmpresaResumen = {
  id: number
  nombre: string
}

export type UsuarioApp = {
  id: string
  nombre: string
  nombreUsuario: string | null
  rut: string | null
  correo: string | null
  telefono?: string | null
  empresa: UsuarioEmpresaResumen | null
  perfil: PerfilUsuarioApp
  estado: EstadoVinculacionUsuario
}

export type ResumenUsuariosApp = {
  total: number
  trabajadores: number
  representantes: number
  sinEmpresa: number
}

export type EmpresaAsignable = {
  id: number
  nombre: string
  estado?: "ACTIVA" | "INACTIVA"
}

export type EmpresasAsignablesResponse = {
  empresas: EmpresaAsignable[]
}
