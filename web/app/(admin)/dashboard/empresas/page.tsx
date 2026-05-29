"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
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

type ConvenioEmpresa = {
  id: number
  permitePlato: boolean
  permiteEntrada: boolean
  permitePostre: boolean
  permitePan: boolean
  permiteJugo: boolean
  permiteBebida: boolean
  permiteAguaSaborizada: boolean
}

type EmpresaCliente = {
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
  estado: "ACTIVA" | "INACTIVA"
  trabajadores: number
  representantes: number
  pedidos: number
  convenio: ConvenioEmpresa | null
}

type EmpresasResponse = {
  empresas: EmpresaCliente[]
}

type ConvenioForm = Omit<ConvenioEmpresa, "id">

const CONVENIO_DEFAULTS: ConvenioForm = {
  permitePlato: true,
  permiteEntrada: true,
  permitePostre: true,
  permitePan: true,
  permiteJugo: true,
  permiteBebida: false,
  permiteAguaSaborizada: false,
}

const OPCIONES_CONVENIO: Array<{ campo: keyof ConvenioForm; label: string }> = [
  { campo: "permitePlato", label: "Plato" },
  { campo: "permiteEntrada", label: "Entrada" },
  { campo: "permitePostre", label: "Postre" },
  { campo: "permitePan", label: "Pan" },
  { campo: "permiteJugo", label: "Jugo" },
  { campo: "permiteBebida", label: "Bebida" },
  { campo: "permiteAguaSaborizada", label: "Agua saborizada" },
]

export default function EmpresasView() {
  const [empresas, setEmpresas] = useState<EmpresaCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [empresaConvenioSeleccionada, setEmpresaConvenioSeleccionada] =
    useState<EmpresaCliente | null>(null)
  const [convenioForm, setConvenioForm] = useState<ConvenioForm>(CONVENIO_DEFAULTS)
  const [guardandoConvenio, setGuardandoConvenio] = useState(false)
  const [errorConvenio, setErrorConvenio] = useState<string | null>(null)
  const [empresaCambiandoEstadoId, setEmpresaCambiandoEstadoId] = useState<
    number | null
  >(null)
  const [errorEstadoEmpresa, setErrorEstadoEmpresa] = useState<string | null>(null)

  const cargarEmpresas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/empresas", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudieron cargar las empresas")
      }

      const data = (await response.json()) as EmpresasResponse
      setEmpresas(data.empresas)
    } catch (err) {
      console.error("[EmpresasView] Error:", err)
      setError("No se pudieron cargar las empresas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarEmpresas()
    })
  }, [cargarEmpresas])

  const totalTrabajadores = empresas.reduce((sum, e) => sum + e.trabajadores, 0)
  const empresasActivas = empresas.filter((e) => e.estado === "ACTIVA").length

  const abrirModalConvenio = (empresa: EmpresaCliente) => {
    setEmpresaConvenioSeleccionada(empresa)
    setConvenioForm(
      empresa.convenio
        ? {
            permitePlato: empresa.convenio.permitePlato,
            permiteEntrada: empresa.convenio.permiteEntrada,
            permitePostre: empresa.convenio.permitePostre,
            permitePan: empresa.convenio.permitePan,
            permiteJugo: empresa.convenio.permiteJugo,
            permiteBebida: empresa.convenio.permiteBebida,
            permiteAguaSaborizada: empresa.convenio.permiteAguaSaborizada,
          }
        : CONVENIO_DEFAULTS
    )
    setErrorConvenio(null)
  }

  const cerrarModalConvenio = () => {
    if (guardandoConvenio) return
    setEmpresaConvenioSeleccionada(null)
    setErrorConvenio(null)
  }

  const actualizarCampoConvenio = (campo: keyof ConvenioForm, checked: boolean) => {
    setConvenioForm((prev) => ({
      ...prev,
      [campo]: checked,
    }))
  }

  const guardarConvenio = async () => {
    if (!empresaConvenioSeleccionada) return

    setGuardandoConvenio(true)
    setErrorConvenio(null)

    try {
      const response = await fetch(
        `/api/admin/empresas/${empresaConvenioSeleccionada.id}/convenio`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(convenioForm),
        }
      )

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "No se pudo actualizar el convenio")
      }

      setEmpresaConvenioSeleccionada(null)
      setErrorConvenio(null)
      await cargarEmpresas()
    } catch (err) {
      console.error("[EmpresasView] Error guardando convenio:", err)
      setErrorConvenio(
        err instanceof Error ? err.message : "No se pudo actualizar el convenio"
      )
    } finally {
      setGuardandoConvenio(false)
    }
  }

  const cambiarEstadoEmpresa = async (empresa: EmpresaCliente) => {
    const nuevoEstado = empresa.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA"

    setErrorEstadoEmpresa(null)
    setEmpresaCambiandoEstadoId(empresa.id)

    try {
      const response = await fetch(`/api/admin/empresas/${empresa.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "No se pudo actualizar el estado de la empresa")
      }

      await cargarEmpresas()
    } catch (err) {
      console.error("[EmpresasView] Error actualizando estado:", err)
      setErrorEstadoEmpresa(
        err instanceof Error ? err.message : "No se pudo actualizar el estado de la empresa"
      )
    } finally {
      setEmpresaCambiandoEstadoId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
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
          href="/dashboard/empresas/nueva"
          className={buttonVariants({
            className: "w-full bg-[#75aa46] text-white hover:bg-[#5d8a38] sm:w-auto",
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Empresa
        </Link>
      </div>

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
                              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                              <DropdownMenuItem>Editar empresa</DropdownMenuItem>
                              <DropdownMenuItem>Ver trabajadores</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={
                                  empresa.estado === "ACTIVA" ? "text-destructive" : ""
                                }
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
