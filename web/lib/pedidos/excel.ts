import { CategoriaPlato, type EstadoPedido } from "@prisma/client"
import * as xlsx from "xlsx"
import { formatFechaISOChile } from "@/lib/pedidos/fechas"

type DetallePedidoExcel = {
  id: number
  cantidad: number
  plato: {
    nombre: string
    categoria: CategoriaPlato
  }
  guarnicion: {
    nombre: string
  } | null
}

export type PedidoHistoricoExcel = {
  id: number
  fecha: Date
  estado: EstadoPedido
  empresa: {
    nombre: string
  }
  usuario: {
    id: string
    nombre: string
  }
  detalles: DetallePedidoExcel[]
}

type DetallePedidoProduccionExcel = DetallePedidoExcel & {
  platoId: number
  guarnicionId: number | null
}

export type PedidoProduccionExcel = {
  id: number
  empresa: {
    id: number
    nombre: string
  }
  usuario: {
    id: string
    nombre: string
  }
  detalles: DetallePedidoProduccionExcel[]
}

export type ResultadoExcelProduccion = {
  archivo: ArrayBuffer
  pedidoIdsIncluidos: number[]
}

type CeldaExcel = string | number

type GrupoProduccion = {
  empresa: string
  fondo: string
  guarnicion: string
  cantidad: number
}

function unirPlatos(
  detalles: DetallePedidoExcel[],
  categoria: CategoriaPlato
): string {
  return detalles
    .filter((detalle) => detalle.plato.categoria === categoria)
    .map((detalle) => detalle.plato.nombre)
    .join(", ")
}

function crearFilaHistorica(pedido: PedidoHistoricoExcel): CeldaExcel[] {
  const detalles = [...pedido.detalles].sort((a, b) => a.id - b.id)
  const fondos = detalles.filter(
    (detalle) => detalle.plato.categoria === CategoriaPlato.FONDO
  )

  if (fondos.length === 0) {
    console.warn(`[exportar-historico] Pedido ${pedido.id} sin detalle FONDO`)
  }

  if (fondos.length > 1) {
    console.warn(
      `[exportar-historico] Pedido ${pedido.id} tiene múltiples fondos; se utilizará el primero`
    )
  }

  const fondo = fondos[0]

  return [
    pedido.id,
    formatFechaISOChile(pedido.fecha),
    pedido.empresa.nombre,
    pedido.usuario.id,
    pedido.usuario.nombre,
    pedido.estado,
    unirPlatos(detalles, CategoriaPlato.ENTRADA),
    fondo?.plato.nombre ?? "",
    fondo?.guarnicion?.nombre ?? "",
    unirPlatos(detalles, CategoriaPlato.POSTRE),
    unirPlatos(detalles, CategoriaPlato.BEBESTIBLE),
    fondo?.cantidad ?? 0,
  ]
}

export function generarExcelHistorico(
  pedidos: PedidoHistoricoExcel[]
): ArrayBuffer {
  const encabezados: CeldaExcel[] = [
    "ID Pedido",
    "Fecha",
    "Empresa",
    "ID Usuario",
    "Nombre Usuario",
    "Estado",
    "Entradas",
    "Fondo",
    "Guarnición",
    "Postres",
    "Bebestibles",
    "Cantidad Fondo",
  ]

  const hoja = xlsx.utils.aoa_to_sheet<CeldaExcel>([
    encabezados,
    ...pedidos.map(crearFilaHistorica),
  ])

  hoja["!cols"] = [12, 14, 24, 28, 24, 18, 36, 32, 24, 28, 28, 16].map(
    (wch) => ({ wch })
  )

  const libro = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(libro, hoja, "Histórico")

  const archivo: unknown = xlsx.write(libro, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  })

  if (!(archivo instanceof ArrayBuffer)) {
    throw new Error("No se pudo generar el archivo Excel")
  }

  return archivo
}

