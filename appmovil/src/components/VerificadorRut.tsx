// src/components/VerificadorRut.tsx
import { useClerk } from '@clerk/clerk-react';
import React, { useState } from 'react';
import {
  normalizarTelefonoPerfil,
  useVerificadorRut,
} from '../hooks/useVerificadorRut';

const validarRutChileno = (rutCompleto: string) => {
  const limpio = rutCompleto.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 8) return false;

  const cuerpo = parseInt(limpio.slice(0, -1), 10);
  const dv = limpio.slice(-1);

  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.toString().length; i++) {
    const index =
      multiplo *
      parseInt(cuerpo.toString().charAt(cuerpo.toString().length - i), 10);
    suma += index;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado =
    dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  return dvCalculado === dv;
};

interface VerificadorRutProps {
  onPerfilCompletado?: () => void | Promise<void>;
  onGuardado?: () => void | Promise<void>;
}

export const VerificadorRut: React.FC<VerificadorRutProps> = ({
  onPerfilCompletado,
  onGuardado,
}) => {
  const [inputRut, setInputRut] = useState('');
  const [inputTelefono, setInputTelefono] = useState('');
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const { signOut } = useClerk();
  const { guardandoRut, guardarRutAPI } = useVerificadorRut();

  const manejarCambioRut = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase();

    if (valor.length > 1) {
      const cuerpo = valor.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const dv = valor.slice(-1);
      valor = `${cuerpo}-${dv}`;
    }

    setInputRut(valor);
  };

  const manejarCambioTelefono = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/[^\d+\s]/g, '').replace(/\s+/g, ' ');
    setInputTelefono(valor);
  };

  const manejarGuardado = async () => {
    if (!validarRutChileno(inputRut)) {
      alert('Ingresa un RUT válido');
      return;
    }

    if (!normalizarTelefonoPerfil(inputTelefono)) {
      alert('Ingresa un teléfono válido');
      return;
    }

    const resultado = await guardarRutAPI(inputRut, inputTelefono);

    if (!resultado.success) {
      alert(resultado.error);
      return;
    }

    await (onPerfilCompletado ?? onGuardado)?.();
  };

  const manejarCerrarSesion = async () => {
    if (guardandoRut || cerrandoSesion) return;

    setCerrandoSesion(true);

    try {
      await signOut();
    } catch (error) {
      console.error('[VerificadorRut] Error cerrando sesion:', error);
      alert('No se pudo cerrar sesión. Intenta nuevamente.');
      setCerrandoSesion(false);
    }
  };

  const esRutValido = validarRutChileno(inputRut);
  const esTelefonoValido = Boolean(normalizarTelefonoPerfil(inputTelefono));
  const esTodoValido = esRutValido && esTelefonoValido;

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-[#1d2d50]">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-[#70a344]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#70a344]/20">
          <span className="text-2xl font-black text-[#70a344]">ID</span>
        </div>
        <h3 className="font-black text-2xl text-[#1d2d50] mb-2">
          Último paso
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Completa tus datos para poder utilizar la plataforma.
        </p>

        <input
          type="text"
          placeholder="RUT (Ej: 12.345.678-9)"
          value={inputRut}
          onChange={manejarCambioRut}
          maxLength={12}
          className={`w-full text-center font-black text-lg p-4 rounded-xl border-2 bg-gray-50 outline-none transition-all mb-3 text-[#1d2d50] ${
            inputRut.length > 11 && !esRutValido
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-100 focus:border-[#70a344] focus:bg-white'
          }`}
        />

        <input
          type="tel"
          placeholder="+56 9 2783 2211"
          value={inputTelefono}
          onChange={manejarCambioTelefono}
          maxLength={18}
          className={`w-full text-center font-black text-lg p-4 rounded-xl border-2 bg-gray-50 outline-none transition-all mb-6 text-[#1d2d50] ${
            inputTelefono.length > 0 && !esTelefonoValido
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-100 focus:border-[#70a344] focus:bg-white'
          }`}
        />

        <button
          type="button"
          onClick={manejarGuardado}
          disabled={guardandoRut || !esTodoValido}
          className={`w-full py-4 rounded-xl font-black text-white transition-all shadow-lg ${
            esTodoValido
              ? 'bg-[#70a344] hover:bg-[#5d8a38] active:scale-95'
              : 'bg-gray-300 cursor-not-allowed opacity-70'
          }`}
        >
          {guardandoRut ? 'Guardando...' : 'Completar Perfil'}
        </button>

        <button
          type="button"
          onClick={manejarCerrarSesion}
          disabled={guardandoRut || cerrandoSesion}
          className="mt-3 w-full py-3 rounded-xl border-2 border-gray-100 text-sm font-black text-[#1d2d50] transition-all hover:border-[#70a344]/40 hover:bg-[#70a344]/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </div>
    </main>
  );
};
