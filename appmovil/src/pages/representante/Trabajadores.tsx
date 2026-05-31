import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, CalendarOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePerfil } from '../../hooks/usePerfil';
import { useTrabajadores } from '../../hooks/useTrabajadores';
import { API_BASE_URL } from '../../constants/api';

// Componente individual para manejar el estado de cada trabajador sin recargar toda la lista
const TarjetaTrabajadorListado = ({ t }: { t: any }) => {
  const [diasBloqueados, setDiasBloqueados] = useState<number[]>(t.diasBloqueados || []);
  const [loadingDia, setLoadingDia] = useState<number | null>(null);

  // Sincroniza el estado local cuando los datos asíncronos llegan desde el servidor
  useEffect(() => {
    if (t.diasBloqueados) {
      setDiasBloqueados(t.diasBloqueados);
    }
  }, [t.diasBloqueados]);

  // Días ordenados con la 'M' clásica para el miércoles
  const DIAS = [
    { num: 1, letra: 'L' }, { num: 2, letra: 'M' }, 
    { num: 3, letra: 'M' }, { num: 4, letra: 'J' }, { num: 5, letra: 'V' }
  ];

  const toggleDia = async (diaNum: number) => {
    setLoadingDia(diaNum);
    try {
      // Usamos tu ruta personalizada de conveniencia
      const res = await fetch(`${API_BASE_URL}/api/representante/bloqueos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: t.id, diaSemana: diaNum })
      });
      if (res.ok) {
        const data = await res.json();
        setDiasBloqueados(data.diasBloqueados);
      }
    } catch (e) {
      console.error("Error al modificar bloqueo:", e);
    } finally {
      setLoadingDia(null);
    }
  };

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4 transition-all mb-4">
      <div className="flex items-center gap-4">
        {/* AVATAR: Fondo verde claro y texto institucional */}
        <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-[#70a344] font-black text-lg shadow-inner shrink-0">
          {t.nombre ? t.nombre.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-sm font-bold text-[#1d2d50] capitalize">{t.nombre.toLowerCase()}</span>
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
            Trabajador Activo
          </span>
        </div>
        <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
          <Info size={18} />
        </button>
      </div>

      {/* Panel de Gestión de Días */}
      <div className="pt-3 border-t border-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <CalendarOff size={12} /> Gestión de Días Permanentes
          </span>
        </div>
        <div className="flex gap-2">
          {DIAS.map(dia => {
            const isBlocked = diasBloqueados.includes(dia.num);
            const isLoad = loadingDia === dia.num;

            return (
              <button
                key={dia.num}
                onClick={() => toggleDia(dia.num)}
                disabled={isLoad}
                // Colores claros y estéticos: Verde claro tipo perfil por defecto y Rojo pastel al bloquear
                className={`flex-1 aspect-square rounded-2xl flex items-center justify-center font-black text-sm transition-all border active:scale-95 disabled:opacity-70 ${
                  isBlocked 
                    ? 'bg-red-50 border-red-200 text-red-500 shadow-inner' 
                    : 'bg-green-50 border-green-100 text-[#70a344] hover:bg-green-100'
                }`}
              >
                {isLoad ? <Loader2 size={16} className="animate-spin" /> : dia.letra}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const Trabajadores: React.FC = () => {
  const navigate = useNavigate();
  const { empresaId, empresaNombre } = usePerfil();
  const { resumenEmpresa, trabajadores, cargando } = useTrabajadores(empresaId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-500">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-5 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-[#1d2d50]">Trabajadores</h1>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{empresaNombre}</span>
        </div>
      </header>

      <main className="flex-1 p-6 pb-20">
        {cargando ? (
          <div className="space-y-4 max-w-md mx-auto">
            {/* Esqueleto de Carga */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-[2rem] border border-gray-100 p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-1 bg-gray-100 w-full" />
                <div className="flex gap-2 h-10">
                  {[1, 2, 3, 4, 5].map(j => <div key={j} className="flex-1 bg-gray-200 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : trabajadores.length > 0 ? (
          <div className="space-y-4 max-w-md mx-auto">
            {trabajadores.map((t) => (
              <TarjetaTrabajadorListado key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-10 text-sm font-medium">
            No hay trabajadores registrados en esta empresa.
          </div>
        )}
      </main>
    </div>
  );
};

export default Trabajadores;