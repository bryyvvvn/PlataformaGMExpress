export type MenuCacheEntry<TData> = {
  data: TData;
  timestamp: number;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 14;
const MAX_CACHE_DAYS = 7;

// Cache en memoria por proceso. Si Railway escala a multiples instancias,
// se requiere cache externa o invalidacion distribuida.
const serverMenuCache = new Map<string, MenuCacheEntry<unknown>>();

export function getMenuCacheKey(fecha: string): string {
  return `menu-semanal:${fecha}:base`;
}

export function cleanupMenuCacheIfNeeded() {
  if (serverMenuCache.size > MAX_CACHE_DAYS) {
    serverMenuCache.clear();
  }
}

export function getMenuCache<TData>(fecha: string): MenuCacheEntry<TData> | null {
  const cacheKey = getMenuCacheKey(fecha);
  const entry = serverMenuCache.get(cacheKey) as MenuCacheEntry<TData> | undefined;

  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    serverMenuCache.delete(cacheKey);
    return null;
  }

  return entry;
}

export function setMenuCache<TData>(fecha: string, data: TData): void {
  serverMenuCache.set(getMenuCacheKey(fecha), {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateMenuCacheForDate(fecha: string): void {
  serverMenuCache.delete(getMenuCacheKey(fecha));
}

export function invalidateMenuCacheForDates(fechas: string[]): void {
  fechas.forEach(invalidateMenuCacheForDate);
}
