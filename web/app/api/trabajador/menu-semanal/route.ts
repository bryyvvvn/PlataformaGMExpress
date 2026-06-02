import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  nowChile,
  chileStartOfDay,
  chileEndOfDay,
  getChileDayName,
} from "@/lib/chile-time";

export const dynamic = "force-dynamic";

function formatearDetalle(d: {
  id: number;
  plato: {
    id: number;
    nombre: string;
    url_imagen: string | null;
    categoria: string;
    tipo: string;
  };
  guarniciones: { id: number; nombre: string }[];
}) {
  return {
    ...d.plato,
    guarniciones: d.guarniciones,
    menuDetalleId: d.id,
  };
}

function formatearSeleccion(seleccion: {
  entradaDetalle: Parameters<typeof formatearDetalle>[0];
  fondoDetalle: Parameters<typeof formatearDetalle>[0];
  postreDetalle: Parameters<typeof formatearDetalle>[0];
  guarnicion: { id: number; nombre: string } | null;
}) {
  return {
    entrada: formatearDetalle(seleccion.entradaDetalle),
    fondo: formatearDetalle(seleccion.fondoDetalle),
    postre: formatearDetalle(seleccion.postreDetalle),
    guarnicion: seleccion.guarnicion,
  };
}

/**
 * GET /api/trabajador/menu-semanal?fecha=YYYY-MM-DD
 *
 * Devuelve { entradas, fondos, postres, menuDia } del día solicitado.
 * Las listas se mantienen para compatibilidad con el flujo personalizado.
 * Sin parámetro → día actual en zona horaria Chile (no en UTC del servidor).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");

    const isoFecha: string =
      fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
        ? fechaParam
        : nowChile().iso;

    const diaNombre = getChileDayName(isoFecha);
    const inicioDia = chileStartOfDay(isoFecha);
    const finDia = chileEndOfDay(isoFecha);

    const menuActivo = await db.menuSemanal.findFirst({
      where: {
        fecha_inicio: { lte: finDia },
        fecha_fin: { gte: inicioDia },
      },
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
          },
        },
      },
    });

    if (!menuActivo || menuActivo.detalles.length === 0) {
      return NextResponse.json({ entradas: [], fondos: [], postres: [], menuDia: null });
    }

    const seleccion = menuActivo.menuDiaSelecciones[0];
    const entradas = menuActivo.detalles
      .filter((d) => d.plato.categoria === "ENTRADA")
      .map(formatearDetalle);

    const ensaladaSurtida = await db.plato.findFirst({
      where: {
        nombre: { equals: "Ensalada surtida", mode: "insensitive" },
        categoria: "ENTRADA",
      },
    });

    const entradasConSurtida = ensaladaSurtida
      ? entradas.some((p) => p.nombre.toLowerCase().trim() === "ensalada surtida")
        ? entradas
        : [
            {
              id: ensaladaSurtida.id,
              nombre: ensaladaSurtida.nombre,
              url_imagen: ensaladaSurtida.url_imagen,
              categoria: ensaladaSurtida.categoria,
              tipo: ensaladaSurtida.tipo,
              guarniciones: [],
              menuDetalleId: null,
            },
            ...entradas,
          ]
      : entradas;

    const menuFormateado = {
      entradas: entradasConSurtida,

      fondos: menuActivo.detalles
        .filter((d) => d.plato.categoria === "FONDO")
        .map(formatearDetalle),

      postres: menuActivo.detalles
        .filter((d) => d.plato.categoria === "POSTRE")
        .map(formatearDetalle),

      menuDia: seleccion ? formatearSeleccion(seleccion) : null,
    };

    return NextResponse.json(menuFormateado);
  } catch (error) {
    console.error("[menu-semanal] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
