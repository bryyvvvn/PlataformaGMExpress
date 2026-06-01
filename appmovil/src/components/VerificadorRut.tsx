import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE_URL } from '../constants/api';

// 🔥 NUEVO: Función matemática para validar que el RUT sea real
const validarRutChileno = (rutCompleto: string) => {
  const limpio = rutCompleto.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 8) return false;

  let cuerpo = parseInt(limpio.slice(0, -1), 10);
  const dv = limpio.slice(-1);

  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.toString().length; i++) {
    const index = multiplo * parseInt(cuerpo.toString().charAt(cuerpo.toString().length - i), 10);
    suma = suma + index;
    if (multiplo < 7) { multiplo = multiplo + 1; } else { multiplo = 2; }
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

  return dvCalculado === dv;
};

export const VerificadorRut: React.FC = () => {
  const { user } = useUser();
  const [requiereRut, setRequiereRut] = useState(false);
  const [inputRut, setInputRut] = useState('');
  const [guardandoRut, setGuardandoRut] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/perfil?clerkId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.rut) {
            setRequiereRut(true);
          }
        }
      } catch (error) {
        console.error("Error obteniendo perfil:", error);
      }
    };
    fetchPerfil();
  }, [user?.id]);

  const manejarCambioRut = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (valor.length > 1) {
      const cuerpo = valor.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const dv = valor.slice(-1);
      valor = `${cuerpo}-${dv}`;
    }
    setInputRut(valor);
  };

  const guardarRut = async () => {
    if (!validarRutChileno(inputRut)) return alert("Ingresa un RUT válido");
    setGuardandoRut(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/usuarios/rut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user?.id, rut: inputRut })
      });
      
      const data = await res.json();

      if (res.ok) {
        setRequiereRut(false); 
      } else {
        alert(data.error || "Ocurrió un error al guardar el RUT.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al guardar el RUT.");
    } finally {
      setGuardandoRut(false);
    }
  };

  if (!requiereRut) return null;

  // Evaluamos en vivo si el RUT es matemáticamente válido
  const esValido = validarRutChileno(inputRut);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-[#1d2d50]/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-[#70a344]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#70a344]/20">
          <span className="text-2xl font-black text-[#70a344]">ID</span>
        </div>
        <h3 className="font-black text-2xl text-[#1d2d50] mb-2">Último paso</h3>
        <p className="text-gray-500 text-sm mb-6">Para poder utilizar la plataforma, necesitas vincular tu RUT.</p>
        
        <input 
          type="text" 
          placeholder="Ej: 12.345.678-9" 
          value={inputRut}
          onChange={manejarCambioRut}
          maxLength={12}
          className={`w-full text-center font-black text-xl p-4 rounded-xl border-2 bg-gray-50 outline-none transition-all mb-6 text-[#1d2d50] ${
            inputRut.length > 11 && !esValido 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-100 focus:border-[#70a344] focus:bg-white'
          }`}
        />
        
        <button 
          onClick={guardarRut}
          disabled={guardandoRut || !esValido}
          className={`w-full py-4 rounded-xl font-black text-white transition-all shadow-lg ${
            esValido 
              ? 'bg-[#70a344] hover:bg-[#5d8a38] active:scale-95' 
              : 'bg-gray-300 cursor-not-allowed opacity-70'
          }`}
        >
          {guardandoRut ? 'Guardando...' : 'Completar Perfil'}
        </button>
      </div>
    </div>
  );
};