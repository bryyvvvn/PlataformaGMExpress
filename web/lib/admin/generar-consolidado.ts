import db from "@/lib/db"
import { CHILE_TZ, chileEndOfDay, chileStartOfDay } from "@/lib/chile-time"
import { CategoriaPlato, EstadoPedido } from "@prisma/client"

export type ItemConsolidado = {
  nombre: string
  cantidad: number
  variante?: string
}

export type FilaPacking = {
  empresa: string
  totalRaciones: number
  tipoEmpaquetado: string | null
  detalles: { plato: string; cantidad: number }[]
}

export type ConsolidadoDia = {
  fecha: string // DD/MM/YYYY hora Santiago
  zonaFria: ItemConsolidado[]
  zonaCaliente: ItemConsolidado[]
  packing: FilaPacking[]
  resumenGeneral: {
    totalPedidos: number
    totalRacionesManuales: number
    totalRacionesGlobal: number
    empresaTopNombre: string | null
    empresaTopCantidad: number
  }
}

type PackingAcumulador = {
  empresa: string
  totalRaciones: number
  tipoEmpaquetado: string | null
  detalles: Map<string, number>
}

function toChileISODate(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha)
}

function formatFechaHoraChile(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(fecha)

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? ""

  return `${obtener("day")}/${obtener("month")}/${obtener("year")} ${obtener("hour")}:${obtener("minute")}`
}

function acumularItem(
  mapa: Map<string, ItemConsolidado>,
  clave: string,
  nombre: string,
  cantidad: number,
  variante?: string
): void {
  const existente = mapa.get(clave)

  if (existente) {
    existente.cantidad += cantidad
    return
  }

  mapa.set(
    clave,
    variante === undefined ? { nombre, cantidad } : { nombre, cantidad, variante }
  )
}

function esZonaFria(categoria: CategoriaPlato, nombreLower: string): boolean {
  if (categoria === CategoriaPlato.POSTRE) return true
  return categoria === CategoriaPlato.ENTRADA && !nombreLower.includes("sopa")
}

function esZonaCaliente(categoria: CategoriaPlato, nombreLower: string): boolean {
  if (
    categoria === CategoriaPlato.FONDO ||
    categoria === CategoriaPlato.SANDWICH ||
    categoria === CategoriaPlato.SNACK
  ) {
    return true
  }

  return categoria === CategoriaPlato.ENTRADA && nombreLower.includes("sopa")
}

export async function getConsolidadoDia(fecha?: Date): Promise<ConsolidadoDia> {
  const fechaISO = fecha ? toChileISODate(fecha) : undefined
  const fechaInicio = chileStartOfDay(fechaISO)
  const fechaFin = chileEndOfDay(fechaISO)

  const [pedidos, pedidosManuales] = await Promise.all([
    db.pedido.findMany({
      where: {
        fecha: { gte: fechaInicio, lte: fechaFin },
        estado: { not: EstadoPedido.CANCELADO },
      },
      include: {
        detalles: {
          include: {
            plato: true,
            guarnicion: true,
          },
        },
        empresa: {
          include: {
            ConvenioEmpresa: {
              select: { tipoEmpaquetado: true },
            },
          },
        },
      },
    }),
    db.pedidoManual.findMany({
      where: {
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      include: { empresa: true },
    }),
  ])

  const zonaFriaMap = new Map<string, ItemConsolidado>()
  const zonaCalienteMap = new Map<string, ItemConsolidado>()
  const guarnicionesMap = new Map<string, ItemConsolidado>()
  const packingMap = new Map<number, PackingAcumulador>()

  for (const pedido of pedidos) {
    let packingEmpresa = packingMap.get(pedido.empresaId)

    if (!packingEmpresa) {
      packingEmpresa = {
        empresa: pedido.empresa.nombre,
        totalRaciones: 0,
        tipoEmpaquetado: pedido.empresa.ConvenioEmpresa?.tipoEmpaquetado ?? null,
        detalles: new Map<string, number>(),
      }
      packingMap.set(pedido.empresaId, packingEmpresa)
    }

    for (const detalle of pedido.detalles) {
      const { plato, guarnicion, cantidad } = detalle
      const nombreLower = plato.nombre.toLowerCase()

      if (esZonaFria(plato.categoria, nombreLower)) {
        acumularItem(zonaFriaMap, plato.nombre, plato.nombre, cantidad, plato.tipo)
      }

      if (esZonaCaliente(plato.categoria, nombreLower)) {
        acumularItem(
          zonaCalienteMap,
          `${plato.nombre}|${plato.tipo}`,
          plato.nombre,
          cantidad,
          plato.tipo
        )
      }

      if (guarnicion) {
        acumularItem(guarnicionesMap, guarnicion.nombre, guarnicion.nombre, cantidad)
      }

      packingEmpresa.totalRaciones += cantidad
      packingEmpresa.detalles.set(
        plato.nombre,
        (packingEmpresa.detalles.get(plato.nombre) ?? 0) + cantidad
      )
    }
  }

  for (const pedidoManual of pedidosManuales) {
    let packingEmpresa = packingMap.get(pedidoManual.empresaId)

    if (!packingEmpresa) {
      packingEmpresa = {
        empresa: pedidoManual.empresa.nombre,
        totalRaciones: 0,
        tipoEmpaquetado: null,
        detalles: new Map<string, number>(),
      }
      packingMap.set(pedidoManual.empresaId, packingEmpresa)
    }

    packingEmpresa.totalRaciones += pedidoManual.cantidad
  }

  const zonaCaliente = [
    ...Array.from(zonaCalienteMap.values()),
    ...Array.from(guarnicionesMap.values()),
  ]

  const packing: FilaPacking[] = Array.from(packingMap.values()).map((fila) => ({
    empresa: fila.empresa,
    totalRaciones: fila.totalRaciones,
    tipoEmpaquetado: fila.tipoEmpaquetado,
    detalles: Array.from(fila.detalles.entries()).map(([plato, cantidad]) => ({
      plato,
      cantidad,
    })),
  }))

  const totalRacionesPedidos = pedidos.reduce(
    (acc, pedido) =>
      acc + pedido.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0),
    0
  )
  const totalRacionesManuales = pedidosManuales.reduce(
    (acc, pedidoManual) => acc + pedidoManual.cantidad,
    0
  )

  let empresaTopNombre: string | null = null
  let empresaTopCantidad = 0

  for (const fila of packing) {
    if (fila.totalRaciones > empresaTopCantidad) {
      empresaTopCantidad = fila.totalRaciones
      empresaTopNombre = fila.empresa
    }
  }

  return {
    fecha: formatFechaHoraChile(new Date()),
    zonaFria: Array.from(zonaFriaMap.values()),
    zonaCaliente,
    packing,
    resumenGeneral: {
      totalPedidos: pedidos.length,
      totalRacionesManuales,
      totalRacionesGlobal: totalRacionesPedidos + totalRacionesManuales,
      empresaTopNombre,
      empresaTopCantidad,
    },
  }
}
