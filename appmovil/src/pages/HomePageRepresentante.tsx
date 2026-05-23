import React, { useState } from 'react';
import { Menu, Send, Users, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { THEME } from '../constants/theme';
import { Sidebar } from '../components/Sidebar';
import { TarjetaTrabajador } from '../components/TarjetaTrabajador';
import { useTrabajadores } from '../hooks/useTrabajadores'; 
import { useCalendario } from '../hooks/useCalendario';
import { API_BASE_URL } from '../constants/api';

interface HomePageRepresentanteProps {
  empresaId: number | null;
  empresaNombre: string;
}

const HomePageRepresentante: React.FC<HomePageRepresentanteProps> = ({ empresaId, empresaNombre }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [enviandoTodo, setEnviandoTodo] = useState(false);
  
  const { setSemanaOffset, getSemanaTexto, fechaSeleccionadaISO, fechaTexto } = useCalendario();
  const { resumenEmpresa, trabajadores, cargando } = useTrabajadores(empresaId, fechaSeleccionadaISO);

  const manejarEnviarTodo = async () => {
    if (trabajadores.length === 0) return;

    const confirmar = window.confirm(
      `¿Estás seguro de enviar y confirmar la planilla de ${getSemanaTexto().toLowerCase()}? Los trabajadores ya no podrán modificar sus pedidos.`
    );
    if (!confirmar) return;

    setEnviandoTodo(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/representante/enviar-planilla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaId,
          fecha: fechaSeleccionadaISO
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`¡Planilla enviada a GM Express con éxito! Se confirmaron ${data.pedidosConfirmados} pedidos.`);
        window.location.reload(); 
      } else {
        alert("Hubo un problema al intentar enviar la planilla. Intenta de nuevo.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión con el servidor.");
    } finally {
      setEnviandoTodo(false);
    }
  };

  // 🔥 1. Calculamos la CANTIDAD TOTAL de pedidos en toda la semana
  const totalPedidos = trabajadores.reduce((acc, t) => acc + (t.pedidos?.length || 0), 0);

  // 🔥 2. Verificamos si queda algún pedido PENDIENTE
  const hayPedidosPendientes = trabajadores.some(t => 
    t.pedidos && t.pedidos.some((p: any) => p.estado === 'PENDIENTE')
  );

  return (
    <div className="min-h-screen pb-36" style={{ backgroundColor: THEME.colors.background }}>
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        rolPropVisible="Representante"
        empresaNombre={empresaNombre}
      />

      {/* HEADER PRINCIPAL */}
      <div className="pt-5 pb-3 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }}>
        <h1 className="text-[24px] font-black italic text-white m-0 leading-none">
          GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span>
        </h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </div>
      <div className="h-1 w-full" style={{ backgroundColor: THEME.colors.primary }} />

      {/* DETALLES DE LA EMPRESA */}
      <div className="px-6 pt-7 pb-10 text-white rounded-b-[40px] shadow-lg" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-xl font-bold opacity-95">{empresaNombre || 'Mi Empresa'}</h2>
        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">{fechaTexto}</p>
      </div>

      {/* MÉTRICA: SOLO EQUIPO */}
      {resumenEmpresa && !cargando && (
        <div 
          className="mx-6 -mt-8 p-5 rounded-3xl shadow-2xl bg-white border-b-4 transition-all flex items-center gap-4"
          style={{ borderBottomColor: THEME.colors.primary }}
        >
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-500">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5 tracking-widest">Total del Equipo</p>
            <p className="text-2xl font-black tracking-tight text-[#1B2C56]">
              {resumenEmpresa.totalTrabajadores} {resumenEmpresa.totalTrabajadores === 1 ? 'Trabajador' : 'Trabajadores'}
            </p>
          </div>
        </div>
      )}

      {/* PLANILLA RESUMEN */}
      <div className="mt-8 px-6">
        <h3 className="font-black text-sm text-[#1d2d50] uppercase tracking-wider pl-1 mb-4">Planilla Resumen</h3>

        {/* CONTROLES DE SEMANA */}
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

        {cargando ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm animate-pulse h-16" />
            ))}
          </div>
        ) : trabajadores.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-gray-100 shadow-sm text-gray-400 text-sm font-medium">
            Ningún trabajador ha registrado pedidos para {getSemanaTexto().toLowerCase()} aún.
          </div>
        ) : (
          <div className="space-y-3">
            {trabajadores.map((trabajador) => (
              <TarjetaTrabajador key={trabajador.id} trabajador={trabajador} />
            ))}
          </div>
        )}
      </div>

      {/* BOTÓN DE CIERRE FIJO DINÁMICO */}
      {!cargando && trabajadores.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30">
          
          {totalPedidos === 0 ? (
            // 1. SI NADIE HA PEDIDO NADA AÚN
            <button 
              disabled
              className="w-full h-14 bg-gray-100 text-gray-400 rounded-[20px] font-black text-base shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Send size={16} />
              Esperando pedidos
            </button>
          ) : hayPedidosPendientes ? (
            // 2. SI HAY PEDIDOS PENDIENTES
            <button 
              onClick={manejarEnviarTodo}
              disabled={enviandoTodo}
              className="w-full h-14 bg-[#70a344] text-white rounded-[20px] font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:bg-gray-300"
            >
              <Send size={16} />
              {enviandoTodo ? 'Enviando planilla...' : `Enviar planilla`}
            </button>
          ) : (
            // 3. SI TODOS LOS PEDIDOS ESTÁN CONFIRMADOS
            <div className="w-full h-14 bg-gray-100 text-gray-400 rounded-[20px] font-black text-sm shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest">
              <CheckCircle2 size={18} className="text-gray-400" />
                Planilla Confirmada
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default HomePageRepresentante;