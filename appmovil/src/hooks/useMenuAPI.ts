import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useMenuAPI = () => {
  const [menuHoy, setMenuHoy] = useState({ entradas: [], fondos: [], postres: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/menu-semanal`);
        if (respuesta.ok) {
          const datosReales = await respuesta.json();
          setMenuHoy(datosReales);
        }
      } catch (error) {
        console.error("Error API:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarMenu();
  }, []);

  return { menuHoy, cargando };
};