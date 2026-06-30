import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../constants/api";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface Guarnicion {
  id:     number;
  nombre: string;
}

export interface Plato {
  id:          number;
  nombre:      string;
  url_imagen:  string | null;
  categoria:   "ENTRADA" | "FONDO" | "POSTRE" | "JUGO" | "BEBIDA" | "AGUA_SABORIZADA";
  tipo:        "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "PLATO_UNICO";
  calorias?:   number | null;
  proteinas?:  number | null;
  carbohidratos?: number | null;
  grasas?:     number | null;
  guarniciones: Guarnicion[];
  menuDetalleId?: number;
}

export interface MenuDia {
  entradas: Plato[];
  fondos:   Plato[];
  postres:  Plato[];
  menuDia:  {
    entrada?: Plato | null;
    fondo?: Plato | null;
    postre?: Plato | null;
    guarnicion?: Guarnicion | null;
    entradasSeleccionadas?: Plato[];
    entradaDisplay?: string | null;
    bebida?: Plato | null;
  } | null;
  convenio?: {
    trabajaFinDeSemana?: boolean | null;
    permiteCena?: boolean | null;
  };
}

const MENU_VACIO: MenuDia = { entradas: [], fondos: [], postres: [], menuDia: null };

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Carga el menú para una fecha dada en formato "YYYY-MM-DD".
 * Sin argumento → usa el día actual (calculado por el servidor).
 *
 * Se vuelve a ejecutar automáticamente cuando cambia `fecha`.
 */
export const useMenuAPI = (fecha?: string, usuarioId?: string, token?: string | null) => {
  const [menuHoy, setMenuHoy] = useState<MenuDia>(MENU_VACIO);
  const [cargando, setCargando] = useState(true);
  const [tokenListo, setTokenListo] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const cacheRef = useRef<Map<string, MenuDia>>(new Map());

  // Marca tokenListo la primera vez que llega un token válido — nunca vuelve a false
  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
  }, [token]);

  useEffect(() => {
    if (!usuarioId || !tokenListo) return;

    const cacheKey = `${usuarioId}|${fecha ?? ""}`;
    const cacheado = cacheRef.current.get(cacheKey);
    if (cacheado) {
      // Hit de cache: mostramos el menú ya conocido sin pasar por el skeleton,
      // y revalidamos en segundo plano más abajo.
      setMenuHoy(cacheado);
      setCargando(false);
    } else {
      setCargando(true);
    }

    const controller = new AbortController();

    const cargarMenu = async () => {
      try {
        const params = new URLSearchParams();
        if (fecha) params.set("fecha", fecha);
        if (usuarioId) params.set("usuarioId", usuarioId);
        const query = params.toString();
        const url = `${API_BASE_URL}/api/trabajador/menu-semanal${query ? `?${query}` : ""}`;

        const headers: HeadersInit = {};
        if (tokenRef.current) {
          headers['Authorization'] = `Bearer ${tokenRef.current}`;
        }
        const respuesta = await fetch(url, { headers, signal: controller.signal });

        if (!respuesta.ok) {
          console.error("[useMenuAPI] Error HTTP:", respuesta.status);
          if (!cacheado) setMenuHoy(MENU_VACIO);
          return;
        }

        const datos: MenuDia = await respuesta.json();
        cacheRef.current.set(cacheKey, datos);
        setMenuHoy(datos);
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
        console.error("[useMenuAPI] Error de red:", error);
        if (!cacheado) setMenuHoy(MENU_VACIO);
      } finally {
        setCargando(false);
      }
    };

    cargarMenu();
    return () => controller.abort();
  }, [fecha, usuarioId, tokenListo]); // token fuera, solo re-fetch por fecha/usuario/tokenListo

  return { menuHoy, cargando };
};