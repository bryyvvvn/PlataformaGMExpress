"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Users } from "lucide-react"

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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Usuarios de Aplicación
          </h1>
          <p className="text-muted-foreground">
            {resumen.total} usuarios registrados - {resumen.representantes} representantes de empresa
          </p>
        </div>
        <Button
          type="button"
          disabled
          title="Las altas de usuarios se gestionan mediante Clerk"
          className="w-full bg-[#75aa46] text-white hover:bg-[#5d8a38] sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir Usuario
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{resumen.total}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#75aa46]">
              {resumen.trabajadores}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Representantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1b2c56]">
              {resumen.representantes}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sin Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {resumen.sinEmpresa}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-[#1b2c56]" />
                Listado de Usuarios
              </CardTitle>
              <CardDescription>
                Trabajadores y representantes registrados en la plataforma
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, RUT o empresa..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Cargando usuarios...
            </div>
          ) : error ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button type="button" variant="outline" onClick={cargarUsuarios}>
                Reintentar
              </Button>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              No hay usuarios de aplicación registrados.
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No se encontraron usuarios con ese criterio de búsqueda.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{usuario.nombre.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {usuario.correo ?? usuario.nombreUsuario ?? "Sin correo registrado"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {usuario.rut ?? "Sin RUT"}
                      </TableCell>
                      <TableCell>
                        {usuario.empresa ? (
                          <Badge
                            variant="outline"
                            className="border-[#1b2c56]/20 text-[#1b2c56]"
                          >
                            {usuario.empresa.nombre}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Sin empresa
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            usuario.perfil === "REPRESENTANTE"
                              ? "bg-[#1b2c56] text-white"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {etiquetaPerfil(usuario.perfil)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={usuario.estado === "ASOCIADO" ? "default" : "secondary"}
                          className={
                            usuario.estado === "ASOCIADO"
                              ? "bg-[#75aa46] text-white"
                              : "bg-amber-100 text-amber-700"
                          }
                        >
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
