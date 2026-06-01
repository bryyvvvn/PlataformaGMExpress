// src/pages/auth/AccesoDenegado.tsx
import React from 'react';
import { useAuth } from '@clerk/clerk-react';

const AccesoDenegado: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-red-500 text-2xl font-black">!</span>
      </div>
      <h1 className="text-2xl font-black text-[#1d2d50] mb-3">Acceso Restringido</h1>
      <p className="text-gray-500 mb-8 text-sm px-4">
        Las cuentas de Administrador son de uso exclusivo para la plataforma Web. Por favor, inicia sesión con una cuenta de Trabajador o Representante.
      </p>
      
      <button 
        onClick={() => signOut()}
        className="w-full max-w-[200px] py-3 bg-[#1d2d50] text-white rounded-xl font-black text-sm shadow-md active:scale-95 transition-transform"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default AccesoDenegado;