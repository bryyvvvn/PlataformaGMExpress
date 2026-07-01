import { EstadoPedido } from "@prisma/client"
import { NextResponse } from "next/server"
import db from "@/lib/db"
import { chileStartOfDay } from "@/lib/chile-time"
import { generarExcelProduccion } from "@/lib/pedidos/excel"
import { validarAdministrador } from "@/lib/usuarios/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function obtenerDiaSiguiente(fechaISO: string): string {
  const [year, month, day] = fechaISO.split("-").map(Number)
  const siguiente = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0))
  return siguiente.toISOString().slice(0, 10)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await validarAdministrador()

  if ("error" in admin) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status }
    )
  }

  const { id: rawId } = await params
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const exportacion = await db.exportacionProduccion.findUnique({
      where: { id },
      select: { fecha: true },
    })

    if (!exportacion) {
      return NextResponse.json(
        { error: "Exportación no encontrada" },
        { status: 404 }
      )
    }

    const { fecha } = exportacion

    const pedidos = await db.pedido.findMany({
      where: {
        estado: EstadoPedido.EN_PRODUCCION,
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
        observacion: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            ConvenioEmpresa: {
              select: { tipoEmpaquetado: true },
            },
          },
        },
        usuario: { select: { id: true, nombre: true } },
        detalles: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            platoId: true,
            cantidad: true,
            guarnicionId: true,
            plato: { select: { nombre: true, categoria: true } },
            guarnicion: { select: { nombre: true } },
          },
        },
      },
    })

    if (pedidos.length === 0) {
      return NextResponse.json(
        { error: "No hay pedidos en producción para esta fecha" },
        { status: 404 }
      )
    }

    const pedidosNormalizados = pedidos.map((pedido) => ({
      ...pedido,
      observacion: pedido.observacion ?? null,
      tipoEmpaquetado: pedido.empresa.ConvenioEmpresa?.tipoEmpaquetado ?? null,
      usuario: {
        ...pedido.usuario,
        nombre: pedido.usuario.nombre ?? "Usuario sin nombre",
      },
    }))

    const { archivo } = await generarExcelProduccion(pedidosNormalizados)

    return new Response(archivo, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="produccion-${fecha}.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[exportaciones-produccion/id] Error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
