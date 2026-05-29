import { useState, useMemo } from 'react';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface DiaSemana {
  letra:        string;   // 'L', 'M', 'M', 'J', 'V'
  numero:       number;   // Día del mes (ej: 7)
  iso:          string;   // 'YYYY-MM-DD' — se pasa a useMenuAPI y a la API
  esHoy:        boolean;  // Si este día es el día real de hoy
  esSeleccionado: boolean; // Si el usuario tiene este día activo
  bloqueado:    boolean;  // Si el día/semana está bloqueado para pedidos (semanas pasadas)
}

// ─── HELPER ──────────────────────────────────────────────────────────────────

/** Retorna el índice 0–4 (Lunes–Viernes) del día de hoy.
 *  Si hoy es Sábado(6) o Domingo(0), devuelve 0 (Lunes) para no romper nada. */
function getIndiceHoy(): number {
  const d = new Date().getDay(); // 0=Dom, 1=Lun, …, 5=Vie, 6=Sab
  if (d >= 1 && d <= 5) return d - 1; // Lun→0, Mar→1, Mié→2, Jue→3, Vie→4
  return 0;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useCalendario = () => {
  const [semanaOffset, setSemanaOffset] = useState(0);

  /** Índice del día seleccionado (0=Lunes … 4=Viernes).
   *  Arranca en el día real de hoy (o Lunes si es fin de semana). */
  const [diaSeleccionadoIdx, setDiaSeleccionadoIdx] = useState<number>(getIndiceHoy);

  // ── Cálculo de los 5 días de la semana ──────────────────────────────────
  const { fechaTexto, diasSemanaArray } = useMemo(() => {
    const hoy = new Date();
    // Fecha local sin hora (para comparaciones de "esHoy")
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const txt = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      timeZone: 'America/Santiago',
    }).format(hoy);

    // Calcular el Lunes de la semana con el offset aplicado
    const lunesReferencia = new Date(hoySoloFecha);
    const diaActual = lunesReferencia.getDay() === 0 ? 7 : lunesReferencia.getDay();
    lunesReferencia.setDate(
      lunesReferencia.getDate() - (diaActual - 1) + semanaOffset * 7
    );

    const letras = ['L', 'M', 'M', 'J', 'V'];

    const array: DiaSemana[] = letras.map((letra, index) => {
      const fechaDia = new Date(lunesReferencia);
      fechaDia.setDate(lunesReferencia.getDate() + index);

      // Formato ISO local (sin conversión UTC para evitar off-by-one)
      const year  = fechaDia.getFullYear();
      const month = String(fechaDia.getMonth() + 1).padStart(2, '0');
      const day   = String(fechaDia.getDate()).padStart(2, '0');
      const iso   = `${year}-${month}-${day}`;

      return {
        letra,
        numero:         fechaDia.getDate(),
        iso,
        esHoy:          fechaDia.getTime() === hoySoloFecha.getTime(),
        esSeleccionado: index === diaSeleccionadoIdx,
        // Bloqueado si la semana es anterior a la semana actual
        bloqueado:       semanaOffset < 0,
      };
    });

    return { fechaTexto: txt, diasSemanaArray: array };
  }, [semanaOffset, diaSeleccionadoIdx]);

  // ── Fecha ISO del día actualmente seleccionado ───────────────────────────
  // Esta es la que se pasa a useMenuAPI → API → ?fecha=YYYY-MM-DD
  const fechaSeleccionadaISO: string = diasSemanaArray[diaSeleccionadoIdx]?.iso ?? '';

  // ── Cambiar semana: resetear selección al Lunes de la nueva semana ───────
  const cambiarSemana = (delta: number) => {
    setSemanaOffset(prev => prev + delta);
    setDiaSeleccionadoIdx(0); // Siempre arranca en Lunes al navegar semanas
  };

  const getSemanaTexto = (): string => {
    if (semanaOffset === 0)  return 'Esta semana';
    if (semanaOffset === 1)  return 'Próxima semana';
    if (semanaOffset > 1)    return `En ${semanaOffset} semanas`;
    if (semanaOffset === -1) return 'Semana pasada';
    return `Hace ${Math.abs(semanaOffset)} semanas`;
  };

  return {
    semanaOffset,
    setSemanaOffset: cambiarSemana,   // ← reemplaza al setter directo
    diaSeleccionadoIdx,
    setDiaSeleccionadoIdx,            // ← para que HomePage pueda cambiar el día activo
    fechaSeleccionadaISO,             // ← 'YYYY-MM-DD' del día seleccionado
    fechaTexto,
    diasSemanaArray,
    getSemanaTexto,
  };
};