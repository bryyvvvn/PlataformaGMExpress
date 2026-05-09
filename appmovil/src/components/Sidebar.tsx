import React from 'react';
import { X, Calendar, Settings, ChevronRight, LogOut, UserCircle } from 'lucide-react';
import { useUser, useClerk, SignOutButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Panel a la Derecha */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85%] max-w-[350px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1d2d50]">GM Express</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Perfil Compacto */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-[2rem] mb-8 border border-gray-100">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt="Avatar" 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <UserCircle size={48} className="text-gray-300" />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Usuario</span>
              <span className="text-sm font-black text-[#1d2d50] truncate max-w-[150px]">
                {user?.firstName || user?.username}
              </span>
            </div>
          </div>

          {/* Navegación - Solo Historial y Ajustes */}
          <nav className="space-y-3">
            <Link 
              to="/historial" 
              onClick={onClose}
              className="w-full flex justify-between items-center p-5 bg-white border border-gray-100 rounded-[2rem] active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-4 text-gray-700 font-black">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-500 shadow-sm">
                  <Calendar size={22} />
                </div>
                <span>Mi Historial</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500" />
            </Link>

            <button 
              onClick={() => { openUserProfile(); onClose(); }}
              className="w-full flex justify-between items-center p-5 bg-white border border-gray-100 rounded-[2rem] active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-4 text-gray-700 font-black">
                <div className="bg-gray-50 p-2 rounded-xl text-gray-500 shadow-sm">
                  <Settings size={22} />
                </div>
                <span>Ajustes de Perfil</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500" />
            </button>
          </nav>
        </div>

        {/* Botón de Salir */}
        <div className="p-6 border-t border-gray-50">
          <SignOutButton>
            <button className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-500 rounded-[2rem] font-black hover:bg-red-100 transition-colors active:scale-95">
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  );
};