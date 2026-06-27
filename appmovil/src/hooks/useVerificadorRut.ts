// src/hooks/useVerificadorRut.ts
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useVerificadorRut = (clerkId: string | undefined, token?: string | null) => {
  const [requiereRut, setRequiereRut] = useState(false);
  const [guardandoRut, setGuardandoRut] = useState(false);

  // 1. Efecto para verificar si le falta el RUT al cargar
  useEffect(() => {
    const fetchPerfil = async () => {
      if (!clerkId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/perfil?clerkId=${clerkId}`);
        if (res.ok) {
          const data = await res.json();
          // Si el perfil existe pero NO tiene RUT, levantamos la bandera
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

  // 2. Función para guardar el RUT nuevo
  const guardarRutAPI = async (rut: string) => {
    setGuardandoRut(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/usuarios/rut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ clerkId, rut })
      });
      
      const data = await res.json();

      if (res.ok) {
        setRequiereRut(false); // Éxito: ocultamos el modal
        return { success: true };
      } else {
        return { success: false, error: data.error || "Ocurrió un error al guardar el RUT." };
      }
    } catch (e) {
      console.error(e);
      return { success: false, error: "Error de conexión al guardar el RUT." };
    } finally {
      setGuardandoRut(false);
    }
  };

  return { requiereRut, guardandoRut, guardarRutAPI };
};