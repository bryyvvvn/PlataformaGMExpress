import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../constants/api";

export interface Guarnicion { id: number; nombre: string; }
export interface Plato { id: number; nombre: string; url_imagen: string | null; categoria: "ENTRADA" | "FONDO" | "POSTRE" | "JUGO" | "BEBIDA" | "AGUA_SABORIZADA" | "CANJE" | "SANDWICH" | "SNACK"; tipo: "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "PLATO_UNICO"; calorias?: number | null; proteinas?: number | null; carbohidratos?: number | null; grasas?: number | null; guarniciones: Guarnicion[]; menuDetalleId?: number; }
export interface MenuDia { entradas: Plato[]; fondos: Plato[]; postres: Plato[]; menuDia: { entrada?: Plato | null; fondo?: Plato | null; postre?: Plato | null; guarnicion?: Guarnicion | null; entradasSeleccionadas?: Plato[]; entradaDisplay?: string | null; bebida?: Plato | null; } | null; convenio?: { trabajaFinDeSemana?: boolean | null; permiteCena?: boolean | null; }; }

const MENU_VACIO: MenuDia = { entradas: [], fondos: [], postres: [], menuDia: null };

const menuCache = new Map<string, MenuDia>();
const menuRequestsInFlight = new Map<string, Promise<MenuDia>>();
const menuCacheVersions = new Map<string, number>();

const getMenuCacheKey = (fecha?: string, esCena = false, usuarioId?: string) =>
  `${fecha || "hoy"}-${esCena ? "cena" : "almuerzo"}-${usuarioId || "anon"}`;

const getMenuCachePrefix = (fecha: string, esCena: boolean) =>
  `${fecha || "hoy"}-${esCena ? "cena" : "almuerzo"}-`;

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

export const invalidateMenuCache = (fecha?: string, esCena?: boolean) => {
  if (!fecha) {
    deleteMenuCacheKeys(() => true);
    return;
  }

  if (typeof esCena === "boolean") {
    const prefix = getMenuCachePrefix(fecha, esCena);
    deleteMenuCacheKeys((key) => key.startsWith(prefix));
    return;
  }

  const almuerzoPrefix = getMenuCachePrefix(fecha, false);
  const cenaPrefix = getMenuCachePrefix(fecha, true);
  deleteMenuCacheKeys((key) => key.startsWith(almuerzoPrefix) || key.startsWith(cenaPrefix));
};

const getOrCreateMenuRequest = (
  cacheKey: string,
  fecha: string | undefined,
  usuarioId: string,
  token: string | null | undefined
) => {
  const requestInFlight = menuRequestsInFlight.get(cacheKey);
  if (requestInFlight) return requestInFlight;

  const requestVersion = getMenuCacheVersion(cacheKey);
  const requestBase = (async () => {
    const params = new URLSearchParams();
    if (fecha) params.set("fecha", fecha);
    params.set("usuarioId", usuarioId);
    const query = params.toString();
    const url = `${API_BASE_URL}/api/trabajador/menu-semanal${query ? `?${query}` : ""}`;

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const respuesta = await fetch(url, { headers });
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
  return request;
};

export const useMenuAPI = (
  fecha?: string,
  usuarioId?: string,
  token?: string | null,
  esCena = false
) => {
  const cacheKey = getMenuCacheKey(fecha, esCena, usuarioId);
  const menuEnCacheInicial = menuCache.get(cacheKey);

  const [menuFetch, setMenuFetch] = useState<MenuDia>(menuEnCacheInicial ?? MENU_VACIO);
  const [cargando, setCargando] = useState<boolean>(!menuEnCacheInicial);

  const [tokenListo, setTokenListo] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
  }, [token, tokenListo]);

  useEffect(() => {
    let cancelado = false;

    if (!usuarioId || !tokenListo) return;

    const menuEnCache = menuCache.get(cacheKey);
    if (menuEnCache) {
      setMenuFetch(menuEnCache);
      setCargando(false);
      return;
    }

    setCargando(true);

    getOrCreateMenuRequest(cacheKey, fecha, usuarioId, tokenRef.current)
      .then((datos) => {
        if (!cancelado) {
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
  }, [fecha, usuarioId, tokenListo, cacheKey]);

  const menuEnCache = menuCache.get(cacheKey);

  return {
    menuHoy: menuEnCache ?? menuFetch,
    cargando: menuEnCache ? false : cargando
  };
};
