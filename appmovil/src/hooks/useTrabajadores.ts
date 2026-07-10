import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../constants/api';

export interface ResumenEmpresa {
  totalTrabajadores: number;
  pedidosListos: number;
  enviadoAGM: boolean;
  permiteCena?: boolean;
}

type TrabajadoresCacheData = {
  resumenEmpresa: ResumenEmpresa | null;
  trabajadores: any[];
};

const __DEV__ = import.meta.env.DEV;
const CACHE_TTL_MS = 1000 * 60 * 2;
const trabajadoresCache = new Map<string, { data: TrabajadoresCacheData; timestamp: number }>();
const trabajadoresRequestsInFlight = new Map<string, Promise<TrabajadoresCacheData>>();

const normalizarFecha = (fecha?: string) => String(fecha || '').slice(0, 10);

const getTrabajadoresCacheKey = (empresaId: number | null, fechaInicio: string, fechaFin?: string) =>
  `representante:${empresaId ?? 'sin-empresa'}:${fechaInicio || 'hoy'}:${fechaFin || fechaInicio || 'sin-fin'}`;

const normalizarTrabajadores = (empleadosData: unknown) => {
  const empleados = Array.isArray(empleadosData) ? empleadosData : [];

  return empleados.map((empleado) => ({
    ...empleado,
    nombre: empleado?.nombre ?? 'Usuario sin nombre',
    pedidos: Array.isArray(empleado?.pedidos) ? empleado.pedidos : [],
  }));
};

const fetchTrabajadoresBackend = async ({
  cacheKey,
  empresaId,
  fechaInicio,
  fechaFin,
  token,
  forceRefresh,
}: {
  cacheKey: string;
  empresaId: number;
  fechaInicio: string;
  fechaFin?: string;
  token: string;
  forceRefresh: boolean;
}) => {
  if (__DEV__) {
    console.log('[useTrabajadores] FETCH START', cacheKey);
  }

  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  const params = new URLSearchParams({ empresaId: String(empresaId) });
  if (fechaInicio) params.set('fechaInicio', fechaInicio);
  if (fechaFin) params.set('fechaFin', fechaFin);
  if (fechaInicio && !fechaFin) params.set('fecha', fechaInicio);
  if (forceRefresh) params.set('refresh', '1');
  const resumenUrl = `${API_BASE_URL}/api/representante/resumen?${params.toString()}`;
  const empleadosUrl = `${API_BASE_URL}/api/representante/empleados?${params.toString()}`;

  const [resumenRes, empleadosRes] = await Promise.all([
    fetch(resumenUrl, { headers }),
    fetch(empleadosUrl, { headers }),
  ]);

  if (!empleadosRes.ok) {
    throw new Error(`Error cargando trabajadores: ${empleadosRes.status}`);
  }

  const [resumenData, empleadosData] = await Promise.all([
    resumenRes.ok ? resumenRes.json() : Promise.resolve(null),
    empleadosRes.json(),
  ]);

  const data = {
    resumenEmpresa: resumenData,
    trabajadores: normalizarTrabajadores(empleadosData),
  };

  trabajadoresCache.set(cacheKey, { data, timestamp: Date.now() });

  if (__DEV__) {
    console.log('[useTrabajadores] FETCH END', cacheKey, {
      empleadosCache: empleadosRes.headers.get('X-Empleados-Cache'),
      resumenCache: resumenRes.headers.get('X-Resumen-Cache'),
    });
  }

  return data;
};

const getOrCreateTrabajadoresRequest = ({
  empresaId,
  fechaInicio,
  fechaFin,
  token,
  forceRefresh = false,
}: {
  empresaId: number;
  fechaInicio: string;
  fechaFin?: string;
  token: string;
  forceRefresh?: boolean;
}) => {
  const cacheKey = getTrabajadoresCacheKey(empresaId, fechaInicio, fechaFin);
  const cached = trabajadoresCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    if (__DEV__) {
      console.log('[useTrabajadores] LOCAL CACHE HIT', cacheKey);
    }

    return Promise.resolve(cached.data);
  }

  const inFlight = trabajadoresRequestsInFlight.get(cacheKey);
  if (!forceRefresh && inFlight) {
    if (__DEV__) {
      console.log('[useTrabajadores] FETCH DEDUPE', cacheKey);
    }

    return inFlight;
  }

  if (__DEV__) {
    console.log(forceRefresh ? '[useTrabajadores] LOCAL CACHE REFRESH' : '[useTrabajadores] LOCAL CACHE MISS', cacheKey);
  }

  const requestBase = fetchTrabajadoresBackend({
    cacheKey,
    empresaId,
    fechaInicio,
    fechaFin,
    token,
    forceRefresh,
  });

  let request: Promise<TrabajadoresCacheData>;
  request = requestBase.finally(() => {
    if (trabajadoresRequestsInFlight.get(cacheKey) === request) {
      trabajadoresRequestsInFlight.delete(cacheKey);
    }
  });

  trabajadoresRequestsInFlight.set(cacheKey, request);
  return request;
};

