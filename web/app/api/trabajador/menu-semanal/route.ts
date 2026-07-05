import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  nowChile,
  chileStartOfDay,
  chileEndOfDay,
  getChileDayName,
} from "@/lib/chile-time";
import { esPlatoUnicoPorLegumbre } from "@/lib/menu/es-plato-unico";
import { verificarTokenTrabajador } from "@/lib/trabajador/verificar-token";

export const dynamic = "force-dynamic";

type ConvenioMenuDia = {
  permitePlato: boolean; permiteEntrada: boolean; permitePostre: boolean;
  permitePan: boolean; permiteBebida: boolean; permiteJugo: boolean;
  permiteAguaSaborizada: boolean; trabajaFinDeSemana: boolean; permiteCena: boolean;
};

type PlatoBebida = {
  id: number; nombre: string; url_imagen: string | null; categoria: string;
  tipo: string; calorias: number | null; proteinas: number | null;
  carbohidratos: number | null; grasas: number | null;
};

type PlatoMenu = {
  id: number;
  nombre: string;
  url_imagen: string | null;
  categoria: string;
  tipo: string;
};

type GuarnicionMenu = {
  id: number;
  nombre: string;
};

type MenuDetalleConPlato = {
  id: number;
  plato: PlatoMenu;
  guarniciones: GuarnicionMenu[];
};

type EntradaSeleccionada = {
  orden: number;
  id: number;
  menuDetalle: MenuDetalleConPlato;
};

type MenuDiaSeleccion = {
  entradasSeleccionadas: EntradaSeleccionada[];
  entradaDetalle: MenuDetalleConPlato;
  fondoDetalle: MenuDetalleConPlato;
  postreDetalle: MenuDetalleConPlato;
  guarnicion: GuarnicionMenu | null;
  bebidaPlato: PlatoBebida | null;
};

type MenuActivoCache = {
  detalles: MenuDetalleConPlato[];
  menuDiaSelecciones: MenuDiaSeleccion[];
};

type MenuCacheData = {
  menuActivo: MenuActivoCache;
  ensaladaSurtida: PlatoBebida | null;
};

function platoOmiteGuarnicion(plato: { nombre: string; tipo: string }) {
  return plato.tipo === "PLATO_UNICO" || plato.tipo === "HIPOCALORICO" || esPlatoUnicoPorLegumbre(plato.nombre);
}

function formatearDetalle(d: MenuDetalleConPlato) {
  return { ...d.plato, guarniciones: platoOmiteGuarnicion(d.plato) ? [] : d.guarniciones, menuDetalleId: d.id };
}

function construirEntradaDisplay(entradas: ReturnType<typeof formatearDetalle>[]) {
  if (entradas.length === 0) return null;
  if (entradas.length === 3) return "Ensalada surtida";
  return entradas.map((entrada) => entrada.nombre).join(" + ");
}

function puedeVerBebidaPorConvenio(bebida: PlatoBebida | null, convenio: ConvenioMenuDia | null) {
  if (!bebida || !convenio) return false;
  if (bebida.categoria === "BEBIDA") return convenio.permiteBebida;
  if (bebida.categoria === "JUGO") return convenio.permiteJugo;
  if (bebida.categoria === "AGUA_SABORIZADA") return convenio.permiteAguaSaborizada;
  return false;
}

async function obtenerConvenioUsuario(usuarioId: string | null): Promise<ConvenioMenuDia | null> {
  if (!usuarioId) return null;
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    select: { empresa: { select: { ConvenioEmpresa: { select: {
      permitePlato: true, permiteEntrada: true, permitePostre: true,
      permitePan: true, permiteBebida: true, permiteJugo: true,
      permiteAguaSaborizada: true, trabajaFinDeSemana: true, permiteCena: true,
    } } } } },
  });
  return usuario?.empresa?.ConvenioEmpresa ?? null;
}

function formatearSeleccion(seleccion: MenuDiaSeleccion, convenio: ConvenioMenuDia | null) {
  const entradas = seleccion.entradasSeleccionadas.length > 0
    ? seleccion.entradasSeleccionadas.sort((a, b) => a.orden - b.orden).map((item) => formatearDetalle(item.menuDetalle))
    : [formatearDetalle(seleccion.entradaDetalle)];
  const permiteEntrada = convenio?.permiteEntrada ?? true;
  const permitePlato = convenio?.permitePlato ?? true;
  const permitePostre = convenio?.permitePostre ?? true;
  const entradasPermitidas = permiteEntrada ? entradas : [];
  const bebida = puedeVerBebidaPorConvenio(seleccion.bebidaPlato, convenio) ? seleccion.bebidaPlato : null;

  return {
    entrada: entradasPermitidas[0] ?? null,
    fondo: permitePlato ? formatearDetalle(seleccion.fondoDetalle) : null,
    postre: permitePostre ? formatearDetalle(seleccion.postreDetalle) : null,
    guarnicion: permitePlato && !platoOmiteGuarnicion(seleccion.fondoDetalle.plato) ? seleccion.guarnicion : null,
    entradasSeleccionadas: entradasPermitidas,
    entradaDisplay: permiteEntrada ? construirEntradaDisplay(entradasPermitidas) : null,
    bebida,
  };
}

