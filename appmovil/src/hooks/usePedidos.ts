import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';

export interface PedidoPayload {
  entradasIds?: number[];
  fondoId?: number | null;
  postreId?: number | null;
  jugoId?: number | null;
  guarnicionId?: number | null;
  esFinDeSemana?: boolean;
  tipoFinde?: string | null;
  esCena?: boolean;
  tipoCena?: string | null;
  observacion?: string | null;
}

// 🔥 MEMORIA GLOBAL PARA LOS PEDIDOS
// Estructura: { "2026-07-01-user123-almuerzo": { existe: true, pedido: {...} } }
const cacheGlobalPedidos: Record<string, { existe: boolean; pedido: any | null }> = {};

export const usePedidos = (
  usuarioId: string | undefined,
  fecha?: string,
  token?: string | null,
  esCena: boolean = false
) => {
  const cacheKey = `${fecha || 'hoy'}-${usuarioId}-${esCena ? 'cena' : 'almuerzo'}`;
  const dataEnCache = cacheGlobalPedidos[cacheKey];

  const [yaPedioHoy, setYaPedioHoy] = useState(dataEnCache ? dataEnCache.existe : false);
  const [cargandoVerificacion, setCargandoVerificacion] = useState(!dataEnCache);
  const [pedidoExistente, setPedidoExistente] = useState<any | null>(dataEnCache ? dataEnCache.pedido : null);
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [tokenListo, setTokenListo] = useState(false);

  // 🔥 EL ARREGLO DEL PARPADEO
  const [fechaActual, setFechaActual] = useState(fecha);
  const [esCenaActual, setEsCenaActual] = useState(esCena);
  
  if (fecha !== fechaActual || esCena !== esCenaActual) {
    setFechaActual(fecha);
    setEsCenaActual(esCena);
    
    const cacheNuevo = cacheGlobalPedidos[cacheKey];
    if (cacheNuevo) {
      setYaPedioHoy(cacheNuevo.existe);
      setPedidoExistente(cacheNuevo.pedido);
      setCargandoVerificacion(false); // Apagado instantáneo 🚀
    } else {
      setYaPedioHoy(false);
      setPedidoExistente(null);
      setCargandoVerificacion(true);
    }
  }

  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
    if (!token && token !== undefined) setCargandoVerificacion(false);
  }, [token]);

  // Le agregamos ignorarCache por si el usuario acaba de crear/borrar un pedido
  const refrescarVerificacion = useCallback(async (ignorarCache = false) => {
    if (!usuarioId || !tokenListo || !tokenRef.current) return;

    // Si no forzamos la recarga y ya tenemos los datos en RAM, abortamos el viaje a Railway
    if (!ignorarCache && cacheGlobalPedidos[cacheKey]) return;

    setCargandoVerificacion(true);
    if (ignorarCache) {
      setPedidoExistente(null);
      setYaPedioHoy(false);
    }

    try {
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}&esCena=${esCena}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      
      // 🔥 Guardamos en la memoria RAM
      cacheGlobalPedidos[cacheKey] = { existe: data.existe, pedido: data.pedido ?? null };
      
      setYaPedioHoy(data.existe);
      setPedidoExistente(data.pedido ?? null);
    } catch (e) {
      console.error('[usePedidos] Error al verificar pedido:', e);
    } finally {
      setCargandoVerificacion(false);
    }
  }, [usuarioId, fecha, esCena, tokenListo, cacheKey]);

  useEffect(() => {
    refrescarVerificacion();
  }, [refrescarVerificacion]);

  const enviarPedido = async (pedido: PedidoPayload): Promise<boolean> => {
    if (!usuarioId || !tokenRef.current) return false;
    setEnviando(true);
    try {
      const payload = {
        usuarioId,
        entradasIds: pedido.entradasIds || [],
        fondoId: pedido.fondoId ?? null,
        postreId: pedido.postreId ?? null,
        jugoId: pedido.jugoId ?? null,
        guarnicionId: pedido.guarnicionId === -1 ? null : pedido.guarnicionId ?? null,
        fecha: fecha ?? undefined,
        esFinDeSemana: pedido.esFinDeSemana ?? false,
        tipoFinde: pedido.tipoFinde ?? null,
        esCena: pedido.esCena ?? false,
        tipoCena: pedido.tipoCena ?? null,
        observacion: pedido.observacion?.trim() || null,
      };

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        // 🔥 Forzamos la actualización pasándole 'true' a refrescarVerificacion
        await refrescarVerificacion(true); 
        return true;
      }

      let errorData: any = null;
      try { errorData = await respuesta.json(); } catch (e) { /* ignore */ }

      if (respuesta.status === 403) { alert('El horario de pedidos ha cerrado.'); return false; }
      if (respuesta.status === 409) { setYaPedioHoy(true); return false; }

      alert(`Error: ${errorData?.error || 'No se pudo procesar el pedido'}`);
      return false;
    } catch (error) {
      alert(`Fallo de conexión con el servidor: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const eliminarPedido = async (fechaParam?: string): Promise<boolean> => {
    if (!usuarioId || !tokenRef.current) return false;
    setEliminando(true);
    try {
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fechaParam ? `&fecha=${fechaParam}` : (fecha ? `&fecha=${fecha}` : '')}&esCena=${esCena}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
      });
      if (res.ok) {
        // 🔥 Forzamos la actualización para que el caché sepa que ya no hay pedido
        await refrescarVerificacion(true);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      setEliminando(false);
    }
  };

  const enviarItems = async (items: Array<{ platoId: number; guarnicionId?: number | null; cantidad?: number }>, observacion?: string | null): Promise<boolean> => {
    if (!usuarioId || !tokenRef.current) return false;
    setEnviando(true);
    try {
      const payload = {
        usuarioId,
        items,
        fecha: fecha ?? undefined,
        observacion: observacion?.trim() || null,
        esCena,
      };

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        // 🔥 Forzamos actualización
        await refrescarVerificacion(true);
        return true;
      }

      let errorData: any = null;
      try { errorData = await respuesta.json(); } catch (e) { /* ignore */ }

      if (respuesta.status === 403) { alert('El horario de pedidos ha cerrado.'); return false; }
      if (respuesta.status === 409) { setYaPedioHoy(true); return false; }

      alert(`Error: ${errorData?.error || 'No se pudo procesar el pedido'}`);
      return false;
    } catch (error) {
      alert(`Fallo de conexión con el servidor`);
      return false;
    } finally {
      setEnviando(false);
    }
  };

  return { yaPedioHoy, pedidoExistente, cargandoVerificacion, enviarPedido, enviarItems, enviando, refrescarVerificacion, eliminarPedido, eliminando };
};