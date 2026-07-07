import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Utensils, CheckCircle2, CalendarPlus, Lock } from 'lucide-react';
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
    id: number | string;
    nombre: string;
    diasBloqueados?: number[];
    pedidos?: Pedido[];
  };
  permiteCena?: boolean;
  token?: string | null; 
  diasSemana?: Array<{ iso: string }>;
  onPedidoAsignado?: () => void | Promise<void>;
}

const getNombreDia = (fechaStr: string) => {
  const d = new Date(`${fechaStr}T12:00:00`);
  const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  return dias[d.getDay()];
};

const getDiaSemanaBloqueo = (fechaStr: string) => {
  const dia = new Date(`${fechaStr}T12:00:00`).getDay();
  return dia === 0 ? 7 : dia;
};

// 🔥 FUNCIÓN DE COLORES DINÁMICOS
const getEstadoColors = (estado?: string) => {
  if (['EN_PRODUCCION', 'ENTREGADO'].includes(estado || '')) {
    return {
      activeBg: 'bg-purple-500 border-purple-500',
      panelBg: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-600',
      dot: 'bg-purple-500'
    };
  }
  if (estado === 'CONFIRMADO') {
    return {
      activeBg: 'bg-[#70a344] border-[#70a344]',
      panelBg: 'bg-[#70a344]/10 border-[#70a344]/30',
      textColor: 'text-[#70a344]',
      dot: 'bg-[#70a344]'
    };
  }
  // PENDIENTE O SIN ESTADO (Color Plomo)
  return {
    activeBg: 'bg-slate-400 border-slate-400',
    panelBg: 'bg-slate-50 border-slate-200',
    textColor: 'text-slate-500',
    dot: 'bg-slate-300'
  };
};

