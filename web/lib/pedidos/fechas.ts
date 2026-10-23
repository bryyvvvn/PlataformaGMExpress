import { CHILE_TZ, chileStartOfDay, nowChile } from "@/lib/chile-time"

export const DIAS_HABILES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const

export type DiaHabil = (typeof DIAS_HABILES)[number]

export type DiaLaboral = {
  dia: DiaHabil
  fecha: string
  fechaISO: string
  inicio: Date
  fin: Date
}

function parseFechaISO(fechaISO: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    throw new Error(`Fecha ISO inválida: ${fechaISO}`)
  }

  const [year, month, day] = fechaISO.split("-").map(Number)
  const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  if (
    fecha.getUTCFullYear() !== year ||
    fecha.getUTCMonth() !== month - 1 ||
    fecha.getUTCDate() !== day
  ) {
    throw new Error(`Fecha calendario inválida: ${fechaISO}`)
  }

  return fecha
}

function sumarDiasISO(fechaISO: string, cantidad: number): string {
  const fecha = parseFechaISO(fechaISO)
  fecha.setUTCDate(fecha.getUTCDate() + cantidad)
  return fecha.toISOString().slice(0, 10)
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function nombreMes(fechaISO: string): string {
  return capitalizar(
    new Intl.DateTimeFormat("es-CL", {
      month: "long",
      timeZone: CHILE_TZ,
    }).format(parseFechaISO(fechaISO))
  )
}

export function formatFechaISOChile(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha)

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? ""

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`
}

export function obtenerLunesSemanaActual(
  fechaReferenciaISO = nowChile().iso
): string {
  const fecha = parseFechaISO(fechaReferenciaISO)
  const diaSemana = fecha.getUTCDay() || 7

  return sumarDiasISO(fechaReferenciaISO, -(diaSemana - 1))
}

export function obtenerDiasLaboralesSemanaActual(
  fechaReferenciaISO = nowChile().iso
): DiaLaboral[] {
  const lunesISO = obtenerLunesSemanaActual(fechaReferenciaISO)

  return DIAS_HABILES.map((dia, indice) => {
    const fechaISO = sumarDiasISO(lunesISO, indice)
    const siguienteDiaISO = sumarDiasISO(fechaISO, 1)

    return {
      dia,
      fecha: fechaISO.slice(8, 10) + "/" + fechaISO.slice(5, 7),
      fechaISO,
      inicio: chileStartOfDay(fechaISO),
      fin: new Date(chileStartOfDay(siguienteDiaISO).getTime() - 1),
    }
  })
}

export function formatearRangoSemana(dias: DiaLaboral[]): string {
  const primero = dias[0]
  const ultimo = dias[dias.length - 1]

  if (!primero || !ultimo) {
    throw new Error("No hay días laborales para generar el rango semanal")
  }

  const [yearInicio, monthInicio, dayInicio] = primero.fechaISO
    .split("-")
    .map(Number)

  const [yearFin, monthFin, dayFin] = ultimo.fechaISO.split("-").map(Number)

  if (yearInicio === yearFin && monthInicio === monthFin) {
    return `Semana del ${dayInicio} al ${dayFin} de ${nombreMes(ultimo.fechaISO)}, ${yearFin}`
  }

  if (yearInicio === yearFin) {
    return `Semana del ${dayInicio} de ${nombreMes(primero.fechaISO)} al ${dayFin} de ${nombreMes(ultimo.fechaISO)}, ${yearFin}`
  }

  return `Semana del ${dayInicio} de ${nombreMes(primero.fechaISO)}, ${yearInicio} al ${dayFin} de ${nombreMes(ultimo.fechaISO)}, ${yearFin}`
}
