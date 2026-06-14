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
function getIndiceHoy(incluyeFines: boolean): number {
  const d = new Date().getDay(); 
  if (!incluyeFines) {
    if (d >= 1 && d <= 5) return d - 1; 
    return 0; // Si es sábado/domingo pero no tiene convenio, vuelve al Lunes
  } else {
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
    const hoy = new Date();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const txt = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
    }).format(hoy);

    const lunesReferencia = new Date(hoySoloFecha);
    const diaActual = lunesReferencia.getDay() === 0 ? 7 : lunesReferencia.getDay();
    lunesReferencia.setDate(lunesReferencia.getDate() - (diaActual - 1) + semanaOffset * 7);

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
