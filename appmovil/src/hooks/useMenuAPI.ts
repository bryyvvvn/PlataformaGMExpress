import { useState, useEffect } from "react";
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
  categoria:   "ENTRADA" | "FONDO" | "POSTRE" | "BEBESTIBLE";
  tipo:        "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "SIN_GLUTEN";
  guarniciones: Guarnicion[];
}

export interface MenuDia {
  entradas: Plato[];
  fondos:   Plato[];
  postres:  Plato[];
}

const MENU_VACIO: MenuDia = { entradas: [], fondos: [], postres: [] };

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Carga el menú para una fecha dada en formato "YYYY-MM-DD".
 * Sin argumento → usa el día actual (calculado por el servidor).
 *
 * Se vuelve a ejecutar automáticamente cuando cambia `fecha`.
 */
export const useMenuAPI = (fecha?: string) => {
  const [menuHoy, setMenuHoy] = useState<MenuDia>(MENU_VACIO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false; // evita set de estado si el componente se desmontó

    const cargarMenu = async () => {
      setCargando(true);
      try {
        const url = fecha
          ? `${API_BASE_URL}/api/trabajador/menu-semanal?fecha=${fecha}`
          : `${API_BASE_URL}/api/trabajador/menu-semanal`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          console.error("[useMenuAPI] Error HTTP:", respuesta.status);
          if (!cancelado) setMenuHoy(MENU_VACIO);
          return;
        }

        const datos: MenuDia = await respuesta.json();
        if (!cancelado) setMenuHoy(datos);
      } catch (error) {
        console.error("[useMenuAPI] Error de red:", error);
        if (!cancelado) setMenuHoy(MENU_VACIO);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarMenu();

    return () => {
      cancelado = true; // cleanup al desmontar o cuando cambia fecha
    };
  }, [fecha]); // ← se re-ejecuta cuando el usuario navega a otra fecha

  return { menuHoy, cargando };
};