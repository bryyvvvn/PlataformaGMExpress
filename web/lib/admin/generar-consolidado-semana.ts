import { getConsolidadoDia } from "@/lib/admin/generar-consolidado"
import type { ItemConsolidado, FilaPacking } from "@/lib/admin/generar-consolidado"
import { CHILE_TZ, getChileDayName, nowChile } from "@/lib/chile-time"

export type BreakdownDia = {
  fecha: string // "Lunes 16/06"
  fechaISO: string // "YYYY-MM-DD" para debugging
  zonaFriaCount: number
  zonaCalienteCount: number
  totalPedidos: number
}

export type ConsolidadoSemana = {
  semana: string // "16/06/2025 – 22/06/2025"
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
  breakdown: BreakdownDia[]
}

type PackingAcumuladorSemana = {
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

function isoDesdeNoonUTC(fecha: Date): string {
  const year = fecha.getUTCFullYear()
  const month = String(fecha.getUTCMonth() + 1).padStart(2, "0")
  const day = String(fecha.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function sumarDiasISO(isoDate: string, dias: number): string {
  const fecha = new Date(`${isoDate}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return isoDesdeNoonUTC(fecha)
}

function formatearDDMMYYYY(isoDate: string): string {
  const [anio, mes, dia] = isoDate.split("-")
  return `${dia}/${mes}/${anio}`
}

function fusionarItems(items: ItemConsolidado[]): ItemConsolidado[] {
  const mapa = new Map<string, ItemConsolidado>()

  for (const item of items) {
    const existente = mapa.get(item.nombre)

    if (existente) {
      existente.cantidad += item.cantidad
      continue
    }

    mapa.set(item.nombre, { ...item })
  }

  return Array.from(mapa.values())
}

function fusionarPacking(filas: FilaPacking[]): FilaPacking[] {
  const mapa = new Map<string, PackingAcumuladorSemana>()

  for (const fila of filas) {
    let acumulador = mapa.get(fila.empresa)

    if (!acumulador) {
      acumulador = {
        empresa: fila.empresa,
        totalRaciones: 0,
        tipoEmpaquetado: fila.tipoEmpaquetado,
        detalles: new Map<string, number>(),
      }
      mapa.set(fila.empresa, acumulador)
    }

    acumulador.totalRaciones += fila.totalRaciones

    for (const detalle of fila.detalles) {
      acumulador.detalles.set(
        detalle.plato,
        (acumulador.detalles.get(detalle.plato) ?? 0) + detalle.cantidad
      )
    }
  }

  return Array.from(mapa.values()).map((acumulador) => ({
    empresa: acumulador.empresa,
    totalRaciones: acumulador.totalRaciones,
    tipoEmpaquetado: acumulador.tipoEmpaquetado,
    detalles: Array.from(acumulador.detalles.entries()).map(([plato, cantidad]) => ({
      plato,
      cantidad,
    })),
  }))
}

export async function getConsolidadoSemana(fecha?: Date): Promise<ConsolidadoSemana> {
  const fechaISOReferencia = fecha ? toChileISODate(fecha) : nowChile().iso

  const refNoon = new Date(`${fechaISOReferencia}T12:00:00Z`)
  const diaSemana = refNoon.getUTCDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
  const diasARetroceder = diaSemana === 0 ? 6 : diaSemana - 1
  const lunesISO = sumarDiasISO(fechaISOReferencia, -diasARetroceder)

  const diasSemanaISO = Array.from({ length: 7 }, (_, i) => sumarDiasISO(lunesISO, i))
  const domingoISO = diasSemanaISO[6]

  const resultados = await Promise.all(
    diasSemanaISO.map((iso) => getConsolidadoDia(new Date(`${iso}T12:00:00Z`)))
  )

  const zonaFria = fusionarItems(resultados.flatMap((r) => r.zonaFria))
  const zonaCaliente = fusionarItems(resultados.flatMap((r) => r.zonaCaliente))
  const packing = fusionarPacking(resultados.flatMap((r) => r.packing))

  const totalPedidos = resultados.reduce((acc, r) => acc + r.resumenGeneral.totalPedidos, 0)
  const totalRacionesManuales = resultados.reduce(
    (acc, r) => acc + r.resumenGeneral.totalRacionesManuales,
    0
  )
  const totalRacionesGlobal = resultados.reduce(
    (acc, r) => acc + r.resumenGeneral.totalRacionesGlobal,
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

  const breakdown: BreakdownDia[] = diasSemanaISO.map((iso, index) => {
    const resultado = resultados[index]
    const dia = iso.slice(8, 10)
    const mes = iso.slice(5, 7)

    return {
      fecha: `${getChileDayName(iso)} ${dia}/${mes}`,
      fechaISO: iso,
      zonaFriaCount: resultado.zonaFria.reduce((s, i) => s + i.cantidad, 0),
      zonaCalienteCount: resultado.zonaCaliente.reduce((s, i) => s + i.cantidad, 0),
      totalPedidos: resultado.resumenGeneral.totalPedidos,
    }
  })

  const semana = `${formatearDDMMYYYY(lunesISO)} – ${formatearDDMMYYYY(domingoISO)}`

  return {
    semana,
    zonaFria,
    zonaCaliente,
    packing,
    resumenGeneral: {
      totalPedidos,
      totalRacionesManuales,
      totalRacionesGlobal,
      empresaTopNombre,
      empresaTopCantidad,
    },
    breakdown,
  }
}
