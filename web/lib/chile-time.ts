/**
 *
 * Utilidad centralizada para manejo de zona horaria Chile (America/Santiago).
 * Chile opera en UTC-3 (verano/DST) y UTC-4 (invierno).
 *
 * ESCALABILIDAD:
 * - Todos los endpoints importan desde aquí. Cualquier ajuste de zona horaria
 *   se hace en un solo lugar.
 * - Para el Panel Admin: para leer el DEADLINE desde BD, solo cambia
 *   `isDeadlinePassed()` — el resto del sistema no necesita modificarse.
 */

export const CHILE_TZ = 'America/Santiago';

// ─── HELPER INTERNO ───────────────────────────────────────────────────────────

/**
 * Extrae los componentes de fecha/hora de un Date en zona horaria Chile.
 * Retorna valores numéricos: year, month (1-12), day, hour, minute, second.
 */
function chileComponents(d: Date): {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number;
} {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHILE_TZ,
    year:    'numeric',
    month:   '2-digit',
    day:     '2-digit',
    hour:    '2-digit',
    minute:  '2-digit',
    second:  '2-digit',
    hour12:  false,
  });
  const parts = fmt.formatToParts(d);
  const get   = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0');
  return {
    year:   get('year'),
    month:  get('month'),   // 1-12
    day:    get('day'),
    hour:   get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Calcula el offset UTC de Chile en un Date dado.
 * Estrategia: al mediodía UTC, Chile muestra entre las 8 y las 9.
 * offset = 12 - hora_chile_al_mediodia → 3 (verano) o 4 (invierno).
 */
function chileUtcOffset(d: Date): number {
  const { year, month, day } = chileComponents(d);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return 12 - chileComponents(noonUtc).hour;
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/**
 * Retorna un Date UTC que representa las 00:00:00 del día dado en Chile.
 *
 * @param isoDate - 'YYYY-MM-DD' del día en Chile. Sin argumento: día actual Chile.
 *
 * Ejemplo: '2026-05-11' → Date equivalente a 2026-05-11T03:00:00Z (UTC-3)
 */
export function chileStartOfDay(isoDate?: string): Date {
  const ref = isoDate ? new Date(`${isoDate}T12:00:00Z`) : new Date();
  const { year, month, day } = chileComponents(ref);
  const offset = chileUtcOffset(ref);
  return new Date(Date.UTC(year, month - 1, day, offset, 0, 0));
}

/**
 * Retorna un Date UTC que representa las 23:59:59 del día dado en Chile.
 *
 * @param isoDate - 'YYYY-MM-DD'. Sin argumento: día actual Chile.
 */
export function chileEndOfDay(isoDate?: string): Date {
  const start = chileStartOfDay(isoDate);
  // +24h -1s = fin del mismo día calendario en Chile
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1000);
}

/**
 * Retorna los datos del momento actual en zona horaria Chile.
 *
 * Uso típico:
 *   const { iso, hour, minute, dayName } = nowChile();
 *   // iso      → '2026-05-11'
 *   // hour     → 9   (hora actual en Chile)
 *   // dayName  → 'Lunes'
 */
export function nowChile(): {
  iso:     string;   // 'YYYY-MM-DD' en Chile
  hour:    number;   // 0-23
  minute:  number;   // 0-59
  dayName: string;   // 'Lunes', 'Martes', …
} {
  const now = new Date();
  const c   = chileComponents(now);
  const iso = `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;

  const dayFmt = new Intl.DateTimeFormat('es-CL', {
    timeZone: CHILE_TZ,
    weekday:  'long',
  });
  const rawDay = dayFmt.format(now);
  // Capitalizar: 'lunes' → 'Lunes'
  const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);

  return { iso, hour: c.hour, minute: c.minute, dayName };
}

/**
 * Indica si la hora actual en Chile superó el deadline configurado.
 *
 * Sprint actual: deadlineHour viene de variable de entorno DEADLINE_HOUR.
 * Sprint N (Panel Admin): este helper recibe el valor leído desde BD.
 *   Solo cambia el llamador — esta función no necesita modificarse.
 *
 * @param deadlineHour   - Hora límite en formato 24h (ej: 10 para las 10:00)
 * @param deadlineMinute - Minuto límite (default 0)
 */
export function isDeadlinePassed(deadlineHour: number, deadlineMinute = 0): boolean {
  const { hour, minute } = nowChile();
  return (
    hour > deadlineHour ||
    (hour === deadlineHour && minute >= deadlineMinute)
  );
}

/**
 * Retorna el nombre del día en español para una fecha ISO dada, en zona horaria Chile.
 *
 * Uso: getChileDayName('2026-05-11') → 'Lunes'
 *
 * Se usa en menu-semanal para filtrar por dia_semana.
 */
export function getChileDayName(isoDate: string): string {
  // Mediodía UTC → siempre dentro del día correcto en Chile (9am o 8am Chile)
  const ref    = new Date(`${isoDate}T12:00:00Z`);
  const dayFmt = new Intl.DateTimeFormat('es-CL', {
    timeZone: CHILE_TZ,
    weekday:  'long',
  });
  const rawDay = dayFmt.format(ref);
  return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
}

/**
 * Retorna la hora (0-23) de un Date en zona horaria Chile.
 *
 * Uso: getChileHour(pedido.fecha) → 14
 */
export function getChileHour(date: Date): number {
  return chileComponents(date).hour;
}