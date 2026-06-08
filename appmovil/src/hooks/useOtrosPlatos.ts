// src/hooks/useOtrosPlatos.ts
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useOtrosPlatos = (shouldFetch: boolean) => {
  const [otrosPlatos, setOtrosPlatos] = useState<any[]>([]);
  const [loadingOtros, setLoadingOtros] = useState(false);

  useEffect(() => {
    let cancel = false;
    const cargar = async () => {
      if (!shouldFetch) return; // Solo busca si está en la pestaña OTRO
      
      setLoadingOtros(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/trabajador/otros`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancel) setOtrosPlatos(data.platos || []);
      } catch (e) {
        console.error('Error cargando otros:', e);
      } finally {
        if (!cancel) setLoadingOtros(false);
      }
    };

    cargar();

    return () => { cancel = true; };
  }, [shouldFetch]);

  return { otrosPlatos, loadingOtros };
};