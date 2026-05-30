import { CHILE_TZ } from "@/lib/chile-time"

export const HORA_CIERRE_PEDIDOS = "10:00"

export const MENSAJE_DISPONIBILIDAD_HISTORICO =
  `Disponible después del cierre de pedidos: ${HORA_CIERRE_PEDIDOS} hrs.`

export const ERROR_HISTORICO_ANTES_CIERRE =
  `El histórico estará disponible después del cierre de pedidos de las ${HORA_CIERRE_PEDIDOS} hrs`

export const ERROR_HISTORICO_FECHA_FUTURA =
  "No se puede exportar el histórico de una fecha futura"

type MotivoDisponibilidadHistorico =
  | "DISPONIBLE"
  | "FECHA_INVALIDA"
  | "FIN_DE_SEMANA"
  | "FECHA_FUTURA"
  | "ANTES_DEL_CIERRE"

export type DisponibilidadHistorico = {
  permitido: boolean
  motivo: MotivoDisponibilidadHistorico
  mensaje: string | null
}

function parseFechaISO(fechaISO: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return null

  const [year, month, day] = fechaISO.split("-").map(Number)
  const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  if (
    fecha.getUTCFullYear() !== year ||
    fecha.getUTCMonth() !== month - 1 ||
    fecha.getUTCDate() !== day
  ) {
    return null
  }

  return fecha
}

function obtenerParte(partes: Intl.DateTimeFormatPart[], tipo: string): string {
  return partes.find((parte) => parte.type === tipo)?.value ?? ""
}

function obtenerFechaHoraChile(referencia: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(referencia)

  const hour = Number(obtenerParte(partes, "hour"))
  const minute = Number(obtenerParte(partes, "minute"))

  return {
    fechaISO: [
      obtenerParte(partes, "year"),
      obtenerParte(partes, "month"),
      obtenerParte(partes, "day"),
    ].join("-"),
    minutosDelDia: hour * 60 + minute,
  }
}

function obtenerMinutosCierre(): number {
  const [hour, minute] = HORA_CIERRE_PEDIDOS.split(":").map(Number)
  return hour * 60 + minute
}

export function esFechaISOValida(fechaISO: string): boolean {
  return parseFechaISO(fechaISO) !== null
}

export function esDiaLaboral(fechaISO: string): boolean {
  const fecha = parseFechaISO(fechaISO)
  if (!fecha) return false

  const diaSemana = fecha.getUTCDay()
  return diaSemana >= 1 && diaSemana <= 5
}

export function obtenerDisponibilidadDespuesCierre(
  fechaISO: string,
  referencia = new Date()
): DisponibilidadHistorico {
  if (!esFechaISOValida(fechaISO)) {
    return {
      permitido: false,
      motivo: "FECHA_INVALIDA",
      mensaje: "La fecha seleccionada no es válida",
    }
  }

  if (!esDiaLaboral(fechaISO)) {
    return {
      permitido: false,
      motivo: "FIN_DE_SEMANA",
      mensaje: "El histórico solo está disponible para días laborales",
    }
  }

  const ahoraChile = obtenerFechaHoraChile(referencia)

  if (fechaISO < ahoraChile.fechaISO) {
    return { permitido: true, motivo: "DISPONIBLE", mensaje: null }
  }

  if (fechaISO > ahoraChile.fechaISO) {
    return {
      permitido: false,
      motivo: "FECHA_FUTURA",
      mensaje: ERROR_HISTORICO_FECHA_FUTURA,
    }
  }

  if (ahoraChile.minutosDelDia < obtenerMinutosCierre()) {
    return {
      permitido: false,
      motivo: "ANTES_DEL_CIERRE",
      mensaje: MENSAJE_DISPONIBILIDAD_HISTORICO,
    }
  }

  return { permitido: true, motivo: "DISPONIBLE", mensaje: null }
}

export function obtenerDisponibilidadHistorico(
  fechaISO: string,
  referencia = new Date()
): DisponibilidadHistorico {
  return obtenerDisponibilidadDespuesCierre(fechaISO, referencia)
}

export function puedeExportarHistorico(
  fechaISO: string,
  referencia = new Date()
): boolean {
  return obtenerDisponibilidadHistorico(fechaISO, referencia).permitido
}