export function generarExcelProduccion(
  pedidos: PedidoProduccionExcel[]
): ResultadoExcelProduccion {
  const grupos = new Map<string, GrupoProduccion>()
  const detalle: CeldaExcel[][] = [
    [
      "ID Pedido",
      "Empresa",
      "ID Usuario",
      "Nombre Usuario",
      "Fondo",
      "Guarnición",
      "Cantidad Fondo",
    ],
  ]
  const observaciones: CeldaExcel[][] = [
    ["ID Pedido", "Empresa", "Observación"],
  ]
  const pedidoIdsIncluidos: number[] = []

  for (const pedido of pedidos) {
    const fondos = pedido.detalles
      .filter((item) => item.plato.categoria === CategoriaPlato.FONDO)
      .sort((a, b) => a.id - b.id)

    if (fondos.length === 0) {
      console.warn(
        `[exportar-produccion] Pedido ${pedido.id} sin detalle FONDO; omitido`
      )
      observaciones.push([
        pedido.id,
        pedido.empresa.nombre,
        "Pedido omitido: no contiene detalle de categoría FONDO.",
      ])
      continue
    }

    const fondo = fondos[0]

    if (fondos.length > 1) {
      console.warn(
        `[exportar-produccion] Pedido ${pedido.id} tiene múltiples fondos; se utilizará el primero`
      )
      observaciones.push([
        pedido.id,
        pedido.empresa.nombre,
        `Contiene múltiples fondos. Se utilizó el detalle ${fondo.id}.`,
      ])
    }

    const guarnicion = fondo.guarnicion?.nombre ?? ""
    const key = [
      pedido.empresa.id,
      fondo.platoId,
      fondo.guarnicionId ?? "sin-guarnicion",
    ].join(":")
    const grupo = grupos.get(key)

    if (grupo) {
      grupo.cantidad += fondo.cantidad
    } else {
      grupos.set(key, {
        empresa: pedido.empresa.nombre,
        fondo: fondo.plato.nombre,
        guarnicion,
        cantidad: fondo.cantidad,
      })
    }

    pedidoIdsIncluidos.push(pedido.id)
    detalle.push([
      pedido.id,
      pedido.empresa.nombre,
      pedido.usuario.id,
      pedido.usuario.nombre,
      fondo.plato.nombre,
      guarnicion,
      fondo.cantidad,
    ])
  }

  const produccion: CeldaExcel[][] = [
    ["Empresa", "Fondo", "Guarnición", "Cantidad"],
  ]
  const gruposOrdenados = Array.from(grupos.values()).sort((a, b) => {
    return (
      a.empresa.localeCompare(b.empresa, "es") ||
      a.fondo.localeCompare(b.fondo, "es") ||
      a.guarnicion.localeCompare(b.guarnicion, "es")
    )
  })

  for (const grupo of gruposOrdenados) {
    produccion.push([
      grupo.empresa,
      grupo.fondo,
      grupo.guarnicion,
      grupo.cantidad,
    ])
  }

  const hojaProduccion = xlsx.utils.aoa_to_sheet<CeldaExcel>(produccion)
  hojaProduccion["!cols"] = [24, 32, 24, 12].map((wch) => ({ wch }))

  const hojaDetalle = xlsx.utils.aoa_to_sheet<CeldaExcel>(detalle)
  hojaDetalle["!cols"] = [12, 24, 28, 24, 32, 24, 16].map((wch) => ({ wch }))

  const libro = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(libro, hojaProduccion, "Producción")
  xlsx.utils.book_append_sheet(libro, hojaDetalle, "Detalle")

  if (observaciones.length > 1) {
    const hojaObservaciones =
      xlsx.utils.aoa_to_sheet<CeldaExcel>(observaciones)
    hojaObservaciones["!cols"] = [12, 24, 72].map((wch) => ({ wch }))
    xlsx.utils.book_append_sheet(libro, hojaObservaciones, "Observaciones")
  }

  const archivo: unknown = xlsx.write(libro, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  })

  if (!(archivo instanceof ArrayBuffer)) {
    throw new Error("No se pudo generar el archivo Excel de producción")
  }

  return {
    archivo,
    pedidoIdsIncluidos,
  }
}
