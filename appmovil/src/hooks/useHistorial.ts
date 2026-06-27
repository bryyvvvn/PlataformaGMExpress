import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useHistorial = (usuarioId: string | undefined) => {
  const [historial, setHistorial] = useState([]);
  // 🔥 NUEVO: Creamos un mapa inteligente que guardará qué comidas se pidieron cada día
  const [estadoFechas, setEstadoFechas] = useState<Record<string, { almuerzo: boolean, cena: boolean }>>({});
  const [cargando, setCargando] = useState(false);

  const cargarHistorial = useCallback(async () => {
    if (!usuarioId) return;
    
    setCargando(true);
    try {
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}&historial=true`;
      const res = await fetch(url);
      const data = await res.json();
      setHistorial(data);

      // 🔥 PROCESAMOS LOS DATOS PARA SEPARAR ALMUERZO Y CENA
      const nuevoEstado: Record<string, { almuerzo: boolean, cena: boolean }> = {};
      
      if (Array.isArray(data)) {
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
      }
      
      setEstadoFechas(nuevoEstado);
    } catch (e) {
      console.error("Fallo al obtener datos:", e);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  return { historial, estadoFechas, cargando, cargarHistorial };
};