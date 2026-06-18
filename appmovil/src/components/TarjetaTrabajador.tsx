import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Utensils, CheckCircle2, CalendarX2 } from 'lucide-react';

interface Pedido {
  id: number;
  fecha?: string;
  listaPlatos?: string[];
  estado?: string;
}

interface TarjetaTrabajadorProps {
  trabajador: {
    id: number;
    nombre: string;
    pedidos?: Pedido[];
  };
}

const getDiaCorto = (fechaString?: string) => {
  if (!fechaString) return 'S/F';
  const fecha = new Date(fechaString.includes('T') ? fechaString : `${fechaString}T12:00:00`);
  const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  return dias[fecha.getDay()];
};

export const TarjetaTrabajador: React.FC<TarjetaTrabajadorProps> = ({ trabajador }) => {
  const nombreTrabajador = trabajador?.nombre?.trim() || 'Usuario sin nombre';
  const [isExpanded, setIsExpanded] = useState(false);
  
  const pedidos = Array.isArray(trabajador?.pedidos) ? trabajador.pedidos : [];
  
  const [pedidoActivoId, setPedidoActivoId] = useState<number | null>(
    pedidos.length > 0 ? pedidos[0].id : null
  );

  const pedidoSeleccionado = pedidos.find(p => p.id === pedidoActivoId);

  // 🔥 LÓGICA DE ESTADO GLOBAL DEL TRABAJADOR ACTUALIZADA
  const cantidadPedidos = pedidos.length;
  const cantidadConfirmados = pedidos.filter(p => p.estado === 'CONFIRMADO').length;
  const cantidadPendientes = cantidadPedidos - cantidadConfirmados;

  const estaTotalmenteConfirmado = cantidadPedidos > 0 && cantidadPendientes === 0;
  const tieneParciales = cantidadConfirmados > 0 && cantidadPendientes > 0;

  return (
    <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all mb-4 ${estaTotalmenteConfirmado ? 'border-green-100' : tieneParciales ? 'border-amber-100' : 'border-gray-100'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-5 active:bg-gray-50/70 transition-colors ${estaTotalmenteConfirmado ? 'bg-green-50/20' : tieneParciales ? 'bg-amber-50/30' : 'bg-white'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-black text-lg shadow-inner ${estaTotalmenteConfirmado ? 'bg-green-50 border-green-100 text-[#70a344]' : tieneParciales ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-gray-50 border-gray-100 text-[#1d2d50]'}`}>
            {nombreTrabajador.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex flex-col text-left">
            <span className="font-black text-lg text-[#1d2d50] leading-tight capitalize">
              {nombreTrabajador.toLowerCase()}
            </span>
            
            {/* 🔥 ETIQUETA DINÁMICA DE ESTADO */}
            {cantidadPedidos === 0 ? (
               <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1 text-gray-400">
                 <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                 SIN PEDIDOS
               </span>
            ) : estaTotalmenteConfirmado ? (
               <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1 text-[#70a344]">
                 <CheckCircle2 size={12} className="text-[#70a344]" />
                 {cantidadPedidos} {cantidadPedidos === 1 ? 'DÍA CONFIRMADO' : 'DÍAS CONFIRMADOS'}
               </span>
            ) : (
               <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1 ${tieneParciales ? 'text-amber-500' : 'text-gray-500'}`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${tieneParciales ? 'bg-amber-400' : 'bg-gray-400'}`}></span>
                 {cantidadPendientes} {cantidadPendientes === 1 ? 'DÍA PENDIENTE' : 'DÍAS PENDIENTES'}
               </span>
            )}
          </div>
        </div>
        
        {isExpanded ? <ChevronUp size={20} className={estaTotalmenteConfirmado ? 'text-[#70a344]' : tieneParciales ? 'text-amber-500' : 'text-gray-400'} /> : <ChevronDown size={20} className={estaTotalmenteConfirmado ? 'text-[#70a344]' : tieneParciales ? 'text-amber-500' : 'text-gray-400'} />}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-50 bg-gray-50/30">
          
          {pedidos.length > 0 ? (
            <>
              <div className="flex gap-2.5 py-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {pedidos.map((pedido) => {
                  const isActive = pedidoActivoId === pedido.id;
                  const diaCorto = getDiaCorto(pedido.fecha);
                  const numeroDia = pedido.fecha ? pedido.fecha.split('T')[0].split('-')[2] : '--';
                  const estaConfirmado = pedido.estado === 'CONFIRMADO';
                  
                  return (
                    <button
                      key={pedido.id}
                      onClick={() => setPedidoActivoId(pedido.id)}
                      className={`min-w-[54px] shrink-0 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all border relative ${
                        isActive 
                          ? 'bg-[#70a344] border-[#70a344] text-white shadow-md scale-105 font-black' 
                          : 'bg-white border-gray-200 text-gray-400 active:bg-gray-50'
                      }`}
                    >
                      {estaConfirmado && !isActive && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#70a344] rounded-full border-2 border-white"></div>
                      )}
                      <span className={`text-[9px] font-black uppercase ${isActive ? 'text-white/90' : 'text-gray-400'}`}>
                        {diaCorto}
                      </span>
                      <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-[#1d2d50]'}`}>
                        {numeroDia}
                      </span>
                    </button>
                  );
                })}
              </div>

              {pedidoSeleccionado && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-200 mt-1">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${pedidoSeleccionado.estado === 'CONFIRMADO' ? 'bg-[#70a344]' : 'bg-gray-300'}`} />
                  
                  <div className="flex items-center justify-between mb-3 pl-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Utensils size={12} className={pedidoSeleccionado.estado === 'CONFIRMADO' ? 'text-[#70a344]' : 'text-gray-400'} /> Detalle de Colaciones
                    </span>
                    
                    {pedidoSeleccionado.estado === 'CONFIRMADO' ? (
                      <span className="flex items-center gap-1 bg-green-50 text-[#70a344] border border-green-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                        <CheckCircle2 size={12} /> Confirmado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-gray-50 text-gray-500 border border-gray-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                        Pendiente
                      </span>
                    )}
                  </div>
                  
                  <ul className="pl-2 space-y-2">
                    {Array.isArray(pedidoSeleccionado.listaPlatos) && pedidoSeleccionado.listaPlatos.length > 0 ? (
                      pedidoSeleccionado.listaPlatos.map((plato, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs font-bold text-[#1d2d50] uppercase leading-snug">
                          <span className="text-[#70a344] text-sm mt-[0px]">•</span>
                          <span>{plato}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs font-bold text-gray-400 uppercase leading-snug">Sin detalles registrados</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <CalendarX2 size={20} className="text-gray-400" />
              </div>
              <span className="text-xs font-black text-[#1d2d50] uppercase tracking-widest mb-1">Sin Solicitudes</span>
              <span className="text-[11px] text-gray-400 leading-tight px-4">
                El trabajador no ha registrado ningún menú para los días de esta semana.
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
};