import React, { useState } from 'react';
import { Menu, Send, ChevronLeft, ChevronRight, CheckCircle2, ClipboardList, CalendarOff } from 'lucide-react';
import { THEME } from '../../constants/theme';
import { Sidebar } from '../../components/Sidebar';
import { TarjetaTrabajador } from '../../components/TarjetaTrabajador';
import { useTrabajadores } from '../../hooks/useTrabajadores'; 
import { useCalendario } from '../../hooks/useCalendario';
import { usePlanilla } from '../../hooks/usePlanilla';
import { useUser } from '@clerk/clerk-react';
import { useClerkToken } from '../../hooks/useClerkToken';
import type { ConvenioEmpresa } from '../../hooks/usePerfil';

interface HomePageRepresentanteProps {
  empresaId: number | null;
  empresaNombre: string;
  convenio: ConvenioEmpresa | null;
}

const capitalizar = (texto: string | null | undefined) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

const HomePageRepresentante: React.FC<HomePageRepresentanteProps> = ({ empresaId, empresaNombre, convenio }) => {
  const { user } = useUser();
  const { token: clerkToken } = useClerkToken();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { enviarPlanilla, loading: enviandoTodo } = usePlanilla(clerkToken);
  const trabajaFinDeSemana = Boolean(convenio?.trabajaFinDeSemana);
  const permiteCena = Boolean(convenio?.permiteCena);

  const { setSemanaOffset, getSemanaTexto, fechaSeleccionadaISO, fechaTexto, semanaOffset } = useCalendario(trabajaFinDeSemana);
  const { trabajadores, cargando, resumenEmpresa } = useTrabajadores(empresaId, fechaSeleccionadaISO, clerkToken);

  const esSemanaPasada = semanaOffset !== undefined 
    ? semanaOffset < 0 
    : (() => {
        if (!fechaSeleccionadaISO) return false;
        const viewedDate = new Date(fechaSeleccionadaISO + 'T12:00:00');
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        const day = today.getDay() || 7; 
        const monday = new Date(today);
        monday.setDate(today.getDate() - day + 1);
        
        const viewedDay = viewedDate.getDay() || 7;
        const viewedMonday = new Date(viewedDate);
        viewedMonday.setDate(viewedDate.getDate() - viewedDay + 1);
        
        return viewedMonday.getTime() < monday.getTime();
      })();

  const manejarEnviarTodo = async () => {
    if (esSemanaPasada) {
      alert('No puedes enviar ni modificar planillas de semanas anteriores.');
      return;
    }
    
    if (trabajadores.length === 0) return;

    const confirmar = window.confirm(
      `¿Estás seguro de enviar y confirmar la planilla de ${getSemanaTexto().toLowerCase()}? Los trabajadores ya no podrán modificar sus pedidos.`
    );
    if (!confirmar) return;

    if (!empresaId) { alert('Empresa inválida'); return; }
    const { ok, data } = await enviarPlanilla(empresaId, fechaSeleccionadaISO);
    if (ok) {
      alert(`¡Planilla enviada a GM Express con éxito! Se confirmaron ${data?.pedidosConfirmados ?? 0} pedidos.`);
      window.location.reload();
    } else {
      alert('Hubo un problema al intentar enviar la planilla. Intenta de nuevo.');
    }
  };

  const pedidosVisibles = (pedidos: any[] | undefined) =>
    (pedidos || []).filter((pedido: any) => permiteCena || !pedido.esCena);

  const totalPedidos = trabajadores.reduce((acc, t) => acc + pedidosVisibles(t.pedidos).length, 0);
  
  // 🔥 AQUÍ ESTÁ EL ARREGLO: AHORA CONTAMOS CUALQUIER ESTADO QUE SEA SUPERIOR A PENDIENTE
  const pedidosConfirmados = trabajadores.reduce((acc, t) => 
    acc + pedidosVisibles(t.pedidos).filter((p: any) => 
      ['CONFIRMADO', 'EN_PRODUCCION', 'ENTREGADO'].includes(p.estado)
    ).length
  , 0);
  
  const faltanConfirmar = totalPedidos > 0 && pedidosConfirmados < totalPedidos;
  const estaCompletado = totalPedidos > 0 && pedidosConfirmados === totalPedidos;
  const tieneEmpresa = Boolean(empresaId);

  return (
    <div className="min-h-screen pb-36" style={{ backgroundColor: THEME.colors.background }}>
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        rolPropVisible="Representante"
        empresaNombre={empresaNombre}
      />

      <div className="pt-5 pb-3 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }}>
        <h1 className="text-[24px] font-black italic text-white m-0 leading-none">
          GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span>
        </h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </div>
      <div className="h-1 w-full" style={{ backgroundColor: THEME.colors.primary }} />

      <div className="px-6 pt-7 pb-10 text-white rounded-b-[40px] shadow-lg" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-xl font-bold opacity-95">Hola, {capitalizar(user?.firstName)} {capitalizar(user?.lastName)}</h2>
        <p className="text-sm opacity-90 mt-0.5">{empresaNombre || 'Mi Empresa'}</p>
        <p className="text-[10px] opacity-70 mt-2 uppercase font-bold tracking-widest">{fechaTexto}</p>
      </div>

      <div 
        className="mx-6 -mt-8 p-5 rounded-3xl shadow-2xl bg-white border-b-4 transition-all" 
        style={{ borderBottomColor: estaCompletado ? THEME.colors.primary : '#1d2d50' }}
      >
        {!tieneEmpresa ? (
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-slate-50">
              <ClipboardList size={24} className="text-[#1d2d50]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">
                Empresa no asignada
              </p>
              <p className="text-sm font-bold text-[#1B2C56]">
                Solicita asignacion para ver la planilla.
              </p>
            </div>
          </div>
        ) : cargando ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${estaCompletado ? 'bg-green-50' : 'bg-slate-50'}`}>
              <ClipboardList size={24} className={estaCompletado ? 'text-[#70a344]' : 'text-[#1d2d50]'} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">
                {estaCompletado ? 'Planilla Lista' : 'Estado de Planilla'}
              </p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black tracking-tight text-[#1B2C56]">
                  {pedidosConfirmados}/{totalPedidos}
                </p>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Confirmados
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 px-6">
        <h3 className="font-black text-sm text-[#1d2d50] uppercase tracking-wider pl-1 mb-4">Planilla Resumen</h3>

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSemanaOffset(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-transform">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-[10px] font-black uppercase text-[#1d2d50] opacity-60">
            {getSemanaTexto()}
          </span>
          <button onClick={() => setSemanaOffset(1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-transform">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {!tieneEmpresa ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-gray-100 shadow-sm text-gray-400 text-sm font-medium">
            Tu usuario representante no tiene una empresa asociada.
          </div>
        ) : cargando ? (
          <div className="space-y-3">
            {(() => {
              const maxPlaceholders = 8;
              const count = Math.min(resumenEmpresa?.totalTrabajadores ?? 3, maxPlaceholders);
              return Array.from({ length: Math.max(1, count) }).map((_, i) => (
                <div key={i} className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              ));
            })()}
          </div>
        ) : trabajadores.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-gray-100 shadow-sm text-gray-400 text-sm font-medium">
            Aún no hay trabajadores registrados en tu empresa.
          </div>
        ) : (
          <div>
            {trabajadores.map(trabajador => (
              <TarjetaTrabajador 
                key={trabajador.id} 
                trabajador={trabajador} 
                permiteCena={resumenEmpresa?.permiteCena} 
                token={clerkToken} 
              />
            ))}
          </div>
        )}
      </div>

      {tieneEmpresa && !cargando && trabajadores.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30">
          
          {estaCompletado ? (
            <div className="w-full h-14 bg-gray-100 text-gray-400 rounded-[20px] font-black text-sm shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest">
              <CheckCircle2 size={18} className="text-gray-400" />
                Planilla Confirmada
            </div>
          ) : esSemanaPasada ? (
            <button 
              disabled
              className="w-full h-14 bg-gray-100 text-gray-400 rounded-[20px] font-black text-base shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <CalendarOff size={16} />
              Semana Cerrada
            </button>
          ) : totalPedidos === 0 ? (
            <button 
              disabled
              className="w-full h-14 bg-gray-100 text-gray-400 rounded-[20px] font-black text-base shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Send size={16} />
              Esperando pedidos
            </button>
          ) : ( 
            <button 
              onClick={manejarEnviarTodo}
              disabled={enviandoTodo}
              className="w-full h-14 bg-[#70a344] text-white rounded-[20px] font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:bg-gray-300"
            >
              <Send size={16} />
              {enviandoTodo ? 'Enviando planilla...' : `Enviar planilla`}
            </button>
          )}

        </div>
      )}

    </div>
  );
};

export default HomePageRepresentante;