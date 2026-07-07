// src/hooks/useBloqueoDias.ts
import { useState, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';
import { actualizarDiasBloqueadosTrabajadorEnCache } from './useTrabajadores';

export const useBloqueoDias = (token?: string | null) => {
  const [loadingDia, setLoadingDia] = useState<number | null>(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const toggleDiaBloqueado = async (usuarioId: number | string, diaNum: number, onSuccess: (nuevosDias: number[]) => void) => {
    if (!tokenRef.current) {
      alert('No se pudo autenticar la accion. Intenta nuevamente.');
      return false;
    }

    const diaSemana = Number(diaNum);
    if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) {
      console.error('[useBloqueoDias] Dia invalido:', diaNum);
      return false;
    }

    setLoadingDia(diaNum);
    try {
      const res = await fetch(`${API_BASE_URL}/api/representante/bloqueos`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify({ usuarioId: String(usuarioId), diaSemana })
      });

      if (res.ok) {
        const data = await res.json();
        const nuevosDias = Array.isArray(data.diasBloqueados)
          ? data.diasBloqueados.map(Number).filter((dia: number) => Number.isInteger(dia) && dia >= 1 && dia <= 7)
          : [];

        actualizarDiasBloqueadosTrabajadorEnCache(usuarioId, nuevosDias);
        onSuccess(nuevosDias);
        return true;
      }

      const data = await res.json().catch(() => null);
      alert(data?.error || 'No se pudo actualizar el bloqueo del trabajador.');
      return false;
    } catch (e) {
      console.error("Error al modificar bloqueo:", e);
      alert('Error de conexion al actualizar el bloqueo.');
      return false;
    } finally {
      setLoadingDia(null);
    }
  };

  return { toggleDiaBloqueado, loadingDia };
};
