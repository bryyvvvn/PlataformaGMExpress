import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';
// Si quieres, puedes importar la interfaz Plato desde donde la tengas definida
// import { Plato } from './useMenuAPI'; 

export const useOtrosPlatos = (shouldFetch: boolean, token?: string | null) => {
  const [otrosPlatos, setOtrosPlatos] = useState<any[]>([]); // Cambia any[] por Plato[] si importaste la interfaz
  const [loadingOtros, setLoadingOtros] = useState(false);

  useEffect(() => {
    let cancel = false;
    const cargar = async () => {
      // 🔥 Ahora también esperamos a que el token exista
      if (!shouldFetch || !token) return; 
      
      setLoadingOtros(true);
      try {
        // 🔥 Agregamos el header con el token de Clerk
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
  }, [shouldFetch, token]); // 🔥 Agregamos el token a las dependencias

  return { otrosPlatos, loadingOtros };
};