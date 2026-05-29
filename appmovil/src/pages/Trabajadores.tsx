import React from 'react';
import { ArrowLeft, Users, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePerfil } from '../hooks/usePerfil';
import { useTrabajadores } from '../hooks/useTrabajadores';

const Trabajadores: React.FC = () => {
  const navigate = useNavigate();
  const { rol, empresaId, empresaNombre } = usePerfil();
  const { resumenEmpresa, trabajadores, cargando } = useTrabajadores(empresaId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-500">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-5 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
        >
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
            {Array.from({ length: Math.max(1, Math.min(resumenEmpresa?.totalTrabajadores ?? 3, 8)) }).map((_, n) => (
              <div key={n} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse" />
                <div className="flex flex-col flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : trabajadores.length > 0 ? (
          <div className="space-y-4 max-w-md mx-auto">
            {trabajadores.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-[#70a344] font-black text-lg shadow-inner">
                  {t.nombre ? t.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold text-[#1d2d50]">{t.nombre}</span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Trabajador</span>
                </div>
                <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
                  <Info size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Trabajadores;