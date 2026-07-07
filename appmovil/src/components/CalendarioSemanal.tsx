import React from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import type { EstadoFechas } from '../hooks/useHistorial';

interface CalendarioSemanalProps {
  getSemanaTexto: () => string;
  setSemanaOffset: (offset: number) => void;
  diasSemanaArray: any[];
  fechasBloqueadas: Set<string>;
  diasBloqueadosAdmin: number[];
  todosBloqueados: boolean;
  setDiaSeleccionadoIdx: (idx: number) => void;
  fechasHorarioBloqueado?: Set<string>;
  estadoFechas?: Record<string, { almuerzo: boolean; cena: boolean }>;
  cargandoHistorial?: boolean;
}

/* FUNCIONES AUXILIARES */
const getDiaSemanaBloqueo = (fechaISO: string) => {
  const dia = new Date(`${fechaISO}T12:00:00`).getDay();
  return dia === 0 ? 7 : dia;
};

/* COMPONENTE PRINCIPAL */
export const CalendarioSemanal: React.FC<CalendarioSemanalProps> = ({
  getSemanaTexto,
  setSemanaOffset,
  diasSemanaArray,
  fechasBloqueadas,
  diasBloqueadosAdmin,
  todosBloqueados,
  setDiaSeleccionadoIdx,
  fechasHorarioBloqueado,
  estadoFechas = {},
  cargandoHistorial = false,
}) => {
  return (
    <div className="mt-10 px-6 shrink-0">
      
      {/* CONTROLES DE NAVEGACION */}
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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* LISTA DE DIAS DE LA SEMANA */}
      <div 
        className="flex items-center overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 pt-2 -mx-2 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', gap: 'calc(15% / 4)' }} 
      >
        {diasSemanaArray.map((dia, index) => {
          
          {/* LOGICA DE BLOQUEO Y SELECCION */}
          const tienePedido = fechasBloqueadas.has(dia.iso);
          const numDiaMenu = getDiaSemanaBloqueo(dia.iso);
          const esBloqueadoPerm = diasBloqueadosAdmin.includes(numDiaMenu);
          const visualmenteBloqueado = dia.bloqueado || esBloqueadoPerm;
          const esBloqueadoPorHorario = !tienePedido && !cargandoHistorial && (fechasHorarioBloqueado?.has(dia.iso) ?? false);
          const isSelectedAndValid = dia.esSeleccionado && !todosBloqueados;
          
          const noSeleccionable = (visualmenteBloqueado && !tienePedido) || esBloqueadoPorHorario;

          {/* LOGICA DE ESTADOS DE COMIDA */}
          const estadoComida = estadoFechas[dia.iso] || { almuerzo: false, cena: false };
          const soloAlmuerzo = estadoComida.almuerzo && !estadoComida.cena;
          const soloCena = estadoComida.cena && !estadoComida.almuerzo;
          const ambasComidas = estadoComida.almuerzo && estadoComida.cena;

          {/* VARIABLES DE DISEÑO DINAMICO */}
          let bgClass = 'bg-white border-gray-200';
          let textClass = 'text-[#1d2d50]';
          let subTextClass = 'text-gray-400';

          if (ambasComidas) {
            bgClass = 'border-transparent shadow-md';
            textClass = 'text-white';
            subTextClass = 'text-white/90';
          } else if (soloCena) {
            bgClass = 'bg-[#1d2d50] border-transparent shadow-md';
            textClass = 'text-white';
            subTextClass = 'text-white/80';
          } else if (soloAlmuerzo) {
            bgClass = 'bg-[#70a344] border-transparent shadow-md';
            textClass = 'text-white';
            subTextClass = 'text-white/90';
          } else if (visualmenteBloqueado || esBloqueadoPorHorario) {
            bgClass = 'bg-gray-100 border-gray-200';
            textClass = 'text-gray-300';
            subTextClass = 'text-gray-400';
          }

          const selectionEffect = isSelectedAndValid 
            ? 'scale-110 shadow-md ring-2 ring-[#70a344] ring-offset-2' 
            : 'border shadow-sm';

          {/* RENDERIZADO DEL BOTON DEL DIA */}
          return (
            <button
              key={index}
              onClick={() => { if (!noSeleccionable) setDiaSeleccionadoIdx(index); }}
              className={['relative flex flex-col items-center justify-center shrink-0 w-[17%] aspect-square rounded-[20px] transition-all snap-center overflow-hidden',
                selectionEffect,
                bgClass,
                noSeleccionable ? 'cursor-not-allowed' : 'cursor-pointer'
              ].join(' ')}
            >
              {ambasComidas && (
                <>
                  <div className="absolute inset-0 right-1/2 bg-[#70a344]" />
                  <div className="absolute inset-0 left-1/2 bg-[#1d2d50]" />
                </>
              )}

              <span className={`relative z-10 text-[10px] font-black mb-1 uppercase ${subTextClass}`}>
                {dia.letra}
              </span>
              
              {noSeleccionable ? (
                <Lock size={16} className="relative z-10 text-gray-300" />
              ) : (
                <span className={`relative z-10 text-lg font-black ${textClass}`}>
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