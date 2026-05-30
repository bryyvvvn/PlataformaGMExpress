import { NextResponse } from "next/server"
import db from "@/lib/db"
import { chileStartOfDay } from "@/lib/chile-time"
import {
  ERROR_HISTORICO_ANTES_CIERRE,
  esDiaLaboral,
  esFechaISOValida,
  obtenerDisponibilidadHistorico,
} from "@/lib/pedidos/cierre-pedidos"
import { generarExcelHistorico } from "@/lib/pedidos/excel"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function obtenerDiaSiguiente(fechaISO: string): string {
  const [year, month, day] = fechaISO.split("-").map(Number)
  const siguiente = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0))
  return siguiente.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get("fecha")

  if (!fecha) {
    return NextResponse.json(
      { error: "La fecha es obligatoria" },
      { status: 400 }
    )
  }

  if (!esFechaISOValida(fecha)) {
    return NextResponse.json(
      { error: "La fecha debe usar formato YYYY-MM-DD y ser válida" },
      { status: 400 }
    )
  }

  if (!esDiaLaboral(fecha)) {
    return NextResponse.json(
      { error: "La fecha debe corresponder a lunes-viernes" },
      { status: 400 }
    )
  }

  const disponibilidad = obtenerDisponibilidadHistorico(fecha)

  if (!disponibilidad.permitido) {
    return NextResponse.json(
      {
        error:
          disponibilidad.motivo === "ANTES_DEL_CIERRE"
            ? ERROR_HISTORICO_ANTES_CIERRE
            : disponibilidad.mensaje,
      },
      { status: 409 }
    )
  }

  try {
    const pedidos = await db.pedido.findMany({
      where: {
        fecha: {
          gte: chileStartOfDay(fecha),
          lt: chileStartOfDay(obtenerDiaSiguiente(fecha)),
        },
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        fecha: true,
        estado: true,
        empresa: {
          select: { nombre: true },
        },
        usuario: {
          select: { id: true, nombre: true },
        },
        detalles: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            cantidad: true,
            plato: {
              select: {
                nombre: true,
                categoria: true,
              },
            },
            guarnicion: {
              select: { nombre: true },
            },
          },
        },
      },
    })

    if (pedidos.length === 0) {
      return NextResponse.json(
        { error: "No hay pedidos para exportar en esta fecha" },
        { status: 404 }
      )
    }

    const archivo = generarExcelHistorico(pedidos)

    return new Response(archivo, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="historico-pedidos-${fecha}.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[exportar-historico] Error:", error)

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
