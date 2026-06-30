import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Utensils, CheckCircle2, CalendarPlus } from 'lucide-react';
// 🔥 Importamos tu nuevo hook
import { useAsignarManual } from '../hooks/useAsignarManual';

interface Pedido {
  id: number;
  fecha?: string;
  listaPlatos?: string[];
  estado?: string;
  esCena?: boolean;
}

interface TarjetaTrabajadorProps {
  trabajador: {
    id: number;
    nombre: string;
    pedidos?: Pedido[];
  };
  permiteCena?: boolean;
  token?: string | null; // 🔥 Agregamos el token a las Props
}

const getNombreDia = (fechaStr: string) => {
  const d = new Date(`${fechaStr}T12:00:00`);
  const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  return dias[d.getDay()];
};

export const TarjetaTrabajador: React.FC<TarjetaTrabajadorProps> = ({ trabajador, permiteCena = false, token }) => {
  const nombreTrabajador = trabajador?.nombre?.trim() || 'Usuario sin nombre';
  const [isExpanded, setIsExpanded] = useState(false);
  const [modoComida, setModoComida] = useState<'ALMUERZO' | 'CENA'>('ALMUERZO');
  
  const pedidosTotales = Array.isArray(trabajador?.pedidos) ? trabajador.pedidos : [];
  const pedidosVisibles = useMemo(
    () => (permiteCena ? pedidosTotales : pedidosTotales.filter(p => !p.esCena)),
    [permiteCena, pedidosTotales]
  );
  const pedidosFiltrados = pedidosVisibles.filter(p => modoComida === 'CENA' ? p.esCena : !p.esCena);
  
  const [pedidoActivoId, setPedidoActivoId] = useState<number | null>(null);
  const [diaManualActivo, setDiaManualActivo] = useState<string | null>(null);

  // 🔥 Usamos el nuevo hook pasándole el token
  const { asignarPedido, isSubmitting } = useAsignarManual(token);

  // ... (getDiasSemana y useEffects se mantienen igualitos) ...
  const getDiasSemana = () => {
    let refDate = new Date();
    if (pedidosVisibles.length > 0 && pedidosVisibles[0].fecha) {
      refDate = new Date(pedidosVisibles[0].fecha.split('T')[0] + 'T12:00:00');
    }
    const day = refDate.getDay() || 7;
    const lunes = new Date(refDate);
    lunes.setDate(refDate.getDate() - day + 1);
    
    const semana = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      semana.push(d.toISOString().split('T')[0]);
    }
    return semana;
  };
  const diasSemana = getDiasSemana();

  useEffect(() => {
    if (pedidosFiltrados.length > 0) {
      setPedidoActivoId(pedidosFiltrados[0].id);
      setDiaManualActivo(null);
    } else {
      setPedidoActivoId(null);
      setDiaManualActivo(diasSemana[0]);
    }
  }, [modoComida, pedidosVisibles]);

  useEffect(() => {
    if (!permiteCena && modoComida === 'CENA') {
      setModoComida('ALMUERZO');
    }
  }, [permiteCena, modoComida]);

  const pedidoSeleccionado = pedidosFiltrados.find(p => p.id === pedidoActivoId);
  const cantidadPedidos = pedidosVisibles.length;
  const cantidadConfirmados = pedidosVisibles.filter(p => p.estado === 'CONFIRMADO').length;
  const cantidadPendientes = cantidadPedidos - cantidadConfirmados;
  const estaTotalmenteConfirmado = cantidadPedidos > 0 && cantidadPendientes === 0;
  const tieneParciales = cantidadConfirmados > 0 && cantidadPendientes > 0;

  // 🔥 Nueva función súper limpia llamando al hook
  const manejarAsignacionManual = async (tipo: string) => {
    if (!diaManualActivo) return;
    const exito = await asignarPedido(
      trabajador.id, 
      diaManualActivo, 
      tipo, 
      modoComida === 'CENA'
    );
    
    if (exito) {
      window.location.reload(); // Recarga para ver los cambios
    }
  };

  // 🔥 COLORES DINÁMICOS Y EL RESTO DEL COMPONENTE QUEDAN INTACTOS
  const isAlmuerzo = modoComida === 'ALMUERZO';
  const themeActiveBg = isAlmuerzo ? 'bg-[#70a344] border-[#70a344]' : 'bg-[#1d2d50] border-[#1d2d50]';
  const themeHoverBorder = isAlmuerzo ? 'hover:border-[#70a344]/50' : 'hover:border-[#1d2d50]/50';
  const themeDot = isAlmuerzo ? 'bg-[#70a344]' : 'bg-[#1d2d50]';
  const themePanelBg = isAlmuerzo ? 'bg-[#70a344]/5 border-[#70a344]/20' : 'bg-[#1d2d50]/5 border-[#1d2d50]/20';
  const themeText = isAlmuerzo ? 'text-[#70a344]' : 'text-[#1d2d50]';

  return (
    <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all mb-4 ${estaTotalmenteConfirmado ? 'border-[#70a344]/30' : tieneParciales ? 'border-amber-200' : 'border-slate-200'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-5 active:bg-slate-50/70 transition-colors ${estaTotalmenteConfirmado ? 'bg-[#70a344]/5' : tieneParciales ? 'bg-amber-50/50' : 'bg-white'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-sm ${estaTotalmenteConfirmado ? 'bg-[#70a344] text-white' : tieneParciales ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-[#1d2d50]'}`}>
            {nombreTrabajador.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex flex-col text-left">
            <span className="font-black text-lg text-[#1d2d50] leading-tight capitalize">
              {nombreTrabajador.toLowerCase()}
            </span>
            
            {cantidadPedidos === 0 ? (
               <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-1 text-slate-400">
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                 SIN PEDIDOS
               </span>
            ) : estaTotalmenteConfirmado ? (
               <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-1 text-[#70a344]">
                 <CheckCircle2 size={12} strokeWidth={3} />
                 {cantidadPedidos} {cantidadPedidos === 1 ? 'PEDIDO' : 'PEDIDOS'}
               </span>
            ) : (
               <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-1 ${tieneParciales ? 'text-amber-500' : 'text-slate-500'}`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${tieneParciales ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
                 {cantidadPendientes} {cantidadPendientes === 1 ? 'PENDIENTE' : 'PENDIENTES'}
               </span>
            )}
          </div>
        </div>
        
        {isExpanded ? <ChevronUp size={20} className={estaTotalmenteConfirmado ? 'text-[#70a344]' : tieneParciales ? 'text-amber-500' : 'text-slate-400'} /> : <ChevronDown size={20} className={estaTotalmenteConfirmado ? 'text-[#70a344]' : tieneParciales ? 'text-amber-500' : 'text-slate-400'} />}
      </button>

      {isExpanded && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-100 bg-white">
          
          {permiteCena && (
          <div className="mb-5 bg-slate-100/80 p-1.5 rounded-[14px] flex items-center shadow-inner mt-3">
            <button
              onClick={() => setModoComida('ALMUERZO')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modoComida === 'ALMUERZO' ? 'bg-white text-[#1d2d50] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ☀️ Almuerzo
            </button>
            <button
              onClick={() => setModoComida('CENA')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modoComida === 'CENA' ? 'bg-[#1d2d50] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              🌙 Cena
            </button>
          </div>
          )}
          
          {/* TIMELINE DE DÍAS */}
          <div className="flex gap-2 pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {diasSemana.map((fechaString) => {
              const pedido = pedidosFiltrados.find(p => p.fecha?.startsWith(fechaString));
              const diaCorto = getNombreDia(fechaString);
              const numeroDia = fechaString.split('-')[2];

              if (pedido) {
                const isActive = pedidoActivoId === pedido.id;
                return (
                  <button
                    key={fechaString}
                    onClick={() => { setPedidoActivoId(pedido.id); setDiaManualActivo(null); }}
                    className={`h-[64px] min-w-[56px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all relative border ${
                      isActive 
                        ? `${themeActiveBg} text-white shadow-md scale-105` // 🔥 SE APLICA EL COLOR DINÁMICO AQUÍ
                        : `bg-white border-slate-200 text-[#1d2d50] ${themeHoverBorder}`
                    }`}
                  >
                    <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/90' : 'text-slate-400'}`}>{diaCorto}</span>
                    <span className={`text-base font-black ${isActive ? 'text-white' : 'text-[#1d2d50]'}`}>{numeroDia}</span>
                    
                    {/* Puntito del mismo color del turno */}
                    {pedido.estado === 'CONFIRMADO' && !isActive && (
                      <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${themeDot}`}></div>
                    )}
                  </button>
                );
              } else {
                const isActive = diaManualActivo === fechaString;
                return (
                  <button
                    key={fechaString}
                    onClick={() => { setPedidoActivoId(null); setDiaManualActivo(fechaString); }}
                    className={`h-[64px] min-w-[56px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all relative border ${
                      isActive 
                        ? 'bg-slate-200 border-slate-300 text-[#1d2d50] shadow-inner scale-105' 
                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">{diaCorto}</span>
                    <span className="text-base font-black">{numeroDia}</span>
                  </button>
                );
              }
            })}
          </div>

          {/* PANEL DE DETALLE DEL PEDIDO */}
          {pedidoSeleccionado && (
            <div className={`p-4 rounded-2xl border animate-in fade-in duration-200 mt-2 ${themePanelBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${themeText}`}>
                  <Utensils size={14} /> Detalle
                </span>
                
                {pedidoSeleccionado.estado === 'CONFIRMADO' ? (
                  <span className={`flex items-center gap-1 bg-white text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm ${themeText}`}>
                    <CheckCircle2 size={12} strokeWidth={3} /> Confirmado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-white text-slate-500 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm">
                    Pendiente
                  </span>
                )}
              </div>
              
              <ul className="space-y-2 mt-2">
                {Array.isArray(pedidoSeleccionado.listaPlatos) && pedidoSeleccionado.listaPlatos.length > 0 ? (
                  pedidoSeleccionado.listaPlatos.map((plato, index) => (
                    <li key={index} className="flex items-start gap-2 text-[13px] font-bold text-[#1d2d50] leading-snug">
                      <span className={themeText}>•</span>
                      <span>{plato}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs font-bold text-slate-400 uppercase">Sin detalles</li>
                )}
              </ul>
            </div>
          )}

          {/* PANEL DE ASIGNACIÓN MANUAL (SE MANTIENE IGUAL DE LIMPIO) */}
          {diaManualActivo && !pedidoSeleccionado && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in duration-200 mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-[#1d2d50] uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarPlus size={14} /> Asignar Manual
                </span>
                <span className="text-[10px] font-black text-[#1d2d50] bg-slate-200 px-2 py-1 rounded-md uppercase tracking-wider shadow-sm border border-slate-300">
                  {getNombreDia(diaManualActivo)} {diaManualActivo.split('-')[2]}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {['MENU_DIA', 'HIPOCALORICO', 'VEGETARIANO', 'COLACION'].map((tipo) => (
                  <button 
                    key={tipo}
                    disabled={isSubmitting}
                    onClick={() => manejarAsignacionManual(tipo)} // 🔥 Llamamos a la nueva función
                    className="text-[10px] font-bold text-[#1d2d50] bg-white border border-slate-200 py-3 rounded-xl hover:border-slate-300 hover:bg-slate-100 transition-all disabled:opacity-50"
                  >
                    {tipo.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
