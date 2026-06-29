import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';
import type { EstadoHorarioResponse } from '../components/HorarioBloqueado';

export const useHorario = (usuarioId: string | undefined, token: string | null | undefined) => {
  const [estadoHorario, setEstadoHorario]   = useState<EstadoHorarioResponse | null>(null);
  const [cargandoHorario, setCargandoHorario] = useState(true);

  useEffect(() => {
    // Esperamos a tener usuarioId Y que el token haya resuelto (undefined = todavía cargando)
    if (!usuarioId || token === undefined) return;

    let cancelado = false;

    const fetchHorario = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/trabajador/horario?usuarioId=${usuarioId}`,
          {
            cache: 'no-store',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const data: EstadoHorarioResponse = await res.json();
        if (!cancelado) setEstadoHorario(data);
      } catch {
        if (!cancelado) setEstadoHorario({ permitido: true, fechaBloqueada: null });
      } finally {
        if (!cancelado) setCargandoHorario(false);
      }
    };

    fetchHorario();
    return () => { cancelado = true; };
  }, [usuarioId, token]);

  return { estadoHorario, cargandoHorario };
};