import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../constants/api";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface Guarnicion { id: number; nombre: string; }
export interface Plato { id: number; nombre: string; url_imagen: string | null; categoria: "ENTRADA" | "FONDO" | "POSTRE" | "JUGO" | "BEBIDA" | "AGUA_SABORIZADA" | "CANJE" | "SANDWICH" | "SNACK"; tipo: "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "PLATO_UNICO"; calorias?: number | null; proteinas?: number | null; carbohidratos?: number | null; grasas?: number | null; guarniciones: Guarnicion[]; menuDetalleId?: number; }
export interface MenuDia { entradas: Plato[]; fondos: Plato[]; postres: Plato[]; menuDia: { entrada?: Plato | null; fondo?: Plato | null; postre?: Plato | null; guarnicion?: Guarnicion | null; entradasSeleccionadas?: Plato[]; entradaDisplay?: string | null; bebida?: Plato | null; } | null; convenio?: { trabajaFinDeSemana?: boolean | null; permiteCena?: boolean | null; }; }

const MENU_VACIO: MenuDia = { entradas: [], fondos: [], postres: [], menuDia: null };

// 🔥 MEMORIA GLOBAL E INDESTRUCTIBLE
const cacheGlobalMenu: Record<string, MenuDia> = {};

export const useMenuAPI = (fecha?: string, usuarioId?: string, token?: string | null) => {
  const cacheKey = `${fecha || "hoy"}-${usuarioId}`;
  
  const [menuFetch, setMenuFetch] = useState<MenuDia>(MENU_VACIO);
  const [cargando, setCargando] = useState<boolean>(!cacheGlobalMenu[cacheKey]);
  
  const [tokenListo, setTokenListo] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
  }, [token]);

  useEffect(() => {
    let cancelado = false;

    if (!usuarioId || !tokenListo) return;

    // Si YA está en caché, apagamos el loading inmediatamente y NO hacemos fetch
    if (cacheGlobalMenu[cacheKey]) {
      setCargando(false);
      return;
    }

    const cargarMenu = async () => {
      setCargando(true);
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
        const respuesta = await fetch(url, { headers });

        if (!respuesta.ok) {
          console.error("[useMenuAPI] Error HTTP:", respuesta.status);
          if (!cancelado) setMenuFetch(MENU_VACIO);
          return;
        }

        const datos: MenuDia = await respuesta.json();
        
        if (!cancelado) {
          // 🔥 Guardamos en la memoria RAM del celular
          cacheGlobalMenu[cacheKey] = datos; 
          setMenuFetch(datos);
        }
      } catch (error) {
        console.error("[useMenuAPI] Error de red:", error);
        if (!cancelado) setMenuFetch(MENU_VACIO);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarMenu();
    return () => { cancelado = true; };
  }, [fecha, usuarioId, tokenListo, cacheKey]); 

  // 🔥 EL TRUCO: Siempre devolvemos el caché si existe, ignorando el estado lento de React
  return { 
    menuHoy: cacheGlobalMenu[cacheKey] || menuFetch, 
    cargando: cacheGlobalMenu[cacheKey] ? false : cargando 
  };
};