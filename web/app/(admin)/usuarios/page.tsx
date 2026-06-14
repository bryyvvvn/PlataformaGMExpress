"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Users, Building2, UserCheck, UserX, Briefcase, CheckCircle2, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type EstadoVinculacionUsuario,
  type PerfilUsuarioApp,
  useUsuariosApp,
} from "@/hooks/useUsuariosApp"

function etiquetaPerfil(perfil: PerfilUsuarioApp) {
  return perfil === "REPRESENTANTE" ? "Representante" : "Trabajador"
}

function etiquetaEstado(estado: EstadoVinculacionUsuario) {
  return estado === "ASOCIADO" ? "Asociado" : "Sin empresa"
}

export default function UsuariosAppPage() {
  const { usuarios, resumen, loading, error, cargarUsuarios } = useUsuariosApp()
  const [searchTerm, setSearchTerm] = useState("")

  const usuariosFiltrados = useMemo(() => {
    const criterio = searchTerm.trim().toLocaleLowerCase("es")

    if (!criterio) return usuarios

    return usuarios.filter((usuario) =>
      [
        usuario.nombre,
        usuario.nombreUsuario,
        usuario.rut,
        usuario.correo,
        usuario.empresa?.nombre,
      ].some((valor) => valor?.toLocaleLowerCase("es").includes(criterio))
    )
  }, [searchTerm, usuarios])

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header Corporativo */}
      <header className="border-b border-slate-200 pb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#1B2C56]"></span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Administración de Sistema</p>
          </div>
          <h1 className="text-2xl font-bold text-[#1B2C56] tracking-tight">Directorio de Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de accesos, roles y vinculación empresarial.
          </p>
        </div>
      </header>

      {/* Tarjetas KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="h-1 w-full bg-[#1B2C56]"></div>
          <CardContent className="flex-1 p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Registrados</p>
              <p className="text-3xl font-bold text-[#1B2C56]">{resumen.total}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#1B2C56]/10">
              <Users className="size-5 text-[#1B2C56]" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="h-1 w-full bg-[#75AA46]"></div>
          <CardContent className="flex-1 p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Trabajadores</p>
              <p className="text-3xl font-bold text-[#75AA46]">{resumen.trabajadores}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#75AA46]/10">
              <Briefcase className="size-5 text-[#75AA46]" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="h-1 w-full bg-[#1B2C56]"></div>
          <CardContent className="flex-1 p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Representantes</p>
              <p className="text-3xl font-bold text-[#1B2C56]">{resumen.representantes}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#1B2C56]/10">
              <UserCheck className="size-5 text-[#1B2C56]" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="h-1 w-full bg-amber-500"></div>
          <CardContent className="flex-1 p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Sin Asignación</p>
              <p className="text-3xl font-bold text-amber-600">{resumen.sinEmpresa}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
              <UserX className="size-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Directorio */}
      <Card className="overflow-hidden rounded-md border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded bg-slate-100 text-slate-500">
                 <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Filtro de Directorio</h2>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">
                  Búsqueda por nombre, RUT o empresa
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Escribe para buscar..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
            </div>
          </div>
        </div>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm font-medium text-slate-500 animate-pulse">
              Cargando directorio de usuarios...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center px-5 py-8 gap-3">
              <p className="text-sm font-medium text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-100">{error}</p>
              <Button type="button" variant="outline" onClick={cargarUsuarios} className="h-8 text-xs font-semibold">
                Reintentar conexión
              </Button>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm font-medium text-slate-500 bg-slate-50/50">
              El registro de usuarios está vacío.
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm font-medium text-slate-500 bg-slate-50/50">
              No se encontraron coincidencias para "{searchTerm}".
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Identidad</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Documento</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Vinculación</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Rol de Sistema</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-[#1B2C56]">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{usuario.nombre.toUpperCase()}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {usuario.correo ?? usuario.nombreUsuario ?? "Sin correo"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {usuario.rut ?? "S/RUT"}
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
                          <span className="text-xs font-medium text-slate-400 italic">
                            Desvinculado
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            usuario.perfil === "REPRESENTANTE"
                              ? "bg-[#1B2C56]/10 text-[#1B2C56] border-[#1B2C56]/20 font-bold tracking-wide text-[10px] uppercase"
                              : "bg-slate-100 text-slate-600 border-slate-200 font-bold tracking-wide text-[10px] uppercase"
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
                              ? "bg-[#75AA46]/10 text-[#5d8a38] border-[#75AA46]/20 font-bold tracking-wide text-[10px] uppercase flex w-fit items-center gap-1"
                              : "bg-amber-50 text-amber-700 border-amber-200 font-bold tracking-wide text-[10px] uppercase flex w-fit items-center gap-1"
                          }
                        >
                          {usuario.estado === "ASOCIADO" ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          {etiquetaEstado(usuario.estado)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}