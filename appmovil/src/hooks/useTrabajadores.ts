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
        setCargando(false);
        return;
      }

      // 🔥 Volvemos a activar el estado de carga al cambiar la fecha
      setCargando(true);

      try {
        let url = `${API_BASE_URL}/api/representante/dashboard?empresaId=${empresaId}`;
        if (fechaSeleccionada) {
          url += `&fecha=${fechaSeleccionada}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setResumenEmpresa(data.resumenEmpresa);
          setTrabajadores(data.planilla || []);
        } else {
          setTrabajadores([]);
        }
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