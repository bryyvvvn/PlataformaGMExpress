import { CategoriaPlato, type EstadoPedido } from "@prisma/client"
import ExcelJS from "exceljs"
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
  observacion?: string | null
  tipoEmpaquetado?: string | null
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
  fecha: Date
  estado: EstadoPedido
  observacion?: string | null
  tipoEmpaquetado?: string | null
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

type ItemConsolidado = {
  categoria: CategoriaPlato
  plato: string
  cantidad: number
}

type ItemConsolidadoEmpaquetado = ItemConsolidado & {
  tipoEmpaquetado: string | null
}

const CATEGORIAS_BEBESTIBLE: CategoriaPlato[] = [
  CategoriaPlato.JUGO,
  CategoriaPlato.BEBIDA,
  CategoriaPlato.AGUA_SABORIZADA,
]

const ORDEN_CATEGORIA: Partial<Record<CategoriaPlato, number>> = {
  [CategoriaPlato.ENTRADA]: 0,
  [CategoriaPlato.FONDO]: 1,
  [CategoriaPlato.POSTRE]: 2,
  [CategoriaPlato.JUGO]: 3,
  [CategoriaPlato.BEBIDA]: 4,
  [CategoriaPlato.AGUA_SABORIZADA]: 5,
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

function unirPlatosPorCategorias(
  detalles: DetallePedidoExcel[],
  categorias: CategoriaPlato[]
): string {
  return detalles
    .filter((detalle) => categorias.includes(detalle.plato.categoria))
    .map((detalle) => detalle.plato.nombre)
    .join(" | ")
}

function formatearTipoEmpaquetado(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'BOWL_CRAFT': return 'Bowl Craft'
    case 'C10_ALUMINIO': return 'C10 Aluminio'
    case 'SERVICIO_TRADICIONAL_PLATO': return 'Servicio Tradicional'
    default: return 'Sin definir'
  }
}

function sanitizarNombreHoja(nombre: string): string {
  return nombre
    .replace(/[\[\]:*?/\\]/g, "")
    .substring(0, 31)
    .trim()
}

function calcularConsolidado(pedidos: PedidoProduccionExcel[]): ItemConsolidado[] {
  const mapa = new Map<string, ItemConsolidado>()

  for (const pedido of pedidos) {
    for (const detalle of pedido.detalles) {
      const key = `${detalle.plato.categoria}:${detalle.plato.nombre}`
      const item = mapa.get(key)
      if (item) {
        item.cantidad += detalle.cantidad
      } else {
        mapa.set(key, {
          categoria: detalle.plato.categoria,
          plato: detalle.plato.nombre,
          cantidad: detalle.cantidad,
        })
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const ordenA = ORDEN_CATEGORIA[a.categoria] ?? 99
    const ordenB = ORDEN_CATEGORIA[b.categoria] ?? 99
    if (ordenA !== ordenB) return ordenA - ordenB
    return b.cantidad - a.cantidad
  })
}

function calcularConsolidadoPorEmpaquetado(
  pedidos: PedidoProduccionExcel[]
): ItemConsolidadoEmpaquetado[] {
  const mapa = new Map<string, ItemConsolidadoEmpaquetado>()

  for (const pedido of pedidos) {
    const tipoEmpaquetado = pedido.tipoEmpaquetado ?? null

    for (const detalle of pedido.detalles) {
      const key = `${detalle.plato.categoria}:${detalle.plato.nombre}:${tipoEmpaquetado ?? "SIN_DEFINIR"}`
      const item = mapa.get(key)

      if (item) {
        item.cantidad += detalle.cantidad
      } else {
        mapa.set(key, {
          categoria: detalle.plato.categoria,
          plato: detalle.plato.nombre,
          tipoEmpaquetado,
          cantidad: detalle.cantidad,
        })
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const ordenA = ORDEN_CATEGORIA[a.categoria] ?? 99
    const ordenB = ORDEN_CATEGORIA[b.categoria] ?? 99
    if (ordenA !== ordenB) return ordenA - ordenB
    if (a.cantidad !== b.cantidad) return b.cantidad - a.cantidad
    if (a.plato !== b.plato) return a.plato.localeCompare(b.plato, "es")
    return formatearTipoEmpaquetado(a.tipoEmpaquetado).localeCompare(
      formatearTipoEmpaquetado(b.tipoEmpaquetado),
      "es"
    )
  })
}

function agregarHojaHistorico(
  workbook: ExcelJS.Workbook,
  nombreHoja: string,
  pedidos: PedidoHistoricoExcel[]
): void {
  const sheet = workbook.addWorksheet(nombreHoja)

  sheet.columns = [
    { header: "Fecha",            key: "fecha",         width: 14 },
    { header: "Empresa",          key: "empresa",       width: 26 },
    { header: "Nombre Usuario",   key: "usuario",       width: 26 },
    { header: "Estado",           key: "estado",        width: 18 },
    { header: "Entradas",         key: "entradas",      width: 36 },
    { header: "Fondo",            key: "fondo",         width: 32 },
    { header: "Guarnición",       key: "guarnicion",    width: 24 },
    { header: "Postres",          key: "postres",       width: 28 },
    { header: "Bebestibles",      key: "bebestibles",   width: 28 },
    { header: "Tipo Empaquetado", key: "empaquetado",   width: 22 },
    { header: "Observaciones",    key: "observaciones", width: 40 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1B2C56" },
    }
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      top:    { style: "thin", color: { argb: "FF1B2C56" } },
      bottom: { style: "thin", color: { argb: "FF1B2C56" } },
      left:   { style: "thin", color: { argb: "FF1B2C56" } },
      right:  { style: "thin", color: { argb: "FF1B2C56" } },
    }
  })
  headerRow.height = 22

  pedidos.forEach((pedido, index) => {
    const detalles = [...pedido.detalles].sort((a, b) => a.id - b.id)
    const fondo = detalles.find(
      (d) => d.plato.categoria === CategoriaPlato.FONDO
    )

    const row = sheet.addRow({
      fecha:         formatFechaISOChile(pedido.fecha),
      empresa:       pedido.empresa.nombre,
      usuario:       pedido.usuario.nombre,
      estado:        pedido.estado,
      entradas:      unirPlatos(detalles, CategoriaPlato.ENTRADA),
      fondo:         fondo?.plato.nombre ?? "",
      guarnicion:    fondo?.guarnicion?.nombre ?? "",
      postres:       unirPlatos(detalles, CategoriaPlato.POSTRE),
      bebestibles:   unirPlatosPorCategorias(detalles, CATEGORIAS_BEBESTIBLE),
      empaquetado:   formatearTipoEmpaquetado(pedido.tipoEmpaquetado),
      observaciones: pedido.observacion ?? "",
    })

    const bgColor = index % 2 === 0 ? "FFFFFFFF" : "FFF3F4F6"
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
      cell.border = {
        top:    { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left:   { style: "thin", color: { argb: "FFE5E7EB" } },
        right:  { style: "thin", color: { argb: "FFE5E7EB" } },
      }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.font = { size: 10 }
    })
    row.height = 18
  })
}

