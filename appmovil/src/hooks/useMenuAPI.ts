import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../constants/api";

export interface Guarnicion { id: number; nombre: string; }
export interface Plato { id: number; nombre: string; url_imagen: string | null; categoria: "ENTRADA" | "FONDO" | "POSTRE" | "JUGO" | "BEBIDA" | "AGUA_SABORIZADA" | "CANJE" | "SANDWICH" | "SNACK"; tipo: "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "PLATO_UNICO"; calorias?: number | null; proteinas?: number | null; carbohidratos?: number | null; grasas?: number | null; guarniciones: Guarnicion[]; menuDetalleId?: number; }
export interface MenuDia { entradas: Plato[]; fondos: Plato[]; postres: Plato[]; menuDia: { entrada?: Plato | null; fondo?: Plato | null; postre?: Plato | null; guarnicion?: Guarnicion | null; entradasSeleccionadas?: Plato[]; entradaDisplay?: string | null; bebida?: Plato | null; } | null; convenio?: { trabajaFinDeSemana?: boolean | null; permiteCena?: boolean | null; }; }

type MenuDateInput = string | Date;

const __DEV__ = import.meta.env.DEV;
const MENU_VACIO: MenuDia = { entradas: [], fondos: [], postres: [], menuDia: null };

const menuCache = new Map<string, MenuDia>();
const menuRequestsInFlight = new Map<string, Promise<MenuDia>>();
const menuCacheVersions = new Map<string, number>();

const normalizeMenuDate = (fecha: MenuDateInput) => {
  if (fecha instanceof Date) {
    return fecha.toISOString().slice(0, 10);
  }

  return String(fecha).slice(0, 10);
};

const getMenuCacheKey = (usuarioId: string, fechaNormalizada: string, esCena: boolean) =>
  `menu:${usuarioId}:${fechaNormalizada}:${esCena ? "cena" : "almuerzo"}`;

const getMenuCacheVersion = (cacheKey: string) => menuCacheVersions.get(cacheKey) ?? 0;

const bumpMenuCacheVersion = (cacheKey: string) => {
  menuCacheVersions.set(cacheKey, getMenuCacheVersion(cacheKey) + 1);
};

const deleteMenuCacheKeys = (shouldDelete: (cacheKey: string) => boolean) => {
  const keys = new Set([...menuCache.keys(), ...menuRequestsInFlight.keys()]);

  keys.forEach((key) => {
    if (!shouldDelete(key)) return;

    bumpMenuCacheVersion(key);
    menuCache.delete(key);
    menuRequestsInFlight.delete(key);
  });
};

export const invalidateMenuCache = (fecha?: MenuDateInput, esCena?: boolean) => {
  if (fecha === undefined) {
    deleteMenuCacheKeys(() => true);
    return;
  }

  const fechaNormalizada = normalizeMenuDate(fecha);

  if (typeof esCena === "boolean") {
    const suffix = `:${fechaNormalizada}:${esCena ? "cena" : "almuerzo"}`;
    deleteMenuCacheKeys((key) => key.endsWith(suffix));
    return;
  }

  const almuerzoSuffix = `:${fechaNormalizada}:almuerzo`;
  const cenaSuffix = `:${fechaNormalizada}:cena`;
  deleteMenuCacheKeys((key) => key.endsWith(almuerzoSuffix) || key.endsWith(cenaSuffix));
};

const fetchMenuBackend = async ({
  cacheKey,
  esCena,
  fechaNormalizada,
  requestVersion,
  token,
  usuarioId,
}: {
  cacheKey: string;
  esCena: boolean;
  fechaNormalizada: string;
  requestVersion: number;
  token: string;
  usuarioId: string;
}) => {
  if (__DEV__) {
    console.log("[useMenuAPI] MENU FETCH START", cacheKey);
  }

  const params = new URLSearchParams();
  params.set("fecha", fechaNormalizada);
  params.set("usuarioId", usuarioId);
  params.set("esCena", esCena ? "true" : "false");
  const url = `${API_BASE_URL}/api/trabajador/menu-semanal?${params.toString()}`;

  const respuesta = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (__DEV__) {
    console.log("[useMenuAPI] BACKEND CACHE", {
      cache: respuesta.headers.get("X-Menu-Cache"),
      cacheKey: respuesta.headers.get("X-Menu-Cache-Key"),
      durationMs: respuesta.headers.get("X-Menu-Duration-Ms"),
      fecha: respuesta.headers.get("X-Menu-Fecha"),
    });
  }

  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status}`);
  }

  const datos = (await respuesta.json()) as MenuDia;

  if (getMenuCacheVersion(cacheKey) === requestVersion) {
    menuCache.set(cacheKey, datos);
  }

  if (__DEV__) {
    console.log("[useMenuAPI] MENU FETCH END", cacheKey);
  }

  return datos;
};

const getOrCreateMenuRequest = ({
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
  const cacheKey = getMenuCacheKey(usuarioId, fechaNormalizada, esCena);

  if (menuCache.has(cacheKey)) {
    if (__DEV__) {
      console.log("[useMenuAPI] MENU LOCAL CACHE HIT", cacheKey);
    }

    return Promise.resolve(menuCache.get(cacheKey) ?? MENU_VACIO);
  }

  const requestInFlight = menuRequestsInFlight.get(cacheKey);
  if (requestInFlight) {
    if (__DEV__) {
      console.log("[useMenuAPI] MENU FETCH DEDUPE", cacheKey);
    }

    return requestInFlight;
  }

  if (__DEV__) {
    console.log("[useMenuAPI] MENU LOCAL CACHE MISS", cacheKey);
  }

  const requestVersion = getMenuCacheVersion(cacheKey);
  const requestBase = fetchMenuBackend({
    cacheKey,
    esCena,
    fechaNormalizada,
    requestVersion,
    token,
    usuarioId,
  });

  let request: Promise<MenuDia>;
  request = requestBase.finally(() => {
    if (menuRequestsInFlight.get(cacheKey) === request) {
      menuRequestsInFlight.delete(cacheKey);
    }
  });

  menuRequestsInFlight.set(cacheKey, request);
  return request;
};

export const precargarMenus = async ({
  esCena, // Lo dejamos aquí para que no se rompan las llamadas en otras pantallas
  fechas,
  token,
  usuarioId,
}: {
  esCena?: boolean;
  fechas: MenuDateInput[];
  token: string | null | undefined;
  usuarioId: string | undefined;
}) => {
  if (!usuarioId || !token) return;

  const fechasNormalizadas = Array.from(
    new Set(fechas.map(normalizeMenuDate).filter(Boolean))
  );

  await Promise.all(
    fechasNormalizadas.map(async (fechaNormalizada) => {
      try {
        // 1. Pedimos a internet SOLO el almuerzo (Ahorramos la mitad del ancho de banda y la fila)
        const datos = await getOrCreateMenuRequest({
          esCena: false,
          fechaNormalizada,
          token,
          usuarioId,
        });

        // 2. 🔥 TRUCO MÁGICO: Clonamos silenciosamente la respuesta en el caché de la CENA.
        // Así, cuando toques "Cenas", el celular cargará al instante sin volver a ir a internet.
        const cenaCacheKey = getMenuCacheKey(usuarioId, fechaNormalizada, true);
        if (!menuCache.has(cenaCacheKey)) {
          menuCache.set(cenaCacheKey, datos);
          bumpMenuCacheVersion(cenaCacheKey);
        }
      } catch (error) {
        console.error("[useMenuAPI] Error precargando:", error);
      }
    })
  );
};

export const useMenuAPI = (
  fecha?: MenuDateInput,
  usuarioId?: string,
  token?: string | null,
  esCena = false
) => {
  const fechaNormalizada = useMemo(
    () => (fecha ? normalizeMenuDate(fecha) : ""),
    [fecha]
  );

  const cacheKey = useMemo(
    () => (usuarioId && fechaNormalizada ? getMenuCacheKey(usuarioId, fechaNormalizada, esCena) : ""),
    [usuarioId, fechaNormalizada, esCena]
  );

  const menuEnCacheInicial = cacheKey ? menuCache.get(cacheKey) : undefined;

  const [menuFetch, setMenuFetch] = useState<MenuDia>(menuEnCacheInicial ?? MENU_VACIO);
  const [cargando, setCargando] = useState<boolean>(Boolean(cacheKey && !menuEnCacheInicial));

  useEffect(() => {
    let cancelado = false;

    if (!cacheKey || !usuarioId || !fechaNormalizada) {
      setCargando(false);
      return;
    }

    if (menuCache.has(cacheKey)) {
      if (__DEV__) {
        console.log("[useMenuAPI] MENU LOCAL CACHE HIT", cacheKey);
      }

      setMenuFetch(menuCache.get(cacheKey) ?? MENU_VACIO);
      setCargando(false);
      return;
    }

    if (__DEV__) {
      console.log("[useMenuAPI] MENU LOCAL CACHE MISS", cacheKey);
    }

    const requestInFlight = menuRequestsInFlight.get(cacheKey);
    if (requestInFlight) {
      if (__DEV__) {
        console.log("[useMenuAPI] MENU FETCH DEDUPE", cacheKey);
      }

      const waitVersion = getMenuCacheVersion(cacheKey);
      setCargando(true);
      requestInFlight
        .then((datos) => {
          if (!cancelado && getMenuCacheVersion(cacheKey) === waitVersion) {
            setMenuFetch(datos);
          }
        })
        .catch((error) => {
          console.error("[useMenuAPI] Error al cargar menu:", error);
          if (!cancelado) setMenuFetch(MENU_VACIO);
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });

      return () => { cancelado = true; };
    }

    if (!token) {
      setCargando(true);
      return;
    }

    const requestVersion = getMenuCacheVersion(cacheKey);
    const requestBase = fetchMenuBackend({
      cacheKey,
      esCena,
      fechaNormalizada,
      requestVersion,
      token,
      usuarioId,
    });

    let request: Promise<MenuDia>;
    request = requestBase.finally(() => {
      if (menuRequestsInFlight.get(cacheKey) === request) {
        menuRequestsInFlight.delete(cacheKey);
      }
    });

    menuRequestsInFlight.set(cacheKey, request);
    const waitVersion = getMenuCacheVersion(cacheKey);
    setCargando(true);

    request
      .then((datos) => {
        if (!cancelado && getMenuCacheVersion(cacheKey) === waitVersion) {
          setMenuFetch(datos);
        }
      })
      .catch((error) => {
        console.error("[useMenuAPI] Error al cargar menu:", error);
        if (!cancelado) setMenuFetch(MENU_VACIO);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => { cancelado = true; };
  }, [cacheKey, fechaNormalizada, usuarioId, token]);

  const menuEnCache = cacheKey ? menuCache.get(cacheKey) : undefined;

  return {
    menuHoy: menuEnCache ?? menuFetch,
    cargando: menuEnCache ? false : cargando
  };
};
