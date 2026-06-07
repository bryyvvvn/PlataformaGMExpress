import { CategoriaPlato, EstadoPedido } from "@prisma/client"
import db from "@/lib/db"
import {
  formatearRangoSemana,
  formatFechaISOChile,
  obtenerDiasLaboralesSemanaActual,
} from "@/lib/pedidos/fechas"

export type MenuConsolidado = {
  key: string
  platoId: number
  guarnicionId: number | null
  nombre: string
  confirmadas: number
  enProduccion: number
  total: number
}

export type EmpresaDia = {
  id: number
  nombre: string
  menus: MenuConsolidado[]
  confirmadas: number
  enProduccion: number
  total: number
}

export type DiaData = {
  dia: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes"
  fecha: string
  fechaISO: string
  empresas: EmpresaDia[]
  confirmadas: number
  enProduccion: number
  total: number
}

export type SemanaConsolidada = {
  rango: string
  dias: DiaData[]
  total: number
  confirmadas: number
  enProduccion: number
  empresasActivas: number
}

type EmpresaAcumulada = {
  id: number
  nombre: string
  menus: Map<string, MenuConsolidado>
}

type DiaAcumulado = {
  dia: DiaData["dia"]
  fecha: string
  fechaISO: string
  empresas: Map<number, EmpresaAcumulada>
}

function crearMenuKey(platoId: number, guarnicionId: number | null): string {
  return `${platoId}:${guarnicionId ?? "sin-guarnicion"}`
}

function sumarTotalesMenus(menus: MenuConsolidado[]) {
  return menus.reduce(
    (totales, menu) => ({
      confirmadas: totales.confirmadas + menu.confirmadas,
      enProduccion: totales.enProduccion + menu.enProduccion,
      total: totales.total + menu.total,
    }),
    { confirmadas: 0, enProduccion: 0, total: 0 }
  )
}

export async function obtenerConsolidadoSemana(): Promise<SemanaConsolidada> {
  const diasLaborales = obtenerDiasLaboralesSemanaActual()
  const primerDia = diasLaborales[0]
  const ultimoDia = diasLaborales[diasLaborales.length - 1]

  if (!primerDia || !ultimoDia) {
    throw new Error("No se pudo calcular la semana laboral")
  }

  const pedidos = await db.pedido.findMany({
    where: {
      fecha: {
        gte: primerDia.inicio,
        lte: ultimoDia.fin,
      },
      estado: {
        in: [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PRODUCCION],
      },
    },
    select: {
      id: true,
      fecha: true,
      estado: true,
      empresa: {
        select: {
          id: true,
          nombre: true,
        },
      },
      detalles: {
        orderBy: {
          id: "asc",
        },
        select: {
          platoId: true,
          cantidad: true,
          guarnicionId: true,
          plato: {
            select: {
              nombre: true,
              categoria: true,
            },
          },
          guarnicion: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
  })

  const diasAcumulados = new Map<string, DiaAcumulado>(
    diasLaborales.map((dia) => [
      dia.fechaISO,
      {
        dia: dia.dia,
        fecha: dia.fecha,
        fechaISO: dia.fechaISO,
        empresas: new Map<number, EmpresaAcumulada>(),
      },
    ])
  )

  for (const pedido of pedidos) {
    const fechaISO = formatFechaISOChile(pedido.fecha)
    const dia = diasAcumulados.get(fechaISO)

    if (!dia) {
      console.warn(
        `[gestion-pedidos] Pedido ${pedido.id} fuera de los días laborales calculados`
      )
      continue
    }

    const fondos = pedido.detalles.filter(
      (detalle) => detalle.plato.categoria === CategoriaPlato.FONDO
    )

    if (fondos.length === 0) {
      console.warn(
        `[gestion-pedidos] Pedido ${pedido.id} sin detalle FONDO; omitido del consolidado`
      )
      continue
    }

    if (fondos.length > 1) {
      console.warn(
        `[gestion-pedidos] Pedido ${pedido.id} tiene múltiples fondos; se utilizará el primero`
      )
    }

    const fondo = fondos[0]
    const key = crearMenuKey(fondo.platoId, fondo.guarnicionId)
    const nombre = fondo.guarnicion
      ? `${fondo.plato.nombre} + ${fondo.guarnicion.nombre}`
      : fondo.plato.nombre

    let empresa = dia.empresas.get(pedido.empresa.id)

    if (!empresa) {
      empresa = {
        id: pedido.empresa.id,
        nombre: pedido.empresa.nombre,
        menus: new Map<string, MenuConsolidado>(),
      }

      dia.empresas.set(empresa.id, empresa)
    }

    let menu = empresa.menus.get(key)

    if (!menu) {
      menu = {
        key,
        platoId: fondo.platoId,
        guarnicionId: fondo.guarnicionId,
        nombre,
        confirmadas: 0,
        enProduccion: 0,
        total: 0,
      }

      empresa.menus.set(key, menu)
    }

    if (pedido.estado === EstadoPedido.CONFIRMADO) {
      menu.confirmadas += fondo.cantidad
    }

    if (pedido.estado === EstadoPedido.EN_PRODUCCION) {
      menu.enProduccion += fondo.cantidad
    }

    menu.total += fondo.cantidad
  }

  const dias: DiaData[] = diasLaborales.map((diaLaboral) => {
    const diaAcumulado = diasAcumulados.get(diaLaboral.fechaISO)

    if (!diaAcumulado) {
      throw new Error(`No se encontró el día ${diaLaboral.fechaISO}`)
    }

    const empresas = Array.from(diaAcumulado.empresas.values())
      .map((empresa): EmpresaDia => {
        const menus = Array.from(empresa.menus.values()).sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es")
        )

        return {
          id: empresa.id,
          nombre: empresa.nombre,
          menus,
          ...sumarTotalesMenus(menus),
        }
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))

    const totalesDia = empresas.reduce(
      (totales, empresa) => ({
        confirmadas: totales.confirmadas + empresa.confirmadas,
        enProduccion: totales.enProduccion + empresa.enProduccion,
        total: totales.total + empresa.total,
      }),
      { confirmadas: 0, enProduccion: 0, total: 0 }
    )

    return {
      dia: diaAcumulado.dia,
      fecha: diaAcumulado.fecha,
      fechaISO: diaAcumulado.fechaISO,
      empresas,
      ...totalesDia,
    }
  })

  const totalesSemana = dias.reduce(
    (totales, dia) => ({
      confirmadas: totales.confirmadas + dia.confirmadas,
      enProduccion: totales.enProduccion + dia.enProduccion,
      total: totales.total + dia.total,
    }),
    { confirmadas: 0, enProduccion: 0, total: 0 }
  )

  const empresasActivas = new Set(
    dias.flatMap((dia) => dia.empresas.map((empresa) => empresa.id))
  ).size

  return {
    rango: formatearRangoSemana(diasLaborales),
    dias,
    empresasActivas,
    ...totalesSemana,
  }
}
