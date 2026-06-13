"use server"

import db from "@/lib/db"
import { EstadoPedido } from "@prisma/client"
import { chileEndOfDay, chileStartOfDay } from "@/lib/chile-time"
import { formatFechaISOChile } from "@/lib/pedidos/fechas"

export type FilaFacturacion = {
  fecha: string
  pedidos: number
}

export type ResumenFacturacion = {
  totalPedidos: number
  tabla: FilaFacturacion[]
}

export async function obtenerResumenFacturacion(
  empresaId: number,
  fechaInicio: string,
  fechaFin: string
): Promise<ResumenFacturacion> {
  const fechaDesde = chileStartOfDay(fechaInicio)
  const fechaHasta = chileEndOfDay(fechaFin)
  const pedidos = await db.pedido.findMany({
    where: {
      empresaId,
      estado: { in: [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PRODUCCION] },
      fecha: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
    },
    select: { fecha: true },
    orderBy: { fecha: "asc" },
  })
  const pedidosManuales = await db.pedidoManual.findMany({
    where: {
      empresaId,
      fecha: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
    },
    select: { fecha: true, cantidad: true },
    orderBy: { fecha: "asc" },
  })

  const conteoPorFecha = new Map<string, number>()
  for (const { fecha } of pedidos) {
    const fechaISO = formatFechaISOChile(fecha)
    conteoPorFecha.set(fechaISO, (conteoPorFecha.get(fechaISO) ?? 0) + 1)
  }
  for (const { fecha, cantidad } of pedidosManuales) {
    const fechaISO = formatFechaISOChile(fecha)
    conteoPorFecha.set(fechaISO, (conteoPorFecha.get(fechaISO) ?? 0) + cantidad)
  }

  const tabla = Array.from(conteoPorFecha.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, pedidos]) => ({ fecha, pedidos }))

  return {
    totalPedidos:
      pedidos.length +
      pedidosManuales.reduce((total, pedidoManual) => total + pedidoManual.cantidad, 0),
    tabla,
  }
}
