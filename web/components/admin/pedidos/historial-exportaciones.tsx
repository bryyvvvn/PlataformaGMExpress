"use client"

import { useEffect, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { descargarArchivoExcel } from "@/lib/pedidos/exportaciones"

type ExportacionProduccion = {
  id: number
  fecha: string
  pedidosIncluidos: number
  creadoEn: string
  creadoPor: string | null
}

function formatearFecha(fechaISO: string): string {
  const [year, month, day] = fechaISO.split("-")
  return `${day}/${month}/${year}`
}

export function HistorialExportaciones() {
  const [exportaciones, setExportaciones] = useState<ExportacionProduccion[]>([])
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState<number | null>(null)

  async function handleDescargar(id: number, fecha: string) {
    setDescargando(id)
    try {
      const res = await fetch(`/api/admin/exportaciones-produccion/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        alert(data.error ?? "No se pudo descargar la planilla")
        return
      }
      await descargarArchivoExcel(res, `produccion-${fecha}.xlsx`)
    } catch (err) {
      console.error(err)
      alert("Error al descargar la planilla")
    } finally {
      setDescargando(null)
    }
  }

  useEffect(() => {
    let cancelado = false

    void fetch("/api/admin/exportaciones-produccion", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as {
          exportaciones?: ExportacionProduccion[]
        }
        if (!cancelado) {
          setExportaciones(data.exportaciones ?? [])
        }
      })
      .catch(() => {
        // estado vacío si falla la red
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  return (
    <Card className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1B2C56]">
          Historial de Planillas de Producción
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
          Registro de todas las exportaciones realizadas
        </p>
      </div>
      <CardContent className="p-0">
        {cargando ? (
          <div className="divide-y divide-slate-100">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-3 w-12 rounded bg-slate-200" />
                <div className="h-3 w-36 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : exportaciones.length === 0 ? (
          <p className="p-5 text-sm font-medium text-slate-400">
            No hay exportaciones registradas aún.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Día exportado
                </TableHead>
                <TableHead className="h-9 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Pedidos incluidos
                </TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Fecha y hora de exportación
                </TableHead>
                <TableHead className="h-9 w-25 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Descargar
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportaciones.map((exp) => (
                <TableRow key={exp.id} className="text-xs hover:bg-slate-50/50">
                  <TableCell className="py-3 font-semibold text-slate-800">
                    {formatearFecha(exp.fecha)}
                  </TableCell>
                  <TableCell className="py-3 text-center font-bold text-[#75AA46]">
                    {exp.pedidosIncluidos}
                  </TableCell>
                  <TableCell className="py-3 text-slate-500">
                    {new Date(exp.creadoEn).toLocaleString("es-CL", {
                      timeZone: "America/Santiago",
                    })}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <button
                      onClick={() => handleDescargar(exp.id, exp.fecha)}
                      disabled={descargando !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1B2C56] text-white text-xs font-bold hover:bg-[#121f3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {descargando === exp.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Download className="h-3 w-3" />
                      }
                      {descargando === exp.id ? "Descargando..." : "Descargar"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
