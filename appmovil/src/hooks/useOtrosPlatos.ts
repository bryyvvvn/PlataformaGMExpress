import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';
export const useOtrosPlatos = (shouldFetch: boolean, token?: string | null) => {
  const [otrosPlatos, setOtrosPlatos] = useState<any[]>([]);
  const [loadingOtros, setLoadingOtros] = useState(false);

  useEffect(() => {
    let cancel = false;
    const cargar = async () => {
      if (!shouldFetch || !token) return; 
      
      setLoadingOtros(true);
      try {
        const headers: HeadersInit = {
          'Authorization': `Bearer ${token}`
        };

        const res = await fetch(`${API_BASE_URL}/api/trabajador/otros`, { headers });
        
        if (!res.ok) {
          console.error('Error del servidor:', res.status);
          return;
        }
        
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
  }, [shouldFetch, token]);

  return { otrosPlatos, loadingOtros };
};