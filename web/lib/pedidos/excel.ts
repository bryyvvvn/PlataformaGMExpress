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

type GrupoProduccion = {
  empresaId: number
  empresa: string
  fondo: string
  guarnicion: string
  cantidad: number
}

type ObservacionProduccion = {
  pedidoId: number
  empresa: string
  observacion: string
}

const CATEGORIAS_BEBESTIBLE: CategoriaPlato[] = [
  CategoriaPlato.JUGO,
  CategoriaPlato.BEBIDA,
  CategoriaPlato.AGUA_SABORIZADA,
]

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

function sanitizarNombreHoja(nombre: string): string {
  return nombre
    .replace(/[\[\]:*?/\\]/g, "")
    .substring(0, 31)
    .trim()
}

function agregarHojaHistorico(
  workbook: ExcelJS.Workbook,
  nombreHoja: string,
  pedidos: PedidoHistoricoExcel[]
): void {
  const sheet = workbook.addWorksheet(nombreHoja)

  sheet.columns = [
    { header: "Fecha",          key: "fecha",         width: 14 },
    { header: "Empresa",        key: "empresa",       width: 26 },
    { header: "Nombre Usuario", key: "usuario",       width: 26 },
    { header: "Estado",         key: "estado",        width: 18 },
    { header: "Entradas",       key: "entradas",      width: 36 },
    { header: "Fondo",          key: "fondo",         width: 32 },
    { header: "Guarnición",     key: "guarnicion",    width: 24 },
    { header: "Postres",        key: "postres",       width: 28 },
    { header: "Bebestibles",    key: "bebestibles",   width: 28 },
    { header: "Observaciones",  key: "observaciones", width: 40 },
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

function agregarHojaProduccion(
  workbook: ExcelJS.Workbook,
  nombreHoja: string,
  grupos: GrupoProduccion[],
  incluirEmpresa: boolean
): void {
  const sheet = workbook.addWorksheet(nombreHoja)

  sheet.columns = incluirEmpresa
    ? [
        { header: "Empresa",    key: "empresa",    width: 26 },
        { header: "Fondo",      key: "fondo",      width: 32 },
        { header: "Guarnición", key: "guarnicion", width: 24 },
        { header: "Cantidad",   key: "cantidad",   width: 14 },
      ]
    : [
        { header: "Fondo",      key: "fondo",      width: 32 },
        { header: "Guarnición", key: "guarnicion", width: 24 },
        { header: "Cantidad",   key: "cantidad",   width: 14 },
      ]

  aplicarEstiloEncabezado(sheet)

  grupos.forEach((grupo, index) => {
    const row = incluirEmpresa
      ? sheet.addRow({
          empresa: grupo.empresa,
          fondo: grupo.fondo,
          guarnicion: grupo.guarnicion,
          cantidad: grupo.cantidad,
        })
      : sheet.addRow({
          fondo: grupo.fondo,
          guarnicion: grupo.guarnicion,
          cantidad: grupo.cantidad,
        })

    aplicarEstiloFilaProduccion(row, index)
  })
}

function agregarHojaObservacionesProduccion(
  workbook: ExcelJS.Workbook,
  observaciones: ObservacionProduccion[]
): void {
  const sheet = workbook.addWorksheet("Observaciones")

  sheet.columns = [
    { header: "ID Pedido",   key: "pedidoId",    width: 12 },
    { header: "Empresa",     key: "empresa",     width: 26 },
    { header: "Observación", key: "observacion", width: 72 },
  ]

  aplicarEstiloEncabezado(sheet)

  observaciones.forEach((observacion, index) => {
    const row = sheet.addRow(observacion)
    aplicarEstiloFilaProduccion(row, index)
  })
}

export async function generarExcelProduccion(
  pedidos: PedidoProduccionExcel[]
): Promise<ResultadoExcelProduccion> {
  const grupos = new Map<string, GrupoProduccion>()
  const observaciones: ObservacionProduccion[] = []
  const pedidoIdsIncluidos: number[] = []

  for (const pedido of pedidos) {
    const fondos = pedido.detalles
      .filter((item) => item.plato.categoria === CategoriaPlato.FONDO)
      .sort((a, b) => a.id - b.id)

    if (fondos.length === 0) {
      observaciones.push({
        pedidoId: pedido.id,
        empresa: pedido.empresa.nombre,
        observacion:
          "Pedido omitido: no contiene detalle de categoría FONDO.",
      })
      continue
    }

    const fondo = fondos[0]

    if (fondos.length > 1) {
      observaciones.push({
        pedidoId: pedido.id,
        empresa: pedido.empresa.nombre,
        observacion:
          `Contiene múltiples fondos. Se utilizó el detalle ${fondo.id}.`,
      })
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
        empresaId: pedido.empresa.id,
        empresa: pedido.empresa.nombre,
        fondo: fondo.plato.nombre,
        guarnicion,
        cantidad: fondo.cantidad,
      })
    }

    pedidoIdsIncluidos.push(pedido.id)
  }

  const gruposOrdenados = Array.from(grupos.values()).sort((a, b) => {
    return (
      a.empresa.localeCompare(b.empresa, "es") ||
      a.fondo.localeCompare(b.fondo, "es") ||
      a.guarnicion.localeCompare(b.guarnicion, "es")
    )
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "GM Express"
  workbook.created = new Date()

  agregarHojaProduccion(workbook, "Resumen General", gruposOrdenados, true)

  const gruposPorEmpresa = new Map<string, GrupoProduccion[]>()
  for (const grupo of gruposOrdenados) {
    const empresaKey = `${grupo.empresaId}:${grupo.empresa}`
    if (!gruposPorEmpresa.has(empresaKey)) {
      gruposPorEmpresa.set(empresaKey, [])
    }
    gruposPorEmpresa.get(empresaKey)!.push(grupo)
  }

  const empresasOrdenadas = Array.from(gruposPorEmpresa.entries()).sort(
    ([, gruposA], [, gruposB]) =>
      gruposA[0].empresa.localeCompare(gruposB[0].empresa, "es")
  )
  for (const [, gruposEmpresa] of empresasOrdenadas) {
    agregarHojaProduccion(
      workbook,
      sanitizarNombreHoja(gruposEmpresa[0].empresa),
      gruposEmpresa,
      false
    )
  }

  if (observaciones.length > 0) {
    agregarHojaObservacionesProduccion(workbook, observaciones)
  }

  const archivo = await workbook.xlsx.writeBuffer()

  return {
    archivo: archivo as unknown as ArrayBuffer,
    pedidoIdsIncluidos,
  }
}
