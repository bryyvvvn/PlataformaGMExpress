// src/hooks/useBloqueoDias.ts
import { useState } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useBloqueoDias = () => {
  const [loadingDia, setLoadingDia] = useState<number | null>(null);

  const toggleDiaBloqueado = async (usuarioId: number, diaNum: number, onSuccess: (nuevosDias: number[]) => void) => {
    setLoadingDia(diaNum);
    try {
      const res = await fetch(`${API_BASE_URL}/api/representante/bloqueos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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