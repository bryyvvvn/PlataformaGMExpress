import React, { useEffect } from 'react';
import { Utensils, ArrowLeft, Clock, Info } from 'lucide-react'; // Añadido Info icon
import { useUser } from '@clerk/clerk-react';
import { useHistorial } from '../hooks/useHistorial';
import { useNavigate } from 'react-router-dom';
import LoadingView from '../components/LoadingView';

export const Historial: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { historial, cargando, cargarHistorial } = useHistorial(user?.id);

  useEffect(() => {
    if (user?.id) cargarHistorial();
  }, [user?.id, cargarHistorial]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-500">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-5 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-black text-[#1d2d50]">Mi Historialasdasd</h1>
      </header>

      <main className="flex-1 p-6 pb-20">
        {cargando ? (
          <LoadingView message="Cargando historial..." />
        ) : historial.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-gray-100 p-10">
            <Clock size={40} className="text-gray-200" />
            <p className="text-sm text-gray-400 font-medium">Aún no has realizado pedidos</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            {historial.map((ped: any) => {
              // VALIDACIÓN: Si el pedido no tiene detalles, no mostramos la tarjeta
              if (!ped.detalles || ped.detalles.length === 0) {
                return (
                  <div key={ped.id} className="flex items-center gap-2 text-xs text-gray-400 p-3 bg-gray-100/50 rounded-xl border border-gray-100">
                    <Info size={14} className="text-gray-300" />
                    <span>Pedido #{ped.id} sin registros recientes</span>
                  </div>
                );
              }

              // Renderizado normal de la tarjeta si hay detalles
              return (
                <div key={ped.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Fecha pedido</span>
                      <span className="text-sm font-bold text-gray-700">
                        {new Intl.DateTimeFormat('es-CL', { 
                          weekday: 'short', day: 'numeric', month: 'long' 
                        }).format(new Date(ped.fecha))}
                      </span>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold">
                      #{ped.id}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {ped.detalles.map((det: any) => (
                      <div key={det.id} className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-2xl">
                          <Utensils size={14} className="text-[#70a344]" />
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{det.plato.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Historial;