// 🔥 LA MAGIA: CACHÉ EN LA RAM DEL SERVIDOR
const serverMenuCache = new Map<string, { data: MenuCacheData; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 14; // 14 horas de vida

function getMenuCacheKey(fecha: string) {
  return `menu-semanal:${fecha}`;
}

export async function GET(req: NextRequest) {
  try {
    // Si la caché guarda más de 7 días, la limpiamos para no acumular basura
    if (serverMenuCache.size > 7) {
      serverMenuCache.clear();
    }

    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");
    const usuarioId = searchParams.get("usuarioId");

    if (usuarioId) {
      const verificacion = await verificarTokenTrabajador(req, usuarioId);
      if ("error" in verificacion) {
        return NextResponse.json({ error: verificacion.error }, { status: verificacion.status });
      }
    }

    const isoFecha: string = fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : nowChile().iso;
    const cacheKey = getMenuCacheKey(isoFecha);

    // 1. Buscamos el convenio del usuario (ligero, no se cachea porque cambia por usuario)
    const convenio = await obtenerConvenioUsuario(usuarioId);

    // 2. Revisamos si ya tenemos el menú en la RAM
    const now = Date.now();
    let menuBaseData = serverMenuCache.get(cacheKey);

    // Si NO lo tenemos o pasaron las 14 horas, hacemos la consulta pesada
    if (!menuBaseData || (now - menuBaseData.timestamp > CACHE_TTL_MS)) {
      const diaNombre = getChileDayName(isoFecha);
      const inicioDia = chileStartOfDay(isoFecha);
      const finDia = chileEndOfDay(isoFecha);

      const [menuActivo, ensaladaSurtida] = await Promise.all([
        db.menuSemanal.findFirst({
          where: { fecha_inicio: { lte: finDia }, fecha_fin: { gte: inicioDia } },
          orderBy: { creado_en: "desc" },
          include: {
            detalles: {
              where: {
                OR: [
                  { fecha_dia: { gte: inicioDia, lte: finDia } },
                  { fecha_dia: null, dia_semana: diaNombre },
                ],
              },
              orderBy: [{ fecha_dia: "asc" }, { id: "asc" }],
              include: { plato: true, guarniciones: true },
            },
            menuDiaSelecciones: {
              where: { fecha_dia: { gte: inicioDia, lte: finDia } },
              include: {
                entradaDetalle: { include: { plato: true, guarniciones: true } },
                fondoDetalle: { include: { plato: true, guarniciones: true } },
                postreDetalle: { include: { plato: true, guarniciones: true } },
                guarnicion: true,
                bebidaPlato: true,
                entradasSeleccionadas: {
                  orderBy: [{ orden: "asc" }, { id: "asc" }],
                  include: { menuDetalle: { include: { plato: true, guarniciones: true } } },
                },
              },
            },
          },
        }),
        db.plato.findFirst({
          where: { nombre: { equals: "Ensalada surtida", mode: "insensitive" }, categoria: "ENTRADA" },
        })
      ]);

      // 🔥 EL SALVAVIDAS: Si el admin no subió la minuta, no guardamos basura en caché
      if (!menuActivo || menuActivo.detalles.length === 0) {
        serverMenuCache.delete(cacheKey);
        return NextResponse.json({
          entradas: [], fondos: [], postres: [], menuDia: null,
          convenio: { trabajaFinDeSemana: Boolean(convenio?.trabajaFinDeSemana), permiteCena: Boolean(convenio?.permiteCena) },
        });
      }

      // Guardamos la respuesta procesada en la RAM
      menuBaseData = { data: { menuActivo, ensaladaSurtida }, timestamp: now };
      serverMenuCache.set(cacheKey, menuBaseData);
      console.log("[menu-semanal] Cache miss: menu guardado en RAM", {
        fecha: isoFecha,
        cacheKey,
      });
      console.log(`[Cache Miss] Menú guardado en RAM para: ${isoFecha}`);
    } else {
      console.log(`[Cache Hit] Menú servido rapidísimo para: ${isoFecha}`);
    }

    // 3. Extraemos los datos (ya sea de BD o RAM) y aplicamos reglas de convenio
    const { menuActivo, ensaladaSurtida } = menuBaseData.data;
    const seleccion = menuActivo.menuDiaSelecciones[0];
    const entradas = menuActivo.detalles.filter((d) => d.plato.categoria === "ENTRADA").map(formatearDetalle);

    const entradasConSurtida = ensaladaSurtida
      ? entradas.some((p) => p.nombre.toLowerCase().trim() === "ensalada surtida")
        ? entradas
        : [{ ...ensaladaSurtida, guarniciones: [], menuDetalleId: null }, ...entradas]
      : entradas;

    const menuFormateado = {
      entradas: entradasConSurtida,
      fondos: menuActivo.detalles.filter((d) => d.plato.categoria === "FONDO").map(formatearDetalle),
      postres: menuActivo.detalles.filter((d) => d.plato.categoria === "POSTRE").map(formatearDetalle),
      menuDia: seleccion ? formatearSeleccion(seleccion, convenio) : null,
      convenio: { trabajaFinDeSemana: Boolean(convenio?.trabajaFinDeSemana), permiteCena: Boolean(convenio?.permiteCena) },
    };

    return NextResponse.json(menuFormateado);
  } catch (error) {
    console.error("[menu-semanal] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
