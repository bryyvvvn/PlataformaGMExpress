import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { API_BASE_URL } from '../constants/api';
import { invalidateMenuCache } from './useMenuAPI';

export interface PedidoPayload {
  entradasIds?: number[];
  fondoId?: number | null;
  postreId?: number | null;
  postreCantidad?: number | null;
  jugoId?: number | null;
  guarnicionId?: number | null;
  esFinDeSemana?: boolean;
  tipoFinde?: string | null;
  esCena?: boolean;
  tipoCena?: string | null;
  observacion?: string | null;
}

type PedidoCache = { existe: boolean; pedido: any | null };

const __DEV__ = import.meta.env.DEV;
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

const getPedidoCacheKey = (
  usuarioId: string | undefined,
  fechaNormalizada: string,
  esCena: boolean
) => `pedido:${usuarioId ?? 'sin-usuario'}:${fechaNormalizada || 'hoy'}:${esCena ? 'cena' : 'almuerzo'}`;

const fetchPedidoBackend = async ({
  esCena,
  fechaNormalizada,
  requestVersion,
  token,
  usuarioId,
  cacheKey,
}: {
  cacheKey: string;
  esCena: boolean;
  fechaNormalizada: string;
  requestVersion: number;
  token: string;
  usuarioId: string;
}) => {
  if (__DEV__) {
    console.log('[usePedidos] PEDIDO FETCH START', cacheKey);
  }

  const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fechaNormalizada ? `&fecha=${fechaNormalizada}` : ''}&esCena=${esCena}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  const pedidoCache = { existe: Boolean(data.existe), pedido: data.pedido ?? null };

  if (getPedidosCacheVersion(cacheKey) === requestVersion) {
    cacheGlobalPedidos[cacheKey] = pedidoCache;
  }

  if (__DEV__) {
    console.log('[usePedidos] PEDIDO FETCH END', cacheKey);
  }

  return pedidoCache;
};

const getOrCreatePedidoRequest = ({
  esCena,
  fechaNormalizada,
  token,
  usuarioId,
}: {
  esCena: boolean;
  fechaNormalizada: string;
  token: string;
  usuarioId: string;
}) => {
  const cacheKey = getPedidoCacheKey(usuarioId, fechaNormalizada, esCena);

  if (cacheGlobalPedidos[cacheKey]) {
    if (__DEV__) {
      console.log('[usePedidos] PEDIDO LOCAL CACHE HIT', cacheKey);
    }

    return Promise.resolve(cacheGlobalPedidos[cacheKey]);
  }

  const requestInFlight = pedidosRequestsInFlight.get(cacheKey);
  if (requestInFlight) {
    if (__DEV__) {
      console.log('[usePedidos] PEDIDO FETCH DEDUPE', cacheKey);
    }

    return requestInFlight;
  }

  if (__DEV__) {
    console.log('[usePedidos] PEDIDO LOCAL CACHE MISS', cacheKey);
  }

  const requestVersion = getPedidosCacheVersion(cacheKey);
  const requestBase = fetchPedidoBackend({
    cacheKey,
    esCena,
    fechaNormalizada,
    requestVersion,
    token,
    usuarioId,
  });

  let request: Promise<PedidoCache>;
  request = requestBase.finally(() => {
    if (pedidosRequestsInFlight.get(cacheKey) === request) {
      pedidosRequestsInFlight.delete(cacheKey);
    }
  });

  pedidosRequestsInFlight.set(cacheKey, request);
  return request;
};

export const precargarPedidos = async ({
  esCena = false,
  fechas,
  token,
  usuarioId,
}: {
  esCena?: boolean;
  fechas: string[];
  token: string | null | undefined;
  usuarioId: string | undefined;
}) => {
  if (!usuarioId || !token) return;

  const fechasNormalizadas = Array.from(
    new Set(fechas.map(normalizePedidoDate).filter(Boolean))
  );

  await Promise.all(
    fechasNormalizadas.map((fechaNormalizada) =>
      getOrCreatePedidoRequest({
        esCena,
        fechaNormalizada,
        token,
        usuarioId,
      }).catch((error) => {
        console.error('[usePedidos] Error precargando pedido:', error);
        return { existe: false, pedido: null };
      })
    )
  );
};

export const usePedidos = (
  usuarioId: string | undefined,
  fecha?: string,
  token?: string | null,
  esCena: boolean = false
) => {
  const fechaNormalizada = useMemo(() => normalizePedidoDate(fecha), [fecha]);
  const cacheKey = useMemo(
    () => getPedidoCacheKey(usuarioId, fechaNormalizada, esCena),
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
      if (__DEV__) {
        console.log('[usePedidos] PEDIDO LOCAL CACHE HIT', cacheKey);
      }

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
        if (__DEV__) {
          console.log('[usePedidos] PEDIDO LOCAL CACHE MISS', cacheKey);
        }

        request = getOrCreatePedidoRequest({
          esCena,
          fechaNormalizada,
          token: tokenRef.current,
          usuarioId,
        });
      } else if (__DEV__) {
        console.log('[usePedidos] PEDIDO FETCH DEDUPE', cacheKey);
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
        postreCantidad: pedido.postreCantidad ?? undefined,
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
