import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../constants/api";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
// (Mantén todos tus interfaces Guarnicion, Plato, MenuDia exactamente igual aquí)
export interface Guarnicion { id: number; nombre: string; }
export interface Plato { id: number; nombre: string; url_imagen: string | null; categoria: "ENTRADA" | "FONDO" | "POSTRE" | "JUGO" | "BEBIDA" | "AGUA_SABORIZADA" | "CANJE" | "SANDWICH" | "SNACK"; tipo: "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "PLATO_UNICO"; calorias?: number | null; proteinas?: number | null; carbohidratos?: number | null; grasas?: number | null; guarniciones: Guarnicion[]; menuDetalleId?: number; }
export interface MenuDia { entradas: Plato[]; fondos: Plato[]; postres: Plato[]; menuDia: { entrada?: Plato | null; fondo?: Plato | null; postre?: Plato | null; guarnicion?: Guarnicion | null; entradasSeleccionadas?: Plato[]; entradaDisplay?: string | null; bebida?: Plato | null; } | null; convenio?: { trabajaFinDeSemana?: boolean | null; permiteCena?: boolean | null; }; }

const MENU_VACIO: MenuDia = { entradas: [], fondos: [], postres: [], menuDia: null };

// 🔥 EL TRUCO REAL: La memoria caché ahora vive AFUERA del hook.
// Es indestructible aunque cambies de pantalla o el componente se recargue.
const cacheGlobalMenu: Record<string, MenuDia> = {};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useMenuAPI = (fecha?: string, usuarioId?: string, token?: string | null) => {
  // 1. Revisamos el caché INMEDIATAMENTE antes de dibujar la pantalla
  const cacheKey = `${fecha || "hoy"}-${usuarioId}`;
  const menuEnCache = cacheGlobalMenu[cacheKey];

  // Si hay caché, iniciamos con esos datos y cargando en FALSE. Cero esperas.
  const [menuHoy, setMenuHoy] = useState<MenuDia>(menuEnCache || MENU_VACIO);
  const [cargando, setCargando] = useState<boolean>(!menuEnCache);
  
  const [tokenListo, setTokenListo] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
  }, [token]);

  useEffect(() => {
    let cancelado = false;

    // Si no hay usuario o token, o SI YA TENÍAMOS CACHÉ AL INICIO, no hacemos nada más.
    if (!usuarioId || !tokenListo || menuEnCache) return;

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
          if (!cancelado) setMenuHoy(MENU_VACIO);
          return;
        }

        const datos: MenuDia = await respuesta.json();
        
        if (!cancelado) {
          setMenuHoy(datos);
          // 🔥 Guardamos el resultado en la memoria global
          cacheGlobalMenu[cacheKey] = datos; 
        }
      } catch (error) {
        console.error("[useMenuAPI] Error de red:", error);
        if (!cancelado) setMenuHoy(MENU_VACIO);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarMenu();
    return () => { cancelado = true; };
  }, [fecha, usuarioId, tokenListo, menuEnCache]); 

  return { menuHoy, cargando };
};