export async function generarExcelHistorico(
  pedidos: PedidoHistoricoExcel[]
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "GM Express"
  workbook.created = new Date()

  agregarHojaHistorico(workbook, "Resumen General", pedidos)

  const pedidosPorEmpresa = new Map<string, PedidoHistoricoExcel[]>()
  for (const pedido of pedidos) {
    const nombre = pedido.empresa.nombre
    if (!pedidosPorEmpresa.has(nombre)) {
      pedidosPorEmpresa.set(nombre, [])
    }
    pedidosPorEmpresa.get(nombre)!.push(pedido)
  }

  const empresasOrdenadas = Array.from(pedidosPorEmpresa.keys()).sort()
  for (const empresa of empresasOrdenadas) {
    agregarHojaHistorico(
      workbook,
      sanitizarNombreHoja(empresa),
      pedidosPorEmpresa.get(empresa)!
    )
  }

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>
}

function aplicarEstiloEncabezado(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1B2C56" },
    }
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      top:    { style: "thin", color: { argb: "FF1B2C56" } },
      bottom: { style: "thin", color: { argb: "FF1B2C56" } },
      left:   { style: "thin", color: { argb: "FF1B2C56" } },
      right:  { style: "thin", color: { argb: "FF1B2C56" } },
    }
  })
  headerRow.height = 22
}

function aplicarEstiloFilaProduccion(
  row: ExcelJS.Row,
  index: number
): void {
  const bgColor = index % 2 === 0 ? "FFFFFFFF" : "FFF3F4F6"

  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
    cell.border = {
      top:    { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      left:   { style: "thin", color: { argb: "FFE5E7EB" } },
      right:  { style: "thin", color: { argb: "FFE5E7EB" } },
    }
    cell.alignment = { vertical: "middle", wrapText: true }
    cell.font = { size: 10 }
  })
  row.height = 18
}

function agregarSeccionConsolidado(
  sheet: ExcelJS.Worksheet,
  items: ItemConsolidado[]
): void {
  sheet.addRow([])

  const titleRow = sheet.addRow(["Consolidado"])
  sheet.mergeCells(`A${titleRow.number}:C${titleRow.number}`)
  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1B2C56" },
  }
  titleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
  titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" }
  titleRow.height = 22

  const subHeaderRow = sheet.addRow(["Categoría", "Plato", "Cantidad"])
  ;[1, 2, 3].forEach((col) => {
    const cell = subHeaderRow.getCell(col)
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } }
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      top:    { style: "thin", color: { argb: "FF374151" } },
      bottom: { style: "thin", color: { argb: "FF374151" } },
      left:   { style: "thin", color: { argb: "FF374151" } },
      right:  { style: "thin", color: { argb: "FF374151" } },
    }
  })
  subHeaderRow.height = 20

  items.forEach((item, index) => {
    const row = sheet.addRow([item.categoria, item.plato, item.cantidad])
    aplicarEstiloFilaProduccion(row, index)
  })
}

