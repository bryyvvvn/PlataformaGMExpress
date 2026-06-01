"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, MoreHorizontal, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Importamos el hook que acabamos de crear
import { useEmpresas, OPCIONES_CONVENIO } from "@/hooks/useEmpresas"

export default function EmpresasView() {
  const router = useRouter()
  
  // Desestructuramos todo desde nuestro hook
  const {
    empresas,
    loading,
    error,
    cargarEmpresas,
    empresaConvenioSeleccionada,
    convenioForm,
    guardandoConvenio,
    errorConvenio,
    abrirModalConvenio,
    cerrarModalConvenio,
    actualizarCampoConvenio,
    guardarConvenio,
    empresaCambiandoEstadoId,
    errorEstadoEmpresa,
    cambiarEstadoEmpresa,
  } = useEmpresas()

  // Lógica derivada (se recalcula automáticamente)
  const totalTrabajadores = empresas.reduce((sum, e) => sum + e.trabajadores, 0)
  const empresasActivas = empresas.filter((e) => e.estado === "ACTIVA").length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      {/* --- CABECERA --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Empresas Clientes
          </h1>
          <p className="text-muted-foreground">
            {empresasActivas} empresas activas - {totalTrabajadores} trabajadores totales
          </p>
        </div>
        <Link
          href="/empresas/nueva"
          className={buttonVariants({
            className: "w-full bg-[#75aa46] text-white hover:bg-[#5d8a38] sm:w-auto",
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Empresa
        </Link>
      </div>

      {/* --- TARJETAS DE ESTADÍSTICAS --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{empresas.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empresas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#75aa46]">{empresasActivas}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1b2c56]">{totalTrabajadores}</div>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLA DE EMPRESAS --- */}
      <Card className="overflow-hidden border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-[#1b2c56]" />
            Listado de Empresas
          </CardTitle>
          <CardDescription>Gestiona los clientes corporativos de GM Express</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Cargando empresas...
            </div>
          ) : error ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={cargarEmpresas}>
                Reintentar
              </Button>
            </div>
          ) : empresas.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              No hay empresas registradas.
            </div>
          ) : (
            <div>
              {errorEstadoEmpresa && (
                <p className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">
                  {errorEstadoEmpresa}
                </p>
              )}

              <div className="w-full overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead className="text-center">Trabajadores</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Convenio</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresas.map((empresa) => (
                      <TableRow key={empresa.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{empresa.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {empresa.correo_contacto ?? "Sin correo registrado"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {empresa.rut ?? "Sin RUT"}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {empresa.trabajadores}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={empresa.estado === "ACTIVA" ? "default" : "secondary"}
                            className={
                              empresa.estado === "ACTIVA"
                                ? "bg-[#75aa46] text-white"
                                : "bg-slate-200 text-slate-600"
                            }
                          >
                            {empresa.estado === "ACTIVA" ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => abrirModalConvenio(empresa)}
                          >
                            Editar convenio
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/empresas/${empresa.id}`)}
                              >
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/empresas/${empresa.id}/editar`)}
                              >
                                Editar empresa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/empresas/${empresa.id}/trabajadores`)}
                              >
                                Ver trabajadores
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={empresa.estado === "ACTIVA" ? "text-destructive" : ""}
                                disabled={empresaCambiandoEstadoId === empresa.id}
                                onClick={() => cambiarEstadoEmpresa(empresa)}
                              >
                                {empresaCambiandoEstadoId === empresa.id
                                  ? "Actualizando..."
                                  : empresa.estado === "ACTIVA"
                                    ? "Desactivar"
                                    : "Activar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL DE CONVENIOS --- */}
      {empresaConvenioSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Editar convenio</h2>
              <p className="text-sm text-muted-foreground">
                Selecciona los productos disponibles para {empresaConvenioSeleccionada.nombre}.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {OPCIONES_CONVENIO.map((opcion) => (
                <div key={opcion.campo} className="flex items-center gap-3">
                  <input
                    id={opcion.campo}
                    type="checkbox"
                    checked={convenioForm[opcion.campo]}
                    disabled={guardandoConvenio}
                    onChange={(event) =>
                      actualizarCampoConvenio(opcion.campo, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-border accent-[#75aa46]"
                  />
                  <Label htmlFor={opcion.campo} className="text-sm font-medium">
                    {opcion.label}
                  </Label>
                </div>
              ))}
            </div>

            {errorConvenio && (
              <p className="mt-4 text-sm text-destructive">{errorConvenio}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={guardandoConvenio}
                onClick={cerrarModalConvenio}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
                disabled={guardandoConvenio}
                onClick={guardarConvenio}
              >
                {guardandoConvenio ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}