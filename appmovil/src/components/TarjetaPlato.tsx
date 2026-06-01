// TarjetaPlato.tsx
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface TarjetaPlatoProps {
  plato: any; 
  categoriaKey: 'entradaId' | 'fondoId' | 'postreId';
  isSelected: boolean;
  isDeadlinePassed: boolean;
  hideSelectionIcon?: boolean;
  extraInfo?: string;
  onSelect: (categoria: 'entradaId' | 'fondoId' | 'postreId', id: number) => void;
}

export const TarjetaPlato: React.FC<TarjetaPlatoProps> = ({ 
  plato, 
  categoriaKey, 
  isSelected, 
  isDeadlinePassed, 
  hideSelectionIcon = false,
  extraInfo,
  onSelect 
}) => {

  return (
    <button
      onClick={() => onSelect(categoriaKey, plato.id)}
      disabled={isDeadlinePassed}
      className={`w-full p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-4 border-gray-100 bg-white ${
        isSelected ? 'shadow-md scale-[1.01]' : 'shadow-sm'
      }`}
    >
      <img 
        src={plato.url_imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
        alt={plato.nombre} 
        className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            plato.tipo === 'VEGANO' ? 'bg-green-100 text-green-700' :
            plato.tipo === 'HIPOCALORICO' ? 'bg-blue-100 text-blue-700' :
            plato.tipo === 'PLATO_UNICO' ? 'bg-purple-100 text-purple-700' : // 🔥 Nuevo estilo para PLATO_UNICO
            'bg-orange-100 text-orange-700'
          }`}>
            {plato.tipo.replace('_', ' ')} {/* Formatea PLATO_UNICO a PLATO UNICO */}
          </span>
        </div>
        <p className="font-bold text-gray-800 text-sm leading-tight truncate">{String(plato.nombre).toUpperCase()}</p>
        {extraInfo && (
          <p className="mt-2 text-[11px] font-bold text-gray-500 truncate">{extraInfo}</p>
        )}
      </div>
      {!hideSelectionIcon && (
        <div className="flex-shrink-0 pr-2">
          {isSelected ? <CheckCircle2 size={24} className="text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>}
        </div>
      )}
    </button>
  );
};