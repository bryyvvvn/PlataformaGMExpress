// src/components/CalendarioSemanal.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { THEME } from '../constants/theme';

interface CalendarioSemanalProps {
  getSemanaTexto: () => string;
  setSemanaOffset: (offset: number) => void;
  diasSemanaArray: any[];
  fechasBloqueadas: Set<string>;
  diasBloqueadosAdmin: number[];
  todosBloqueados: boolean;
  setDiaSeleccionadoIdx: (idx: number) => void;
  fechasHorarioBloqueado?: Set<string>;
}

export const CalendarioSemanal: React.FC<CalendarioSemanalProps> = ({
  getSemanaTexto,
  setSemanaOffset,
  diasSemanaArray,
  fechasBloqueadas,
  diasBloqueadosAdmin,
  todosBloqueados,
  setDiaSeleccionadoIdx,
  fechasHorarioBloqueado,
}) => {
  return (
    <div className="mt-10 px-6 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setSemanaOffset(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50">
          <ChevronLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase text-[#1d2d50] opacity-60">
          {getSemanaTexto()}
        </span>
        <button onClick={() => setSemanaOffset(1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Estilo para ocultar la barra de scroll nativa pero mantener la funcionalidad */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Contenedor con Scroll Horizontal Suave */}
      <div 
        className="flex items-center overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 pt-2 -mx-2 px-2"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none', 
          gap: 'calc(15% / 4)' // Mantiene el espaciado perfecto original de los 5 días
        }} 
      >
        {diasSemanaArray.map((dia, index) => {
          const tienePedido = fechasBloqueadas.has(dia.iso);
          const numDiaMenu = new Date(dia.iso + 'T12:00:00').getDay();
          const esBloqueadoPerm = diasBloqueadosAdmin.includes(numDiaMenu);
          const visualmenteBloqueado = dia.bloqueado || esBloqueadoPerm;
          const esBloqueadoPorHorario = !tienePedido && (fechasHorarioBloqueado?.has(dia.iso) ?? false);
          const isSelectedAndValid = dia.esSeleccionado && !todosBloqueados;
          const noSeleccionable = (visualmenteBloqueado && !tienePedido) || esBloqueadoPorHorario;

          return (
            <button
              key={index}
              onClick={() => { if (!noSeleccionable) setDiaSeleccionadoIdx(index); }}
              className={['flex flex-col items-center justify-center shrink-0 w-[17%] aspect-square rounded-[20px] transition-all snap-center',
                isSelectedAndValid ? 'border-2 scale-110 shadow-md' : 'border shadow-sm',
                tienePedido ? 'bg-green-50 border-green-200' : (visualmenteBloqueado || esBloqueadoPorHorario ? 'bg-gray-100 border-gray-200 text-gray-300' : 'bg-white border-gray-200'),
                noSeleccionable ? 'cursor-not-allowed' : 'cursor-pointer'
              ].join(' ')}
              style={isSelectedAndValid ? { borderColor: THEME.colors.primary } : {}}
            >
              <span className={`text-[10px] font-black mb-1 uppercase ${tienePedido ? 'text-[#70a344]' : 'text-gray-400'}`}>
                {dia.letra}
              </span>
              {esBloqueadoPorHorario ? (
                <Lock size={16} className="text-gray-400" />
              ) : (
                <span className="text-lg font-black" style={{ color: tienePedido || isSelectedAndValid ? THEME.colors.primary : (visualmenteBloqueado ? '#a0a0a0' : '#1d2d50') }}>
                  {dia.numero}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};