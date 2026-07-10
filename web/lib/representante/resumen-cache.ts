const CACHE_TTL_MS = 1000 * 60 * 5;
const MAX_CACHE_ENTRIES = 30;

type ResumenCacheEntry = {
  data: unknown;
  timestamp: number;
};

// Cache en memoria por proceso. Si Railway escala a multiples instancias,
// se requiere cache externa o invalidacion distribuida.
const resumenCache = new Map<string, ResumenCacheEntry>();

export function getResumenCacheKey(empresaId: number, fechaInicio: string, fechaFin: string): string {
  return `resumen:${empresaId}:${fechaInicio}:${fechaFin}`;
}

export function limpiarResumenCacheViejo() {
  if (resumenCache.size > MAX_CACHE_ENTRIES) {
    resumenCache.clear();
  }
}

export function getResumenCache(cacheKey: string) {
  const cached = resumenCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp >= CACHE_TTL_MS) {
    resumenCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

export function setResumenCache(cacheKey: string, data: unknown) {
  resumenCache.set(cacheKey, { data, timestamp: Date.now() });
}

export function invalidarResumenCachePorEmpresa(empresaId: number) {
  const prefix = `resumen:${empresaId}:`;

  for (const cacheKey of resumenCache.keys()) {
    if (cacheKey.startsWith(prefix)) {
      resumenCache.delete(cacheKey);
    }
  }
}

export function obtenerResumenCacheStats() {
  return {
    entries: resumenCache.size,
    ttlMs: CACHE_TTL_MS,
  };
}
