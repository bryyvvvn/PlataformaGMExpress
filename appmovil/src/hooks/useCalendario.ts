import { useState, useMemo } from 'react';

export const useCalendario = () => {
  const [semanaOffset, setSemanaOffset] = useState(0);

  const { fechaTexto, diasSemanaArray } = useMemo(() => {
    const hoy = new Date();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    // Texto de cabecera para el saludo
    const txt = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      timeZone: 'America/Santiago'
    }).format(hoy);

    // Calcular el lunes de la semana basado en el offset
    const lunesReferencia = new Date(hoySoloFecha);
    const diaActual = lunesReferencia.getDay() === 0 ? 7 : lunesReferencia.getDay();
    lunesReferencia.setDate(lunesReferencia.getDate() - (diaActual - 1) + (semanaOffset * 7));
    
    const letras = ['L', 'M', 'M', 'J', 'V'];
    const array = letras.map((letra, index) => {
      const fechaDia = new Date(lunesReferencia);
      fechaDia.setDate(lunesReferencia.getDate() + index);
      
      return { 
        letra, 
        numero: fechaDia.getDate(), 
        esHoy: fechaDia.getTime() === hoySoloFecha.getTime()
      };
    });

    return { fechaTexto: txt, diasSemanaArray: array };
  }, [semanaOffset]);

  const getSemanaTexto = () => {
    if (semanaOffset === 0) return "Esta semana";
    if (semanaOffset === 1) return "Próxima semana";
    if (semanaOffset > 1) return `En ${semanaOffset} semanas`;
    if (semanaOffset === -1) return "Semana pasada";
    return `Hace ${Math.abs(semanaOffset)} semanas`;
  };

  return {
    semanaOffset,
    setSemanaOffset,
    fechaTexto,
    diasSemanaArray,
    getSemanaTexto
  };
};