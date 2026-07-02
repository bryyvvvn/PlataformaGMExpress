import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { API_BASE_URL } from '../constants/api';
import { invalidateMenuCache } from './useMenuAPI';

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

type PedidoCache = { existe: boolean; pedido: any | null };

const cacheGlobalPedidos: Record<string, PedidoCache> = {};
const pedidosRequestsInFlight = new Map<string, Promise<PedidoCache>>();
const pedidosCacheVersions = new Map<string, number>();

const normalizePedidoDate = (fecha?: string) => String(fecha || '').slice(0, 10);

const getPedidosCacheVersion = (cacheKey: string) => pedidosCacheVersions.get(cacheKey) ?? 0;

const bumpPedidosCacheVersion = (cacheKey: string) => {
  pedidosCacheVersions.set(cacheKey, getPedidosCacheVersion(cacheKey) + 1);
};

const invalidateMenuCacheForPedido = (fechaPedido: string | undefined, esCenaPedido: boolean) => {
  const fechaNormalizada = normalizePedidoDate(fechaPedido);
  if (fechaNormalizada) {
    invalidateMenuCache(fechaNormalizada, esCenaPedido);
  }
};

export const usePedidos = (
  usuarioId: string | undefined,
  fecha?: string,
  token?: string | null,
  esCena: boolean = false
) => {
  const fechaNormalizada = useMemo(() => normalizePedidoDate(fecha), [fecha]);
  const cacheKey = useMemo(
    () => `${fechaNormalizada || 'hoy'}-${usuarioId}-${esCena ? 'cena' : 'almuerzo'}`,
    [fechaNormalizada, usuarioId, esCena]
  );
  const dataEnCache = cacheGlobalPedidos[cacheKey];

  const [yaPedioHoy, setYaPedioHoy] = useState(dataEnCache ? dataEnCache.existe : false);
  const [cargandoVerificacion, setCargandoVerificacion] = useState(!dataEnCache);
  const [pedidoExistente, setPedidoExistente] = useState<any | null>(dataEnCache ? dataEnCache.pedido : null);
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [tokenListo, setTokenListo] = useState(false);

  const [fechaActual, setFechaActual] = useState(fechaNormalizada);
  const [esCenaActual, setEsCenaActual] = useState(esCena);

  if (fechaNormalizada !== fechaActual || esCena !== esCenaActual) {
    setFechaActual(fechaNormalizada);
    setEsCenaActual(esCena);

    const cacheNuevo = cacheGlobalPedidos[cacheKey];
    if (cacheNuevo) {
      setYaPedioHoy(cacheNuevo.existe);
      setPedidoExistente(cacheNuevo.pedido);
      setCargandoVerificacion(false);
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
  }, [token, tokenListo]);

  const refrescarVerificacion = useCallback(async (ignorarCache = false) => {
    if (!usuarioId || !tokenListo || !tokenRef.current) return;

    const pedidoEnCache = cacheGlobalPedidos[cacheKey];
    if (!ignorarCache && pedidoEnCache) {
      setYaPedioHoy(pedidoEnCache.existe);
      setPedidoExistente(pedidoEnCache.pedido);
      setCargandoVerificacion(false);
      return;
    }

    setCargandoVerificacion(true);
    if (ignorarCache) {
      bumpPedidosCacheVersion(cacheKey);
      delete cacheGlobalPedidos[cacheKey];
      pedidosRequestsInFlight.delete(cacheKey);
      setPedidoExistente(null);
      setYaPedioHoy(false);
    }

    try {
      let request = !ignorarCache ? pedidosRequestsInFlight.get(cacheKey) : undefined;

      if (!request) {
        const requestVersion = getPedidosCacheVersion(cacheKey);
        const requestBase = (async () => {
          const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fechaNormalizada ? `&fecha=${fechaNormalizada}` : ''}&esCena=${esCena}`;
          const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${tokenRef.current}` },
          });
          const data = await res.json();
          return { existe: Boolean(data.existe), pedido: data.pedido ?? null };
        })();

        let nuevaRequest: Promise<PedidoCache>;
        nuevaRequest = requestBase
          .then((data) => {
            if (getPedidosCacheVersion(cacheKey) === requestVersion) {
              cacheGlobalPedidos[cacheKey] = data;
            }
            return data;
          })
          .finally(() => {
            if (pedidosRequestsInFlight.get(cacheKey) === nuevaRequest) {
              pedidosRequestsInFlight.delete(cacheKey);
            }
          });

        pedidosRequestsInFlight.set(cacheKey, nuevaRequest);
        request = nuevaRequest;
      }

      const waitVersion = getPedidosCacheVersion(cacheKey);
      const data = await request;
      if (getPedidosCacheVersion(cacheKey) !== waitVersion) return;

      setYaPedioHoy(data.existe);
      setPedidoExistente(data.pedido);
    } catch (e) {
      console.error('[usePedidos] Error al verificar pedido:', e);
    } finally {
      setCargandoVerificacion(false);
    }
  }, [usuarioId, fechaNormalizada, esCena, tokenListo, cacheKey]);

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
        fecha: fechaNormalizada || undefined,
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
        invalidateMenuCacheForPedido(fechaNormalizada, payload.esCena);
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
      alert(`Fallo de conexion con el servidor: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const eliminarPedido = async (fechaParam?: string): Promise<boolean> => {
    if (!usuarioId || !tokenRef.current) return false;
    setEliminando(true);
    try {
      const fechaEliminar = normalizePedidoDate(fechaParam) || fechaNormalizada;
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fechaEliminar ? `&fecha=${fechaEliminar}` : ''}&esCena=${esCena}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
      });
      if (res.ok) {
        invalidateMenuCacheForPedido(fechaEliminar, esCena);
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
        fecha: fechaNormalizada || undefined,
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
        invalidateMenuCacheForPedido(fechaNormalizada, esCena);
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
      alert('Fallo de conexion con el servidor');
      return false;
    } finally {
      setEnviando(false);
    }
  };

  return { yaPedioHoy, pedidoExistente, cargandoVerificacion, enviarPedido, enviarItems, enviando, refrescarVerificacion, eliminarPedido, eliminando };
};
