import React from 'react';
import { X, Calendar, Settings, ChevronRight, LogOut, UserCircle, Users } from 'lucide-react';
import { useUser, useClerk, SignOutButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { usePerfil } from '../hooks/usePerfil';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  rolPropVisible?: string;
  empresaNombre?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, rolPropVisible, empresaNombre }) => {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  
  const { rol } = usePerfil();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 right-0 h-full w-[75%] max-w-[320px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 flex justify-between items-center border-b border-gray-50">
          {rolPropVisible && empresaNombre ? (
            <div className="flex flex-col leading-none gap-1 overflow-hidden pr-4">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {rolPropVisible}
              </span>
              <span className="text-xl font-black text-[#1d2d50] uppercase tracking-wide truncate">
                {empresaNombre}
              </span>
            </div>
          ) : (
            <h2 className="text-base font-black text-[#1d2d50] uppercase tracking-wide truncate pr-4">
              GM Express
            </h2>
          )}
          
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 flex-shrink-0"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[1.5rem] mb-6 border border-gray-100">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt="Avatar" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <UserCircle size={40} className="text-gray-300" />
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-gray-400 font-black uppercase tracking-wider">Usuario</span>
              <span className="text-lg font-black text-[#1d2d50] truncate">
                {user?.firstName || user?.username}
              </span>
            </div>
          </div>

          <nav className="space-y-3">
            
            {rol === 'TRABAJADOR' && (
              <Link 
                to="/historial" 
                onClick={onClose}
                className="w-full flex justify-between items-center p-4 bg-white border border-gray-100 rounded-[1.5rem] active:scale-95 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3 text-gray-700 font-black text-s">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
                    <Calendar size={18} />
                  </div>
                  <span>Mis Pedidos</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
            )}

            {rol === 'REPRESENTANTE' && (
              <Link 
                to="/trabajadores" 
                onClick={onClose}
                className="w-full flex justify-between items-center p-4 bg-white border border-gray-100 rounded-[1.5rem] active:scale-95 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3 text-gray-700 font-black text-s">
                  <div className="bg-green-50 p-2 rounded-xl text-green-600">
                    <Users size={18} />
                  </div>
                  <span>Trabajadores</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
            )}

            <button 
              onClick={() => { openUserProfile(); onClose(); }}
              className="w-full flex justify-between items-center p-4 bg-white border border-gray-100 rounded-[1.5rem] active:scale-95 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3 text-gray-700 font-black text-s">
                <div className="bg-gray-50 p-2 rounded-xl text-gray-500">
                  <Settings size={18} />
                </div>
                <span>Ajustes</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
            </button>
          </nav>
        </div>

        <div className="p-5 border-t border-gray-50">
          <SignOutButton>
            <button className="w-full h-14 flex items-center justify-center gap-2 bg-red-50 text-red-500 rounded-2xl font-black hover:bg-red-100 transition-colors active:scale-95 text-s">
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  );
};