export const TarjetaTrabajador: React.FC<TarjetaTrabajadorProps> = ({
  trabajador,
  permiteCena = false,
  token,
  diasSemana: diasSemanaProp,
  onPedidoAsignado,
}) => {
  const nombreTrabajador = trabajador?.nombre?.trim() || 'Usuario sin nombre';
  const [isExpanded, setIsExpanded] = useState(false);
  const [modoComida, setModoComida] = useState<'ALMUERZO' | 'CENA'>('ALMUERZO');
  
  const pedidosTotales = Array.isArray(trabajador?.pedidos) ? trabajador.pedidos : [];
  const diasBloqueados = useMemo(
    () => Array.isArray(trabajador?.diasBloqueados)
      ? trabajador.diasBloqueados.map(Number).filter((dia) => Number.isInteger(dia) && dia >= 1 && dia <= 7)
      : [],
    [trabajador?.diasBloqueados]
  );
  const pedidosVisibles = useMemo(
    () => (permiteCena ? pedidosTotales : pedidosTotales.filter(p => !p.esCena)),
    [permiteCena, pedidosTotales]
  );
  const pedidosFiltrados = pedidosVisibles.filter(p => modoComida === 'CENA' ? p.esCena : !p.esCena);
  
  const [pedidoActivoId, setPedidoActivoId] = useState<number | null>(null);
  const [diaManualActivo, setDiaManualActivo] = useState<string | null>(null);

  const { asignarPedido, isSubmitting } = useAsignarManual(token);

  const getDiasSemana = useMemo(() => {
    if (diasSemanaProp?.length) {
      return diasSemanaProp.map((dia) => dia.iso).filter(Boolean);
    }

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
  }, [diasSemanaProp, pedidosVisibles]);
  const diasSemana = getDiasSemana;

  useEffect(() => {
    if (pedidosFiltrados.length > 0) {
      setPedidoActivoId(pedidosFiltrados[0].id);
      setDiaManualActivo(null);
    } else {
      setPedidoActivoId(null);
      const primerDiaDisponible = diasSemana.find((fecha) => !diasBloqueados.includes(getDiaSemanaBloqueo(fecha)));
      setDiaManualActivo(primerDiaDisponible ?? null);
    }
  }, [modoComida, pedidosVisibles, diasSemana, diasBloqueados]);

  useEffect(() => {
    if (!permiteCena && modoComida === 'CENA') {
      setModoComida('ALMUERZO');
    }
  }, [permiteCena, modoComida]);

  const pedidoSeleccionado = pedidosFiltrados.find(p => p.id === pedidoActivoId);
  
  const cantidadPedidos = pedidosVisibles.length;
  const countConfirmado = pedidosVisibles.filter(p => p.estado === 'CONFIRMADO').length;
  const countProduccion = pedidosVisibles.filter(p => ['EN_PRODUCCION', 'ENTREGADO'].includes(p.estado || '')).length;
  const countPendiente = pedidosVisibles.filter(p => !p.estado || p.estado === 'PENDIENTE').length;

  const manejarAsignacionManual = async (tipo: string) => {
    if (!diaManualActivo) return;
    const exito = await asignarPedido(
      trabajador.id, 
      diaManualActivo, 
      tipo, 
      modoComida === 'CENA'
    );
    
    if (exito) {
      await onPedidoAsignado?.();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all mb-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex flex-col p-5 active:bg-slate-50/70 transition-colors bg-white hover:bg-slate-50"
      >
        {/* 1. FILA DE CABECERA: Foto, Nombre y Flecha perfectamente alineados al medio */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-black text-lg shadow-sm bg-slate-100 text-[#1d2d50]">
              {nombreTrabajador.charAt(0).toUpperCase()}
            </div>
            <span className="font-black text-lg text-[#1d2d50] leading-tight capitalize text-left">
              {nombreTrabajador.toLowerCase()}
            </span>
          </div>
          
          <div className="text-slate-400 shrink-0 ml-4">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
        
        {/* 🔥 2. FILA DE ESTADOS: Alineados a la izquierda bajo la imagen (pl-2 en vez de pl-16) */}
        <div className="flex flex-col gap-1.5 mt-4 pl-2 w-full text-left">
          {cantidadPedidos === 0 && (
            <span className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              SIN PEDIDOS
            </span>
          )}
          {countConfirmado > 0 && (
            <span className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-[#70a344]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#70a344]"></span>
              {countConfirmado} {countConfirmado === 1 ? 'CONFIRMADO' : 'CONFIRMADOS'}
            </span>
          )}
          {countProduccion > 0 && (
            <span className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-purple-600">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              {countProduccion} {countProduccion === 1 ? 'PRODUCCIÓN' : 'PRODUCCIÓN'}
            </span>
          )}
          {countPendiente > 0 && (
            <span className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              {countPendiente} {countPendiente === 1 ? 'PENDIENTE' : 'PENDIENTES'}
            </span>
          )}
        </div>
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
          
          <div className="flex gap-2 pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {diasSemana.map((fechaString) => {
              const pedido = pedidosFiltrados.find(p => p.fecha?.startsWith(fechaString));
              const diaCorto = getNombreDia(fechaString);
              const numeroDia = fechaString.split('-')[2];
              const diaBloqueado = diasBloqueados.includes(getDiaSemanaBloqueo(fechaString));

              if (pedido) {
                const isActive = pedidoActivoId === pedido.id;
                
                const coloresDia = getEstadoColors(pedido.estado);

                return (
                  <button
                    key={fechaString}
                    onClick={() => { setPedidoActivoId(pedido.id); setDiaManualActivo(null); }}
                    className={`h-[64px] min-w-[56px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all relative border ${
                      isActive 
                        ? `${coloresDia.activeBg} text-white shadow-md scale-105` 
                        : `bg-white border-slate-200 text-[#1d2d50] hover:border-slate-300`
                    }`}
                  >
                    <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/90' : 'text-slate-400'}`}>{diaCorto}</span>
                    <span className={`text-base font-black ${isActive ? 'text-white' : 'text-[#1d2d50]'}`}>{numeroDia}</span>
                    
                    {!isActive && (
                      <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${coloresDia.dot}`}></div>
                    )}
                  </button>
                );
              } else {
                const isActive = diaManualActivo === fechaString;
                return (
                  <button
                    key={fechaString}
                    onClick={() => {
                      if (diaBloqueado) return;
                      setPedidoActivoId(null);
                      setDiaManualActivo(fechaString);
                    }}
                    disabled={diaBloqueado}
                    className={`h-[64px] min-w-[56px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all relative border ${
                      diaBloqueado
                        ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                        : isActive 
                        ? 'bg-slate-200 border-slate-300 text-[#1d2d50] shadow-inner scale-105' 
                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">{diaCorto}</span>
                    {diaBloqueado ? <Lock size={15} /> : <span className="text-base font-black">{numeroDia}</span>}
                  </button>
                );
              }
            })}
          </div>

          {pedidoSeleccionado && (() => {
            const coloresPanel = getEstadoColors(pedidoSeleccionado.estado);
            
            return (
              <div className={`p-4 rounded-2xl border animate-in fade-in duration-200 mt-2 ${coloresPanel.panelBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${coloresPanel.textColor}`}>
                    <Utensils size={14} /> Detalle
                  </span>
                  
                  {pedidoSeleccionado.estado === 'CONFIRMADO' ? (
                    <span className={`flex items-center gap-1 bg-white text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm text-[#70a344]`}>
                      <CheckCircle2 size={12} strokeWidth={3} /> CONFIRMADO
                    </span>
                  ) : ['EN_PRODUCCION', 'ENTREGADO'].includes(pedidoSeleccionado.estado || '') ? (
                    <span className={`flex items-center gap-1 bg-white text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm text-purple-600`}>
                      <CheckCircle2 size={12} strokeWidth={3} /> {pedidoSeleccionado.estado === 'EN_PRODUCCION' ? 'EN PRODUCCIÓN' : 'ENTREGADO'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-white text-slate-500 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm">
                      PENDIENTE
                    </span>
                  )}
                </div>
                
                <ul className="space-y-2 mt-2">
                  {Array.isArray(pedidoSeleccionado.listaPlatos) && pedidoSeleccionado.listaPlatos.length > 0 ? (
                    pedidoSeleccionado.listaPlatos.map((plato, index) => (
                      <li key={index} className="flex items-start gap-2 text-[13px] font-bold text-[#1d2d50] leading-snug">
                        <span className={coloresPanel.textColor}>•</span>
                        <span>{plato}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs font-bold text-slate-400 uppercase">Sin detalles</li>
                  )}
                </ul>
              </div>
            );
          })()}

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
                    onClick={() => manejarAsignacionManual(tipo)}
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
