"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, ClipboardList, UserRound, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type RolUsuario = "REPRESENTANTE" | "TRABAJADOR"

type TrabajadorEmpresa = {
  id: string
  nombre: string
  rol: RolUsuario
  pedidos: number
}

type TrabajadoresResponse = {
  empresa: {
    id: number
    nombre: string
  }
  trabajadores: TrabajadorEmpresa[]
  resumen: {
    total: number
    trabajadores: number
    representantes: number
  }
}

function etiquetaRol(rol: RolUsuario) {
  return rol === "REPRESENTANTE" ? "Representante" : "Trabajador"
}

export default function TrabajadoresEmpresaPage() {
  const params = useParams<{ empresaId?: string | string[] }>()
  const empresaId = Array.isArray(params.empresaId)
    ? params.empresaId[0]
    : params.empresaId

  const [data, setData] = useState<TrabajadoresResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const detalleHref = empresaId ? `/empresas/${empresaId}` : "/empresas"

  const cargarTrabajadores = useCallback(async () => {
    if (!empresaId) {
      setError("No se pudieron cargar los trabajadores")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/empresas/${empresaId}/trabajadores`,
        {
          cache: "no-store",
        }
      )

      if (!response.ok) {
        throw new Error("No se pudieron cargar los trabajadores")
      }

      const responseData = (await response.json()) as TrabajadoresResponse
      setData(responseData)
    } catch (err) {
      console.error("[TrabajadoresEmpresaPage] Error:", err)
      setError("No se pudieron cargar los trabajadores")
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarTrabajadores()
    })
  }, [cargarTrabajadores])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <p className="text-sm text-slate-600">
          Cargando trabajadores...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <Link href="/empresas" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-3 px-4 py-6">
            <p className="text-sm text-slate-600">
              {error ?? "No se pudieron cargar los trabajadores"}
            </p>
            <Button variant="outline" onClick={cargarTrabajadores}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link href="/empresas" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Empresa
            </p>
            <h1 className="text-xl font-semibold text-[#1B2C56]">
              Trabajadores
            </h1>
            <p className="text-sm text-slate-600">{data.empresa.nombre}</p>
          </div>
        </div>

        <Link href={detalleHref} className={buttonVariants({ variant: "outline" })}>
          Ver detalles
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-4 pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4" />
              Total usuarios
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-semibold text-[#1B2C56]">
              {data.resumen.total}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-4 pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <UserRound className="h-4 w-4" />
              Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-semibold text-[#75AA46]">
              {data.resumen.trabajadores}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-4 pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <ClipboardList className="h-4 w-4" />
              Representantes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-semibold text-[#1B2C56]">
              {data.resumen.representantes}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle className="text-sm font-semibold text-[#1B2C56]">Usuarios asociados</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Trabajadores y representantes vinculados a esta empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.trabajadores.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-600">
              Esta empresa aún no tiene trabajadores registrados.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-[#1B2C56]">Nombre</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-[#1B2C56]">ID usuario</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-[#1B2C56]">Rol</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-[#1B2C56]">Pedidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trabajadores.map((trabajador) => (
                    <TableRow key={trabajador.id} className="text-sm">
                      <TableCell className="font-medium">
                        {trabajador.nombre.toUpperCase()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {trabajador.id}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trabajador.rol === "REPRESENTANTE"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            trabajador.rol === "REPRESENTANTE"
                              ? "bg-[#1b2c56] text-white"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {etiquetaRol(trabajador.rol)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {trabajador.pedidos}
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
