import { EstadoEmpresa } from "@prisma/client"
import db from "@/lib/db"
import { chileEndOfDay, chileStartOfDay } from "@/lib/chile-time"
import { formatFechaISOChile } from "@/lib/pedidos/fechas"

export type PedidoManualDTO = {
  id: number
  empresaId: number
  empresa: {
    id: number
    nombre: string
  }
  fecha: string
  cantidad: number
  observacion: string | null
  creadoPor: string | null
  creadoEn: string
  actualizadoEn: string
}

export type FiltrosPedidosManuales = {
  empresaId?: number
  fechaDesde?: string
  fechaHasta?: string
}

export function formatearPedidoManual(pedido: {
  id: number
  empresaId: number
  fecha: Date
  cantidad: number
  observacion: string | null
  creado_por: string | null
  creado_en: Date
  actualizado_en: Date
  empresa: { id: number; nombre: string }
}): PedidoManualDTO {
  return {
    id: pedido.id,
    empresaId: pedido.empresaId,
    empresa: pedido.empresa,
    fecha: formatFechaISOChile(pedido.fecha),
    cantidad: pedido.cantidad,
    observacion: pedido.observacion,
    creadoPor: pedido.creado_por,
    creadoEn: pedido.creado_en.toISOString(),
    actualizadoEn: pedido.actualizado_en.toISOString(),
  }
}

export async function listarPedidosManuales(filtros: FiltrosPedidosManuales = {}) {
  const pedidos = await db.pedidoManual.findMany({
    where: {
      ...(filtros.empresaId ? { empresaId: filtros.empresaId } : {}),
      ...(filtros.fechaDesde || filtros.fechaHasta
        ? {
            fecha: {
              ...(filtros.fechaDesde ? { gte: chileStartOfDay(filtros.fechaDesde) } : {}),
              ...(filtros.fechaHasta ? { lte: chileEndOfDay(filtros.fechaHasta) } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ fecha: "desc" }, { creado_en: "desc" }],
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  })

  return pedidos.map(formatearPedidoManual)
}

export async function crearPedidoManual(data: {
  empresaId: number
  fecha: string
  cantidad: number
  observacion: string | null
  creadoPor: string | null
}) {
  const empresa = await db.empresa.findUnique({
    where: { id: data.empresaId },
    select: { id: true, estado: true },
  })

  if (!empresa) {
    throw new Error("La empresa seleccionada no existe")
  }

  if (empresa.estado !== EstadoEmpresa.ACTIVA) {
    throw new Error("La empresa seleccionada no est\u00e1 activa")
  }

  const pedido = await db.pedidoManual.create({
    data: {
      empresaId: data.empresaId,
      fecha: chileStartOfDay(data.fecha),
      cantidad: data.cantidad,
      observacion: data.observacion,
      creado_por: data.creadoPor,
    },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  })

  return formatearPedidoManual(pedido)
}
