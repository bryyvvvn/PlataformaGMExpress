// src/hooks/useVerificadorRut.ts
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useVerificadorRut = (clerkId: string | undefined, token?: string | null) => {
  const [requiereRut, setRequiereRut] = useState(false);
  const [guardandoRut, setGuardandoRut] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!clerkId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/perfil?clerkId=${clerkId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.rut) {
            setRequiereRut(true);
          }
        }
      } catch (error) {
        console.error("Error obteniendo perfil en verificador:", error);
      }
    };
    fetchPerfil();
  }, [clerkId]);

  const guardarRutAPI = async (rut: string, telefono: string) => {
    setGuardandoRut(true);
    try {
      // 🔥 ARMAMOS EL NÚMERO COMPLETO AQUÍ
      const telefonoCompleto = `+569${telefono}`;

      const res = await fetch(`${API_BASE_URL}/api/usuarios/rut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        // 🔥 ENVIAMOS EL TELÉFONO COMPLETO AL BACKEND
        body: JSON.stringify({ clerkId, rut, telefono: telefonoCompleto }) 
      });
      
      const data = await res.json();

      if (res.ok) {
        setRequiereRut(false);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Ocurrió un error al guardar los datos." };
      }
    } catch (e) {
      console.error(e);
      return { success: false, error: "Error de conexión al guardar los datos." };
    } finally {
      setGuardandoRut(false);
    }
  };

  return { requiereRut, guardandoRut, guardarRutAPI };
};