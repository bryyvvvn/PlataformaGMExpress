// TarjetaPlato.tsx
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface TarjetaPlatoProps {
  plato: any;
  categoriaKey: 'entradaId' | 'fondoId' | 'postreId' | 'otro' | 'canjeId' | 'sandwichId' | 'bebidaId';
  isSelected: boolean;
  isDeadlinePassed: boolean;
  disabled?: boolean;
  hideSelectionIcon?: boolean;
  readOnly?: boolean;
  extraInfo?: string | string[];
  grayTag?: boolean;
  onSelect: (categoria: string, id: number) => void;
}

const TarjetaPlatoBase: React.FC<TarjetaPlatoProps> = ({
  plato, 
  categoriaKey, 
  isSelected, 
  isDeadlinePassed, 
  disabled = false,
  hideSelectionIcon = false,
  readOnly = false,
  extraInfo,
  grayTag = false,
  onSelect 
}) => {

  return (
    <button
      onClick={() => onSelect(categoriaKey, plato.id)}
      disabled={isDeadlinePassed || disabled}
      className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 bg-white ${
        isSelected ? 'shadow-md scale-[1.01] border-[#70a344]' : 'border-gray-100 shadow-sm hover:border-gray-200'
      } ${ !readOnly && (isDeadlinePassed || disabled) ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      
      {/* 🔴 FILA 1: FOTO, NOMBRE Y CHECKBOX */}
      <div className="flex w-full items-center gap-4">
        <img 
          src={plato.url_imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
          alt={plato.nombre} 
          className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0 shadow-sm"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              grayTag
                ? 'bg-gray-100 text-gray-600'
                : plato.tipo === 'VEGANO' ? 'bg-green-100 text-green-700' :
                  plato.tipo === 'HIPOCALORICO' ? 'bg-blue-100 text-blue-700' :
                  plato.tipo === 'PLATO_UNICO' ? 'bg-purple-100 text-purple-700' :
                  'bg-orange-100 text-orange-700'
            }`}>
              {plato.tipo.replace('_', ' ')}
            </span>
          </div>
          {
            (() => {
              const name = String(plato.nombre || '');
              const parts = name.split(/[+,;]+/).map(s => s.trim()).filter(Boolean);
              if (parts.length <= 1) {
                return <p className="font-bold text-[#1d2d50] text-[14px] leading-tight truncate">{name.toUpperCase()}</p>;
              }
              return (
                <div className="leading-tight">
                  {parts.map((part, idx) => (
                    <div key={idx} className="font-bold text-[#1d2d50] text-[14px] truncate">
                      {part.toUpperCase()}
                    </div>
                  ))}
                </div>
              );
            })()
          }
          
          {extraInfo && (
            Array.isArray(extraInfo) ? (
              <div className="mt-1 text-xs font-bold text-gray-500">
                {extraInfo.map((line, idx) => (
                  <div key={idx} className="truncate">{line}</div>
                ))}
              </div>
            ) : (
              (() => {
                const parts = String(extraInfo).split(/[+,;]+/).map(s => s.trim()).filter(Boolean);
                if (parts.length <= 1) return <p className="mt-1 text-xs font-bold text-gray-500 truncate">{extraInfo}</p>;
                return (
                  <div className="mt-1 text-xs font-bold text-gray-500">
                    {parts.map((line, idx) => (
                      <div key={idx} className="truncate">{line}</div>
                    ))}
                  </div>
                );
              })()
            )
          )}
        </div>

        {!hideSelectionIcon && (
          <div className="flex-shrink-0 pr-1">
            {isSelected ? <CheckCircle2 size={24} className="text-[#70a344]" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>}
          </div>
        )}
      </div>

      {/* 🔴 FILA 2: DISEÑO NUTRICIONAL */}
      {/* Se asegura de que se renderice si AL MENOS uno de los macros existe (incluso si es 0) */}
      {(plato.calorias != null || plato.proteinas != null || plato.carbohidratos != null) && (
        <div className="w-full mt-1 flex items-center gap-2.5">
          
          {/* Se usa != null para que el 0 sea un valor válido y dibuje la cajita */}
          {plato.calorias != null && (
            <div className="flex-1 flex flex-col items-center justify-center bg-orange-50/80 rounded-xl py-2 border border-orange-100/50">
              <span className="text-base font-black text-orange-600 leading-none mb-1">{plato.calorias}</span>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest leading-none">Kcal</span>
            </div>
          )}

          {plato.proteinas != null && (
            <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/80 rounded-xl py-2 border border-rose-100/50">
              <span className="text-base font-black text-rose-600 leading-none mb-1">{plato.proteinas}g</span>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-none">Prot</span>
            </div>
          )}

          {plato.carbohidratos != null && (
            <div className="flex-1 flex flex-col items-center justify-center bg-amber-50/80 rounded-xl py-2 border border-amber-100/50">
              <span className="text-base font-black text-amber-600 leading-none mb-1">{plato.carbohidratos}g</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Carbs</span>
            </div>
          )}

        </div>
      )}

    </button>
  );
};

export const TarjetaPlato = React.memo(TarjetaPlatoBase);