function agregarHojaProduccionDetallada(
  workbook: ExcelJS.Workbook,
  nombreHoja: string,
  pedidos: PedidoProduccionExcel[],
  incluirConsolidado: boolean
): void {
  const sheet = workbook.addWorksheet(nombreHoja)

  sheet.columns = [
    { header: "Fecha",            key: "fecha",         width: 14 },
    { header: "Empresa",          key: "empresa",       width: 26 },
    { header: "Nombre Usuario",   key: "usuario",       width: 26 },
    { header: "Estado",           key: "estado",        width: 18 },
    { header: "Entradas",         key: "entradas",      width: 36 },
    { header: "Fondo",            key: "fondo",         width: 32 },
    { header: "Guarnición",       key: "guarnicion",    width: 24 },
    { header: "Postres",          key: "postres",       width: 28 },
    { header: "Bebestibles",      key: "bebestibles",   width: 28 },
    { header: "Tipo Empaquetado", key: "empaquetado",   width: 22 },
    { header: "Observaciones",    key: "observaciones", width: 40 },
  ]

  aplicarEstiloEncabezado(sheet)

  pedidos.forEach((pedido, index) => {
    const detalles = [...pedido.detalles].sort((a, b) => a.id - b.id)
    const fondo = detalles.find((d) => d.plato.categoria === CategoriaPlato.FONDO)

    const row = sheet.addRow({
      fecha:         formatFechaISOChile(pedido.fecha),
      empresa:       pedido.empresa.nombre,
      usuario:       pedido.usuario.nombre,
      estado:        pedido.estado,
      entradas:      unirPlatos(detalles, CategoriaPlato.ENTRADA),
      fondo:         fondo?.plato.nombre ?? "",
      guarnicion:    fondo?.guarnicion?.nombre ?? "",
      postres:       unirPlatos(detalles, CategoriaPlato.POSTRE),
      bebestibles:   unirPlatosPorCategorias(detalles, CATEGORIAS_BEBESTIBLE),
      empaquetado:   formatearTipoEmpaquetado(pedido.tipoEmpaquetado),
      observaciones: pedido.observacion ?? "",
    })

    aplicarEstiloFilaProduccion(row, index)
  })

  if (incluirConsolidado) {
    const items = calcularConsolidado(pedidos)
    if (items.length > 0) {
      agregarSeccionConsolidado(sheet, items)
    }
  }
}

function agregarHojaConsolidado(
  workbook: ExcelJS.Workbook,
  pedidos: PedidoProduccionExcel[]
): void {
  const items = calcularConsolidadoPorEmpaquetado(pedidos)
  const sheet = workbook.addWorksheet("Consolidado")

  sheet.columns = [
    { header: "Categoría",        key: "categoria",   width: 20 },
    { header: "Plato",            key: "plato",       width: 40 },
    { header: "Tipo Empaquetado", key: "empaquetado", width: 22 },
    { header: "Cantidad",         key: "cantidad",    width: 14 },
  ]

  aplicarEstiloEncabezado(sheet)

  items.forEach((item, index) => {
    const row = sheet.addRow({
      categoria:   item.categoria,
      plato:       item.plato,
      empaquetado: formatearTipoEmpaquetado(item.tipoEmpaquetado),
      cantidad:    item.cantidad,
    })
    aplicarEstiloFilaProduccion(row, index)
  })
}

export async function generarExcelProduccion(
  pedidos: PedidoProduccionExcel[]
): Promise<ResultadoExcelProduccion> {
  const pedidosValidos: PedidoProduccionExcel[] = []
  const pedidoIdsIncluidos: number[] = []

  for (const pedido of pedidos) {
    const fondos = pedido.detalles
      .filter((item) => item.plato.categoria === CategoriaPlato.FONDO)
      .sort((a, b) => a.id - b.id)

    if (fondos.length === 0) {
      continue
    }

    pedidosValidos.push(pedido)
    pedidoIdsIncluidos.push(pedido.id)
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "GM Express"
  workbook.created = new Date()

  agregarHojaProduccionDetallada(workbook, "Resumen General", pedidosValidos, false)

  const pedidosPorEmpresa = new Map<string, PedidoProduccionExcel[]>()
  for (const pedido of pedidosValidos) {
    const key = `${pedido.empresa.id}:${pedido.empresa.nombre}`
    if (!pedidosPorEmpresa.has(key)) {
      pedidosPorEmpresa.set(key, [])
    }
    pedidosPorEmpresa.get(key)!.push(pedido)
  }

  const empresasOrdenadas = Array.from(pedidosPorEmpresa.entries()).sort(
    ([, a], [, b]) => a[0].empresa.nombre.localeCompare(b[0].empresa.nombre, "es")
  )
  for (const [, pedidosEmpresa] of empresasOrdenadas) {
    agregarHojaProduccionDetallada(
      workbook,
      sanitizarNombreHoja(pedidosEmpresa[0].empresa.nombre),
      pedidosEmpresa,
      true
    )
  }

  agregarHojaConsolidado(workbook, pedidosValidos)

  const archivo = await workbook.xlsx.writeBuffer()

  return {
    archivo: archivo as unknown as ArrayBuffer,
    pedidoIdsIncluidos,
  }
}
