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
  `${usuarioId}-${fechaNormalizada}-${esCena ? "cena" : "almuerzo"}`;

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
    const suffix = `-${fechaNormalizada}-${esCena ? "cena" : "almuerzo"}`;
    deleteMenuCacheKeys((key) => key.endsWith(suffix));
    return;
  }

  const almuerzoSuffix = `-${fechaNormalizada}-almuerzo`;
  const cenaSuffix = `-${fechaNormalizada}-cena`;
  deleteMenuCacheKeys((key) => key.endsWith(almuerzoSuffix) || key.endsWith(cenaSuffix));
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
        console.log("[useMenuAPI] CACHE HIT", cacheKey);
      }

      setMenuFetch(menuCache.get(cacheKey) ?? MENU_VACIO);
      setCargando(false);
      return;
    }

    if (__DEV__) {
      console.log("[useMenuAPI] CACHE MISS", cacheKey);
    }

    const requestInFlight = menuRequestsInFlight.get(cacheKey);
    if (requestInFlight) {
      if (__DEV__) {
        console.log("[useMenuAPI] REQUEST IN FLIGHT", cacheKey);
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
    const requestBase = (async () => {
      if (__DEV__) {
        console.trace("[useMenuAPI] FETCH BACKEND", cacheKey);
      }

      const params = new URLSearchParams();
      params.set("fecha", fechaNormalizada);
      params.set("usuarioId", usuarioId);
      const url = `${API_BASE_URL}/api/trabajador/menu-semanal?${params.toString()}`;

      const respuesta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      const datos = (await respuesta.json()) as MenuDia;

      if (getMenuCacheVersion(cacheKey) === requestVersion) {
        menuCache.set(cacheKey, datos);
      }

      return datos;
    })();

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
