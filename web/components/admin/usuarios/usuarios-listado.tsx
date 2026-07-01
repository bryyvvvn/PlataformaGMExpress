"use client"

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Pencil,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { etiquetaEstado, etiquetaPerfil } from "@/lib/usuarios/formatos"
import { formatearTelefonoChileno } from "@/lib/usuarios/telefono"
import type {
  PerfilUsuarioApp,
  ResumenUsuariosApp,
  UsuarioApp,
} from "@/lib/usuarios/tipos"

type UsuariosListadoProps = {
  usuarios: UsuarioApp[]
  usuariosPorVista: UsuarioApp[]
  usuariosFiltrados: UsuarioApp[]
  resumen: ResumenUsuariosApp
  vistaActiva: PerfilUsuarioApp
  searchTerm: string
  loading: boolean
  error: string | null
  mensajeExito: string | null
  onCambiarVista: (vista: PerfilUsuarioApp) => void
  onSearchTermChange: (value: string) => void
  onEditarUsuario: (usuario: UsuarioApp) => void
  onReintentar: () => void
}

export function UsuariosListado({
  usuarios,
  usuariosPorVista,
  usuariosFiltrados,
  resumen,
  vistaActiva,
  searchTerm,
  loading,
  error,
  mensajeExito,
  onCambiarVista,
  onSearchTermChange,
  onEditarUsuario,
  onReintentar,
}: UsuariosListadoProps) {
  return (
    <Card className="overflow-hidden rounded-md border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded bg-slate-100 text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Filtro de Directorio
              </h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">
                Busqueda por nombre, RUT, correo, telefono o empresa
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
            <UsuariosTabs
              resumen={resumen}
              vistaActiva={vistaActiva}
              onCambiarVista={onCambiarVista}
            />
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Escribe para buscar..."
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                className="h-10 border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {mensajeExito && (
          <div className="border-b border-[#75aa46]/20 bg-[#75aa46]/10 px-5 py-3 text-sm font-semibold text-[#5d8a38]">
            {mensajeExito}
          </div>
        )}

        <UsuariosTableState
          usuarios={usuarios}
          usuariosPorVista={usuariosPorVista}
          usuariosFiltrados={usuariosFiltrados}
          vistaActiva={vistaActiva}
          searchTerm={searchTerm}
          loading={loading}
          error={error}
          onEditarUsuario={onEditarUsuario}
          onReintentar={onReintentar}
        />
      </CardContent>
    </Card>
  )
}

function UsuariosTabs({
  resumen,
  vistaActiva,
  onCambiarVista,
}: {
  resumen: ResumenUsuariosApp
  vistaActiva: PerfilUsuarioApp
  onCambiarVista: (vista: PerfilUsuarioApp) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => onCambiarVista("TRABAJADOR")}
        className={
          vistaActiva === "TRABAJADOR"
            ? "rounded bg-[#1B2C56] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
            : "rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 transition hover:text-[#1B2C56]"
        }
      >
        Trabajadores ({resumen.trabajadores})
      </button>
      <button
        type="button"
        onClick={() => onCambiarVista("REPRESENTANTE")}
        className={
          vistaActiva === "REPRESENTANTE"
            ? "rounded bg-[#75aa46] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
            : "rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 transition hover:text-[#1B2C56]"
        }
      >
        Representantes ({resumen.representantes})
      </button>
    </div>
  )
}

function UsuariosTableState({
  usuarios,
  usuariosPorVista,
  usuariosFiltrados,
  vistaActiva,
  searchTerm,
  loading,
  error,
  onEditarUsuario,
  onReintentar,
}: Omit<
  UsuariosListadoProps,
  "resumen" | "mensajeExito" | "onCambiarVista" | "onSearchTermChange"
>) {
  if (loading) {
    return (
      <div className="px-5 py-8 text-center text-sm font-medium text-slate-500 animate-pulse">
        Cargando directorio de usuarios...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-5 py-8">
        <p className="rounded-md border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onReintentar}
          className="h-8 text-xs font-semibold"
        >
          Reintentar conexion
        </Button>
      </div>
    )
  }

  if (usuarios.length === 0) {
    return <EstadoVacio>El registro de usuarios esta vacio.</EstadoVacio>
  }

  if (usuariosPorVista.length === 0) {
    return (
      <EstadoVacio>
        No hay {vistaActiva === "TRABAJADOR" ? "trabajadores" : "representantes"} registrados.
      </EstadoVacio>
    )
  }

  if (usuariosFiltrados.length === 0) {
    return <EstadoVacio>No se encontraron coincidencias para {searchTerm}.</EstadoVacio>
  }

  return (
    <UsuariosTable
      usuarios={usuariosFiltrados}
      onEditarUsuario={onEditarUsuario}
    />
  )
}

function EstadoVacio({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50/50 px-5 py-8 text-center text-sm font-medium text-slate-500">
      {children}
    </div>
  )
}

function UsuariosTable({
  usuarios,
  onEditarUsuario,
}: {
  usuarios: UsuarioApp[]
  onEditarUsuario: (usuario: UsuarioApp) => void
}) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1120px]">
        <TableHeader>
          <TableRow className="border-b border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Identidad</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Documento</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Telefono</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Vinculacion</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Rol de Sistema</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Estado</TableHead>
            <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow
              key={usuario.id}
              className="transition-colors hover:bg-slate-50/50"
            >
              <TableCell className="py-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {usuario.nombre.toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {usuario.correo ?? usuario.nombreUsuario ?? "Sin correo"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
                  {usuario.rut ?? "S/RUT"}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <span className="font-mono text-xs font-semibold text-slate-600">
                  {formatearTelefonoChileno(usuario.telefono)}
                </span>
              </TableCell>
              <TableCell className="py-3">
                {usuario.empresa ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-[#1B2C56]">
                      {usuario.empresa.nombre}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium italic text-slate-400">
                    Desvinculado
                  </span>
                )}
              </TableCell>
              <TableCell className="py-3">
                <Badge
                  variant="outline"
                  className={
                    usuario.perfil === "REPRESENTANTE"
                      ? "border-[#1B2C56]/20 bg-[#1B2C56]/10 text-[10px] font-bold uppercase tracking-wide text-[#1B2C56]"
                      : "border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                  }
                >
                  {etiquetaPerfil(usuario.perfil)}
                </Badge>
              </TableCell>
              <TableCell className="py-3">
                <Badge
                  variant="outline"
                  className={
                    usuario.estado === "ASOCIADO"
                      ? "flex w-fit items-center gap-1 border-[#75AA46]/20 bg-[#75AA46]/10 text-[10px] font-bold uppercase tracking-wide text-[#5d8a38]"
                      : "flex w-fit items-center gap-1 border-amber-200 bg-amber-50 text-[10px] font-bold uppercase tracking-wide text-amber-700"
                  }
                >
                  {usuario.estado === "ASOCIADO" ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <AlertCircle className="size-3" />
                  )}
                  {etiquetaEstado(usuario.estado)}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditarUsuario(usuario)}
                  className="h-7 gap-1.5 border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:border-[#1B2C56]/30 hover:text-[#1B2C56]"
                >
                  <Pencil className="size-3" />
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
