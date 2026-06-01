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
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Cargando trabajadores...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
        <Link href="/empresas" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>

        <Card>
          <CardContent className="space-y-4 px-6 py-8">
            <p className="text-sm text-muted-foreground">
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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link href="/empresas" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Trabajadores
            </h1>
            <p className="text-muted-foreground">{data.empresa.nombre}</p>
          </div>
        </div>

        <Link href={detalleHref} className={buttonVariants({ variant: "outline" })}>
          Ver detalles
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Total usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1b2c56]">
              {data.resumen.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserRound className="h-4 w-4" />
              Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#75aa46]">
              {data.resumen.trabajadores}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Representantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {data.resumen.representantes}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <CardHeader>
          <CardTitle>Usuarios asociados</CardTitle>
          <CardDescription>
            Trabajadores y representantes vinculados a esta empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.trabajadores.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Esta empresa aún no tiene trabajadores registrados.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>ID usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-center">Pedidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trabajadores.map((trabajador) => (
                    <TableRow key={trabajador.id}>
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
