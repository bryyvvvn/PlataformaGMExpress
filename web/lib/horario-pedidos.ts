import { nowChile } from '@/lib/chile-time'

export type HorarioConfig = {
  horaLimite: string        // "HH:MM" — hora límite efectiva calculada
  horaDespacho: string | null // "HH:MM" — hora de despacho de la empresa
  fuenteHora: 'empresa' | 'global' // indica de dónde vino el límite
}

export type EstadoHorario = {
  permitido: boolean
  horaLimite: string
  fuenteHora: 'empresa' | 'global'
  mensaje: string
  horaReapertura: string  // "mañana a las HH:MM" o "el lunes a las HH:MM"
  fechaBloqueada: string | null  // ISO "YYYY-MM-DD" del día bloqueado, null si permitido
}

const DIAS_FIN_DE_SEMANA = ['Sábado', 'Domingo']

function restarHoras(horaHHMM: string, horas: number): string {
  const [h, m] = horaHHMM.split(':').map(Number)
  const totalMinutos = h * 60 + m - horas * 60
  const hResult = Math.floor(totalMinutos / 60)
  const mResult = totalMinutos % 60
  return `${String(hResult).padStart(2, '0')}:${String(mResult).padStart(2, '0')}`
}

export function getHoraLimiteEfectiva(horaDespacho: string | null, horaGlobal: string): HorarioConfig {
  if (horaDespacho !== null) {
    return {
      horaLimite: restarHoras(horaDespacho, 3),
      horaDespacho,
      fuenteHora: 'empresa',
    }
  }

  return {
    horaLimite: horaGlobal,
    horaDespacho: null,
    fuenteHora: 'global',
  }
}

export function getEstadoHorario(horaDespacho: string | null, horaGlobal: string): EstadoHorario {
  const { horaLimite, fuenteHora } = getHoraLimiteEfectiva(horaDespacho, horaGlobal)
  const { hour, minute, dayName, iso } = nowChile()
  const horaActual = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const esFinDeSemana = DIAS_FIN_DE_SEMANA.includes(dayName)
  const limiteSuperado = horaActual >= horaLimite
  const permitido = !esFinDeSemana && !limiteSuperado

  const horaReapertura = dayName === 'Viernes' || esFinDeSemana
    ? `el lunes a las ${horaLimite}`
    : `mañana a las ${horaLimite}`

  let mensaje: string
  if (esFinDeSemana) {
    mensaje = `Hoy es ${dayName.toLowerCase()} y no se reciben pedidos. Podrás realizar tu pedido ${horaReapertura}.`
  } else if (limiteSuperado) {
    mensaje = `El horario de pedidos de hoy ya finalizó (límite ${horaLimite}). Podrás realizar tu pedido ${horaReapertura}.`
  } else {
    mensaje = `Puedes realizar tu pedido hasta las ${horaLimite}.`
  }

  const fechaBloqueada = permitido ? null : iso

  return { permitido, horaLimite, fuenteHora, mensaje, horaReapertura, fechaBloqueada }
}
