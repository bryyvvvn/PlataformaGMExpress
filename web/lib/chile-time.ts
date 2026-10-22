export const CHILE_TZ = 'America/Santiago';

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
    month:  get('month'),
    day:    get('day'),
    hour:   get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function chileUtcOffset(d: Date): number {
  const { year, month, day } = chileComponents(d);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return 12 - chileComponents(noonUtc).hour;
}

export function chileStartOfDay(isoDate?: string): Date {
  const ref = isoDate ? new Date(`${isoDate}T12:00:00Z`) : new Date();
  const { year, month, day } = chileComponents(ref);
  const offset = chileUtcOffset(ref);
  return new Date(Date.UTC(year, month - 1, day, offset, 0, 0));
}

export function chileEndOfDay(isoDate?: string): Date {
  const start = chileStartOfDay(isoDate);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1000);
}

export function nowChile(): {
  iso: string;
  hour: number;
  minute: number;
  dayName: string;
} {
  const now = new Date();
  const c   = chileComponents(now);
  const iso = `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;

  const dayFmt = new Intl.DateTimeFormat('es-CL', {
    timeZone: CHILE_TZ,
    weekday:  'long',
  });
  const rawDay = dayFmt.format(now);
  const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);

  return { iso, hour: c.hour, minute: c.minute, dayName };
}

export function isDeadlinePassed(deadlineHour: number, deadlineMinute = 0): boolean {
  const { hour, minute } = nowChile();
  return (
    hour > deadlineHour ||
    (hour === deadlineHour && minute >= deadlineMinute)
  );
}

export function getChileDayName(isoDate: string): string {
  const ref    = new Date(`${isoDate}T12:00:00Z`);
  const dayFmt = new Intl.DateTimeFormat('es-CL', {
    timeZone: CHILE_TZ,
    weekday:  'long',
  });
  const rawDay = dayFmt.format(ref);
  return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
}

export function getChileHour(date: Date): number {
  return chileComponents(date).hour;
}