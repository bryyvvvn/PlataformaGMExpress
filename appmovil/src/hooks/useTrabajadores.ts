import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';

export interface ResumenEmpresa {
  totalTrabajadores: number;
  pedidosListos: number;
  enviadoAGM: boolean;
  permiteCena?: boolean;
}

export const useTrabajadores = (empresaId: number | null, fechaSeleccionada?: string, token?: string | null) => {
  const [resumenEmpresa, setResumenEmpresa] = useState<ResumenEmpresa | null>(null);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tokenListo, setTokenListo] = useState(false);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
  }, [token]);

  useEffect(() => {
    const obtenerDatos = async () => {
      if (!empresaId) {
        setResumenEmpresa(null);
        setTrabajadores([]);
        setCargando(false);
        return;
      }

      if (!tokenListo) return;

      setCargando(true);

      try {
        const headers: HeadersInit = { 'Authorization': `Bearer ${tokenRef.current}` };

        // 🔥 PARALELO: ambos fetch al mismo tiempo en vez de secuencial
        const resumenUrl = `${API_BASE_URL}/api/representante/resumen?empresaId=${empresaId}`;
        let empleadosUrl = `${API_BASE_URL}/api/representante/empleados?empresaId=${empresaId}`;
        if (fechaSeleccionada) {
          empleadosUrl += `&fecha=${fechaSeleccionada}`;
        }

        const [resumenRes, empleadosRes] = await Promise.all([
          fetch(resumenUrl, { headers }),
          fetch(empleadosUrl, { headers }),
        ]);

        // Procesar resumen
        const resumenData = resumenRes.ok ? await resumenRes.json() : null;
        if (resumenData) {
          setResumenEmpresa(resumenData);
        }

        // Procesar empleados
        const empleadosData = empleadosRes.ok ? await empleadosRes.json() : [];
        const empleados = Array.isArray(empleadosData) ? empleadosData : [];
        setTrabajadores(
          empleados.map((empleado) => ({
            ...empleado,
            nombre: empleado?.nombre ?? 'Usuario sin nombre',
            pedidos: Array.isArray(empleado?.pedidos) ? empleado.pedidos : [],
          }))
        );
      } catch (error) {
        console.error("[useTrabajadores] Error al cargar los datos:", error);
        setTrabajadores([]);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [empresaId, fechaSeleccionada, tokenListo]);

  return { resumenEmpresa, trabajadores, cargando };
};