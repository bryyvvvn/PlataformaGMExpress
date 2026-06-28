import { describe, it, expect } from 'vitest'
import {
  getHoraLimiteEfectiva,
  getEstadoHorario,
} from '../lib/horario-pedidos'

type ContextoTest = {
  hour: number
  minute: number
  dayName: string
  iso: string
}

describe('getHoraLimiteEfectiva', () => {
  it('usa horaGlobal cuando horaDespacho es null', () => {
    const result = getHoraLimiteEfectiva(null, '10:00')
    expect(result.horaLimite).toBe('10:00')
    expect(result.fuenteHora).toBe('global')
    expect(result.horaDespacho).toBeNull()
  })

  it('resta 3 horas a horaDespacho', () => {
    const result = getHoraLimiteEfectiva('12:00', '10:00')
    expect(result.horaLimite).toBe('09:00')
    expect(result.fuenteHora).toBe('empresa')
  })

  it('resta 3 horas correctamente con minutos', () => {
    const result = getHoraLimiteEfectiva('12:30', '10:00')
    expect(result.horaLimite).toBe('09:30')
  })

  it('maneja hora de despacho temprana (06:00 → 03:00)', () => {
    const result = getHoraLimiteEfectiva('06:00', '10:00')
    expect(result.horaLimite).toBe('03:00')
  })

  it('ignora horaGlobal cuando horaDespacho está definida', () => {
    const result = getHoraLimiteEfectiva('15:00', '10:00')
    expect(result.horaLimite).toBe('12:00')
    expect(result.fuenteHora).toBe('empresa')
  })
})

describe('getEstadoHorario — día hábil dentro de horario', () => {
  const contextoLunesMañana: ContextoTest = {
    hour: 8,
    minute: 0,
    dayName: 'Lunes',
    iso: '2026-06-15',
  }

  it('permite pedido cuando hora actual < hora límite', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoLunesMañana)
    expect(result.permitido).toBe(true)
    expect(result.fechaBloqueada).toBeNull()
  })

  it('mensaje correcto cuando está permitido', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoLunesMañana)
    expect(result.mensaje).toContain('hasta las 10:00')
  })
})

describe('getEstadoHorario — día hábil límite superado', () => {
  const contextoLunesTarde: ContextoTest = {
    hour: 11,
    minute: 0,
    dayName: 'Lunes',
    iso: '2026-06-15',
  }

  it('bloquea cuando hora actual >= hora límite', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoLunesTarde)
    expect(result.permitido).toBe(false)
    expect(result.fechaBloqueada).toBe('2026-06-15')
  })

  it('horaReapertura dice mañana en día lunes-jueves', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoLunesTarde)
    expect(result.horaReapertura).toBe('mañana a las 10:00')
  })

  it('bloquea exactamente a la hora límite (>=)', () => {
    const contextoExacto: ContextoTest = {
      hour: 10,
      minute: 0,
      dayName: 'Martes',
      iso: '2026-06-16',
    }
    const result = getEstadoHorario(null, '10:00', false, contextoExacto)
    expect(result.permitido).toBe(false)
  })
})

describe('getEstadoHorario — viernes', () => {
  const contextoViernesTarde: ContextoTest = {
    hour: 11,
    minute: 0,
    dayName: 'Viernes',
    iso: '2026-06-20',
  }

  it('horaReapertura dice el lunes cuando es viernes', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoViernesTarde)
    expect(result.horaReapertura).toBe('el lunes a las 10:00')
  })

  it('horaReapertura dice mañana cuando es viernes y trabajaFinDeSemana', () => {
    const result = getEstadoHorario(null, '10:00', true, contextoViernesTarde)
    expect(result.horaReapertura).toBe('mañana a las 10:00')
    expect(result.permitido).toBe(false) // bloqueado por hora, no por día
  })
})

describe('getEstadoHorario — fin de semana sin convenio', () => {
  const contextoSabado: ContextoTest = {
    hour: 9,
    minute: 0,
    dayName: 'Sábado',
    iso: '2026-06-21',
  }

  const contextoDomingo: ContextoTest = {
    hour: 9,
    minute: 0,
    dayName: 'Domingo',
    iso: '2026-06-22',
  }

  it('bloquea pedido en sábado', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoSabado)
    expect(result.permitido).toBe(false)
    expect(result.fechaBloqueada).toBe('2026-06-21')
  })

  it('bloquea pedido en domingo', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoDomingo)
    expect(result.permitido).toBe(false)
  })

  it('horaReapertura dice el lunes en sábado', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoSabado)
    expect(result.horaReapertura).toBe('el lunes a las 10:00')
  })

  it('mensaje menciona el día en fin de semana', () => {
    const result = getEstadoHorario(null, '10:00', false, contextoSabado)
    expect(result.mensaje).toContain('sábado')
  })
})

describe('getEstadoHorario — fin de semana con convenio trabajaFinDeSemana', () => {
  const contextoSabadoMañana: ContextoTest = {
    hour: 8,
    minute: 0,
    dayName: 'Sábado',
    iso: '2026-06-21',
  }

  const contextoDomingoTarde: ContextoTest = {
    hour: 11,
    minute: 0,
    dayName: 'Domingo',
    iso: '2026-06-22',
  }

  it('permite sábado dentro de horario cuando trabajaFinDeSemana', () => {
    const result = getEstadoHorario(null, '10:00', true, contextoSabadoMañana)
    expect(result.permitido).toBe(true)
    expect(result.fechaBloqueada).toBeNull()
  })

  it('bloquea domingo por hora (no por día) cuando trabajaFinDeSemana', () => {
    const result = getEstadoHorario(null, '10:00', true, contextoDomingoTarde)
    expect(result.permitido).toBe(false)
    expect(result.fechaBloqueada).toBe('2026-06-22')
    expect(result.mensaje).not.toContain('domingo')
  })
})

describe('getEstadoHorario — con horaDespacho de empresa', () => {
  it('calcula hora límite desde despacho de empresa', () => {
    const contexto: ContextoTest = {
      hour: 8,
      minute: 0,
      dayName: 'Lunes',
      iso: '2026-06-15',
    }
    const result = getEstadoHorario('12:00', '10:00', false, contexto)
    expect(result.horaLimite).toBe('09:00')
    expect(result.fuenteHora).toBe('empresa')
    expect(result.permitido).toBe(true)
  })

  it('bloquea cuando supera hora calculada desde despacho', () => {
    const contexto: ContextoTest = {
      hour: 10,
      minute: 0,
      dayName: 'Martes',
      iso: '2026-06-16',
    }
    const result = getEstadoHorario('12:00', '10:00', false, contexto)
    expect(result.horaLimite).toBe('09:00')
    expect(result.permitido).toBe(false)
  })
})
