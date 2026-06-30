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

  // Ref para usar siempre el token más reciente sin causar re-ejecuciones
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // tokenListo pasa a true una sola vez cuando llega el primer token válido
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

        // Obtener resumen de la empresa
        const resumenUrl = `${API_BASE_URL}/api/representante/resumen?empresaId=${empresaId}`;
        const resumenRes = await fetch(resumenUrl, { headers });
        const resumenData = resumenRes.ok ? await resumenRes.json() : null;
        if (resumenData) {
          setResumenEmpresa(resumenData);
        }

        // Obtener empleados con pedidos de la semana
        let empleadosUrl = `${API_BASE_URL}/api/representante/empleados?empresaId=${empresaId}`;
        if (fechaSeleccionada) {
          empleadosUrl += `&fecha=${fechaSeleccionada}`;
        }
        const empleadosRes = await fetch(empleadosUrl, { headers });
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
  }, [empresaId, fechaSeleccionada, tokenListo]); // token fuera — usa tokenRef internamente

  return { resumenEmpresa, trabajadores, cargando };
};
