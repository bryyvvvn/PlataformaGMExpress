// useCalendario.ts
import { useState, useMemo, useEffect } from 'react';

export interface DiaSemana {
  letra:        string;
  numero:       number;
  iso:          string;
  esHoy:        boolean;
  esSeleccionado: boolean;
  bloqueado:    boolean;
}

const diasSemanaLaboral = ['L', 'M', 'M', 'J', 'V'];
const diasSemanaCompleta = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// 🔥 Lo hacemos dinámico según si tiene o no fin de semana
// Obtener la fecha 'hoy' en la zona horaria de Chile para evitar cambios de día prematuros
function hoyChile(): Date {
  // Construimos una Date usando la representación local en America/Santiago
  // Esto evita que dispositivos en otras zonas horarias vean un día diferente
  const nowChileStr = new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' });
  return new Date(nowChileStr);
}

function getIndiceHoy(incluyeFines: boolean): number {
  const d = hoyChile().getDay();
  if (!incluyeFines) {
    // Lunes(1)-Viernes(5) => índices 0-4
    if (d >= 1 && d <= 5) return d - 1;
    // Sábado: mantener en el último índice laboral (Viernes) para que la semana
    // no avance hasta el domingo. Domingo: considerar como inicio de semana (0)
    if (d === 6) return 4; // Sábado -> índice Viernes
    return 0; // Domingo -> índice 0 (lunes del siguiente ciclo visual)
  } else {
    // Cuando incluye fines de semana, mapeamos Domingo(0) a índice 6
    if (d === 0) return 6; // Domingo es el índice 6 en una semana de 7 días
    return d - 1;
  }
}

export const useCalendario = (incluyeFinesDeSemana: boolean = false) => {
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [diaSeleccionadoIdx, setDiaSeleccionadoIdx] = useState<number>(() => getIndiceHoy(incluyeFinesDeSemana));

  // 🔥 Si le quitan el convenio y estaba en domingo, lo devolvemos al viernes
  useEffect(() => {
    if (!incluyeFinesDeSemana && diaSeleccionadoIdx > 4) {
      setDiaSeleccionadoIdx(0);
    }
  }, [incluyeFinesDeSemana, diaSeleccionadoIdx]);

  const { fechaTexto, diasSemanaArray } = useMemo(() => {
    const hoy = hoyChile();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const txt = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
    }).format(hoy);

    const lunesReferencia = new Date(hoySoloFecha);
    const diaActual = lunesReferencia.getDay() === 0 ? 7 : lunesReferencia.getDay();
    // Si no incluye fines y hoy es sábado, queremos que la semana referenciada
    // siga siendo la semana actual (no avanzar hasta el domingo).
    const ajusteDia = (!incluyeFinesDeSemana && diaActual === 6) ? 5 : diaActual;
    lunesReferencia.setDate(lunesReferencia.getDate() - (ajusteDia - 1) + semanaOffset * 7);

    // 🔥 GENERADOR DINÁMICO: 5 o 7 Días
    const letras = incluyeFinesDeSemana ? diasSemanaCompleta : diasSemanaLaboral;

    const array: DiaSemana[] = letras.map((letra, index) => {
      const fechaDia = new Date(lunesReferencia);
      fechaDia.setDate(lunesReferencia.getDate() + index);

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
        bloqueado:       semanaOffset < 0,
      };
    });

    return { fechaTexto: txt, diasSemanaArray: array };
  }, [semanaOffset, diaSeleccionadoIdx, incluyeFinesDeSemana]);

  const fechaSeleccionadaISO: string = diasSemanaArray[diaSeleccionadoIdx]?.iso ?? '';

  const cambiarSemana = (delta: number) => {
    setSemanaOffset(prev => prev + delta);
    setDiaSeleccionadoIdx(0);
  };

  const getSemanaTexto = (): string => {
    if (semanaOffset === 0)  return 'Esta semana';
    if (semanaOffset === 1)  return 'Próxima semana';
    if (semanaOffset > 1)    return `En ${semanaOffset} semanas`;
    if (semanaOffset === -1) return 'Semana pasada';
    return `Hace ${Math.abs(semanaOffset)} semanas`;
  };

  return { semanaOffset, setSemanaOffset: cambiarSemana, diaSeleccionadoIdx, setDiaSeleccionadoIdx, fechaSeleccionadaISO, fechaTexto, diasSemanaArray, getSemanaTexto };
};
