// src/hooks/useBloqueoDias.ts
import { useState, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useBloqueoDias = (token?: string | null) => {
  const [loadingDia, setLoadingDia] = useState<number | null>(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const toggleDiaBloqueado = async (usuarioId: number, diaNum: number, onSuccess: (nuevosDias: number[]) => void) => {
    setLoadingDia(diaNum);
    try {
      const res = await fetch(`${API_BASE_URL}/api/representante/bloqueos`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify({ usuarioId, diaSemana: diaNum })
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data.diasBloqueados); // Actualiza la UI
      }
    } catch (e) {
      console.error("Error al modificar bloqueo:", e);
    } finally {
      setLoadingDia(null);
    }
  };

  return { toggleDiaBloqueado, loadingDia };
};