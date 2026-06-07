import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export interface ResumenEmpresa {
  totalTrabajadores: number;
  pedidosListos: number;
  enviadoAGM: boolean;
}

export const useTrabajadores = (empresaId: number | null, fechaSeleccionada?: string) => {
  const [resumenEmpresa, setResumenEmpresa] = useState<ResumenEmpresa | null>(null);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      if (!empresaId) {
        return; // Esperar a que llegue el empresaId, sin cambiar cargando
      }

      setCargando(true);

      try {
        // Obtener resumen de la empresa
        const resumenUrl = `${API_BASE_URL}/api/representante/resumen?empresaId=${empresaId}`;
        const resumenRes = await fetch(resumenUrl);
        const resumenData = resumenRes.ok ? await resumenRes.json() : null;
        if (resumenData) {
          setResumenEmpresa(resumenData);
        }

        // Obtener empleados con pedidos de la semana
        let empleadosUrl = `${API_BASE_URL}/api/representante/empleados?empresaId=${empresaId}`;
        if (fechaSeleccionada) {
          empleadosUrl += `&fecha=${fechaSeleccionada}`;
        }
        const empleadosRes = await fetch(empleadosUrl);
        const empleadosData = empleadosRes.ok ? await empleadosRes.json() : [];
        setTrabajadores(empleadosData || []);
      } catch (error) {
        console.error("[useTrabajadores] Error al cargar los datos:", error);
        setTrabajadores([]);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [empresaId, fechaSeleccionada]);

  return { resumenEmpresa, trabajadores, cargando };
};