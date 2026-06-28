import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useHistorial = (usuarioId: string | undefined) => {
  const [historial, setHistorial] = useState([]);
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
        return;
      }

      setHistorial(data);
    } catch (e) {
      console.error("Fallo al obtener datos:", e);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  return { historial, cargando, cargarHistorial };
};