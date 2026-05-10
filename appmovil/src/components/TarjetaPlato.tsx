import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface TarjetaPlatoProps {
  plato: any; 
  categoriaKey: 'entradaId' | 'fondoId' | 'postreId';
  isSelected: boolean;
  isDeadlinePassed: boolean;
  onSelect: (categoria: 'entradaId' | 'fondoId' | 'postreId', id: number) => void;
}

export const TarjetaPlato: React.FC<TarjetaPlatoProps> = ({ 
  plato, 
  categoriaKey, 
  isSelected, 
  isDeadlinePassed, 
  onSelect 
}) => {
  return (
    <button
      onClick={() => onSelect(categoriaKey, plato.id)}
      disabled={isDeadlinePassed}
      // 👇 Aquí quitamos el borde/fondo verde. Siempre es blanco con borde gris.
      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-4 border-gray-100 bg-white ${
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
          <span className={`text-[9px] font-black uppercase tracking-wider px- py-0.5 rounded-full ${
            plato.tipo === 'VEGANO' ? 'bg-green-100 text-green-700' :
            plato.tipo === 'HIPOCALORICO' ? 'bg-blue-100 text-blue-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {plato.tipo}
          </span>
        </div>
        <p className="font-bold text-gray-800 text-sm leading-tight truncate">{plato.nombre}</p>
        {plato.guarniciones && plato.guarniciones.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {plato.guarniciones.length === 1
              ? `+ ${plato.guarniciones[0].nombre}`
              : `+ ${plato.guarniciones.length} guarniciones`}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 pr-2">
        {/* El ticket verde se mantiene intacto aquí abajo */}
        {isSelected ? <CheckCircle2 size={24} className="text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>}
      </div>
    </button>
  );
};