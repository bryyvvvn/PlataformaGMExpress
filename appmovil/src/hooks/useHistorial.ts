import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../constants/api';

export interface EstadoFecha {
  almuerzo: boolean;
  cena: boolean;
}

export type EstadoFechas = Record<string, EstadoFecha>;

export const useHistorial = (usuarioId: string | undefined) => {
  const [historial, setHistorial] = useState<any[]>([]);
  // 🔥 Mapa de qué comidas (almuerzo/cena) se pidieron cada día
  const [estadoFechas, setEstadoFechas] = useState<EstadoFechas>({});
  const [cargando, setCargando] = useState(false);

  const cargarHistorial = useCallback(async () => {
    if (!usuarioId) return;

    setCargando(true);
    try {
      // Verifica que esta URL se imprima bien en la consola
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}&historial=true`;
      console.log("Consultando historial en:", url);

      const res = await fetch(url);
      const data = await res.json();

      // Si la respuesta no es un array, retornar vacío
      if (!Array.isArray(data)) {
        setHistorial([]);
        setEstadoFechas({});
        return;
      }

      setHistorial(data);

      const nuevoEstado: EstadoFechas = {};
      data.forEach((pedido: any) => {
        if (!pedido?.fecha) return;
        const fechaStr = String(pedido.fecha).split('T')[0];
        if (!nuevoEstado[fechaStr]) {
          nuevoEstado[fechaStr] = { almuerzo: false, cena: false };
        }
        if (pedido.esCena) {
          nuevoEstado[fechaStr].cena = true;
        } else {
          nuevoEstado[fechaStr].almuerzo = true;
        }
      });
      setEstadoFechas(nuevoEstado);
    } catch (e) {
      console.error("Fallo al obtener datos:", e);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  return { historial, estadoFechas, cargando, cargarHistorial };
};