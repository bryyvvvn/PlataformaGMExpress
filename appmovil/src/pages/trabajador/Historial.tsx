import React, { useEffect, useRef } from 'react';
import { Utensils, ArrowLeft, Clock, Info } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useHistorial } from '../../hooks/useHistorial';
import { useClerkToken } from '../../hooks/useClerkToken';
import { useNavigate } from 'react-router-dom';
import LoadingView from '../../components/LoadingView';

export const Historial: React.FC = () => {
  const { user } = useUser();
  const { token: clerkToken } = useClerkToken();
  const navigate = useNavigate();
  
  const { historial, cargando, cargarHistorial } = useHistorial(user?.id, clerkToken);
  const cargaInicialLista = useRef(false);

  useEffect(() => {
    if (user?.id && clerkToken && !cargaInicialLista.current) {
      cargarHistorial();
      cargaInicialLista.current = true;
    }
  }, [user?.id, clerkToken, cargarHistorial]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-500">
      
      {/* CABECERA */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-5 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-black text-[#1d2d50]">Mi Historial</h1>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 pb-20">
        {(cargando || clerkToken === undefined) ? (
          <LoadingView message="Cargando historial..." />
        ) : historial.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-gray-100 p-10">
            <Clock size={40} className="text-gray-200" />
            <p className="text-sm text-gray-400 font-medium">Aún no has realizado pedidos</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            {historial.map((ped: any) => {
              if (!ped.detalles || ped.detalles.length === 0) {
                return (
                  <div key={ped.id} className="flex items-center gap-2 text-xs text-gray-400 p-3 bg-gray-100/50 rounded-xl border border-gray-100">
                    <Info size={14} className="text-gray-300" />
                    <span>Pedido sin registros recientes</span>
                  </div>
                );
              }

              return (
                <div key={ped.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  
                  {/* SECCION DE FECHA */}
                  <div className="flex items-center mb-4 pb-3 border-b border-gray-50">
                    <span className="text-xl font-bold text-gray-700 capitalize">
                      {new Intl.DateTimeFormat('es-CL', { 
                        weekday: 'long', day: 'numeric', month: 'long' 
                      }).format(new Date(ped.fecha))}
                    </span>
                  </div>

                  {/* LISTA DE PLATOS CATEGORIZADOS */}
                  <div className="flex flex-col gap-4 mt-2">
                    {(() => {
                      const entradas = ped.detalles.filter((d: any) => d.plato?.categoria === 'ENTRADA');
                      const fondos = ped.detalles.filter((d: any) => d.plato?.categoria === 'FONDO');
                      const postres = ped.detalles.filter((d: any) => d.plato?.categoria === 'POSTRE');
                      const bebestibles = ped.detalles.filter((d: any) => ['JUGO', 'BEBIDA', 'AGUA_SABORIZADA'].includes(d.plato?.categoria));
                      const otros = ped.detalles.filter((d: any) => !['ENTRADA', 'FONDO', 'POSTRE', 'JUGO', 'BEBIDA', 'AGUA_SABORIZADA'].includes(d.plato?.categoria));

                      const renderCategoria = (titulo: string, detalles: any[]) => {
                        if (detalles.length === 0) return null;
                        return (
                          <div className="flex flex-col gap-2.5">
                            <span className="text-[12px] font-bold text-[#1d2d50] uppercase tracking-widest leading-none">{titulo}</span>
                            {detalles.map((det: any) => (
                              <div key={det.id} className="flex items-center gap-3">
                                <div className="bg-green-50 p-2 rounded-2xl shrink-0">
                                  <Utensils size={14} className="text-[#70a344]" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600">{det.plato.nombre}</span>
                              </div>
                            ))}
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderCategoria('Entrada', entradas)}
                          {renderCategoria('Fondo', fondos)}
                          {renderCategoria('Postre', postres)}
                          {renderCategoria('Bebestible', bebestibles)}
                          {renderCategoria('Otros', otros)}
                        </>
                      );
                    })()}
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