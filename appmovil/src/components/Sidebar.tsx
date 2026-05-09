import React, { useEffect, useState } from 'react';
import { X, Utensils, Calendar, Settings, ChevronRight, ArrowLeft } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useHistorial } from '../hooks/useHistorial';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Definimos los tipos de vista
type VistaMenu = 'inicio' | 'historial';

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [vista, setVista] = useState<VistaMenu>('inicio'); // Estado de navegación interna
  
  const { historial, cargando, cargarHistorial } = useHistorial(user?.id);

  // Resetear a la vista de inicio cada vez que se cierra el menú
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setVista('inicio'), 300); // Esperamos a que termine la animación
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && vista === 'historial') {
      cargarHistorial();
    }
  }, [isOpen, vista, cargarHistorial]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-[85%] max-w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* HEADER DINÁMICO */}
        <div className="p-6 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            {vista === 'historial' && (
              <button onClick={() => setVista('inicio')} className="p-1 hover:bg-gray-100 rounded-lg mr-1">
                <ArrowLeft size={20} className="text-[#1d2d50]" />
              </button>
            )}
            <h2 className="font-black text-xl text-[#1d2d50]">
              {vista === 'inicio' ? 'Mi Menú' : 'Mi Historial'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        {/* --- VISTA INICIAL --- */}
        {vista === 'inicio' && (
          <div className="flex flex-col h-full">
            {/* Perfil */}
            <div 
              onClick={() => openUserProfile()}
              className="p-6 flex justify-between items-center bg-gray-50 hover:bg-gray-100 cursor-pointer border-b"
            >
              <div className="flex items-center gap-4">
                <img src={user?.imageUrl} alt="profile" className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm" />
                <div>
                  <h3 className="font-bold text-lg text-[#1d2d50]">{user?.firstName || 'Usuario'}</h3>
                  <p className="text-sm text-gray-500 truncate max-w-[150px]">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              <Settings size={20} className="text-gray-400" />
            </div>

            {/* BOTÓN HACIA EL HISTORIAL */}
            <div className="p-4">
              <button 
                onClick={() => setVista('historial')}
                className="w-full flex justify-between items-center p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-50 rounded-xl text-green-600">
                    <Calendar size={22} />
                  </div>
                  <span className="font-bold text-[#1d2d50]">Historial de Pedidos</span>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>
            </div>
          </div>
        )}

        {/* --- VISTA DE HISTORIAL --- */}
        {vista === 'historial' && (
          <div className="p-6 h-[calc(100%-80px)] overflow-y-auto bg-gray-50">
            {cargando ? (
              <div className="flex justify-center py-20 italic text-gray-400">Cargando historial...</div>
            ) : historial.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 font-medium">No tienes pedidos anteriores.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historial.map((ped: any) => (
                  <div key={ped.id} className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                      <span className="text-xs font-black px-2 py-1 bg-green-50 text-green-700 rounded-md">
                        {new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ped.fecha))}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">#{ped.id}</span>
                    </div>
                    <div className="space-y-2">
                      {ped.detalles.map((det: any) => (
                        <div key={det.id} className="text-sm text-gray-700 flex items-start gap-2">
                          <Utensils size={14} className="text-[#70a344] shrink-0 mt-1"/> 
                          <span className="font-medium">{det.plato.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};