export const actualizarDiasBloqueadosTrabajadorEnCache = (
  usuarioId: number | string,
  diasBloqueados: number[]
) => {
  const usuarioIdNormalizado = String(usuarioId);

  for (const [cacheKey, cacheValue] of trabajadoresCache.entries()) {
    const trabajadoresActualizados = cacheValue.data.trabajadores.map((trabajador) => {
      if (String(trabajador?.id) !== usuarioIdNormalizado) return trabajador;
      return { ...trabajador, diasBloqueados };
    });

    trabajadoresCache.set(cacheKey, {
      ...cacheValue,
      data: {
        ...cacheValue.data,
        trabajadores: trabajadoresActualizados,
      },
      timestamp: Date.now(),
    });
  }
};

export const invalidarTrabajadoresCachePorEmpresa = (empresaId: number | null) => {
  const prefix = `representante:${empresaId ?? 'sin-empresa'}:`;

  for (const cacheKey of trabajadoresCache.keys()) {
    if (cacheKey.startsWith(prefix)) {
      trabajadoresCache.delete(cacheKey);
    }
  }

  for (const cacheKey of trabajadoresRequestsInFlight.keys()) {
    if (cacheKey.startsWith(prefix)) {
      trabajadoresRequestsInFlight.delete(cacheKey);
    }
  }
};

export const useTrabajadores = (
  empresaId: number | null,
  fechaSeleccionada?: string,
  token?: string | null,
  fechaFinSeleccionada?: string
) => {
  const fechaInicioNormalizada = useMemo(() => normalizarFecha(fechaSeleccionada), [fechaSeleccionada]);
  const fechaFinNormalizada = useMemo(() => normalizarFecha(fechaFinSeleccionada), [fechaFinSeleccionada]);
  const cacheKey = useMemo(
    () => getTrabajadoresCacheKey(empresaId, fechaInicioNormalizada, fechaFinNormalizada),
    [empresaId, fechaInicioNormalizada, fechaFinNormalizada]
  );
  const dataEnCache = trabajadoresCache.get(cacheKey)?.data;

  const [resumenEmpresa, setResumenEmpresa] = useState<ResumenEmpresa | null>(dataEnCache?.resumenEmpresa ?? null);
  const [trabajadores, setTrabajadores] = useState<any[]>(dataEnCache?.trabajadores ?? []);
  const [cargando, setCargando] = useState(Boolean(empresaId && !dataEnCache));
  const [error, setError] = useState<Error | null>(null);
  const [tokenListo, setTokenListo] = useState(false);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
    if (!token && token !== undefined) setCargando(false);
  }, [token, tokenListo]);

  useEffect(() => {
    const cached = trabajadoresCache.get(cacheKey)?.data;
    if (cached) {
      setResumenEmpresa(cached.resumenEmpresa);
      setTrabajadores(cached.trabajadores);
      setCargando(false);
      setError(null);
    } else if (empresaId) {
      setCargando(true);
    } else {
      setResumenEmpresa(null);
      setTrabajadores([]);
      setCargando(false);
      setError(null);
    }
  }, [cacheKey, empresaId]);

  const cargarDatos = useCallback(async (forceRefresh = false) => {
    if (!empresaId) {
      setResumenEmpresa(null);
      setTrabajadores([]);
      setCargando(false);
      setError(null);
      return;
    }

    if (!tokenListo || !tokenRef.current) return;

    const cached = trabajadoresCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setResumenEmpresa(cached.data.resumenEmpresa);
      setTrabajadores(cached.data.trabajadores);
      setCargando(false);
      setError(null);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const data = await getOrCreateTrabajadoresRequest({
        empresaId,
        fechaInicio: fechaInicioNormalizada,
        fechaFin: fechaFinNormalizada,
        token: tokenRef.current,
        forceRefresh,
      });

      setResumenEmpresa(data.resumenEmpresa);
      setTrabajadores(data.trabajadores);
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err));
      console.error('[useTrabajadores] Error al cargar los datos:', nextError);
      setError(nextError);

      const fallback = trabajadoresCache.get(cacheKey)?.data;
      if (fallback) {
        setResumenEmpresa(fallback.resumenEmpresa);
        setTrabajadores(fallback.trabajadores);
      }
    } finally {
      setCargando(false);
    }
  }, [cacheKey, empresaId, fechaInicioNormalizada, fechaFinNormalizada, tokenListo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const refrescarTrabajadores = useCallback(() => cargarDatos(true), [cargarDatos]);

  return { resumenEmpresa, trabajadores, cargando, error, refrescarTrabajadores };
};
