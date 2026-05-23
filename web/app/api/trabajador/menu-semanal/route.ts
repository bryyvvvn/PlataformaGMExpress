import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  nowChile,
  chileStartOfDay,
  chileEndOfDay,
  getChileDayName,
} from "@/lib/chile-time";

export const dynamic = "force-dynamic";

/**
 * GET /api/trabajador/menu-semanal?fecha=YYYY-MM-DD
 *
 * Devuelve { entradas, fondos, postres } del día solicitado.
 * Sin parámetro → día actual en zona horaria Chile (no en UTC del servidor).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");

    // Día a consultar en zona horaria Chile
    const isoFecha: string =
      fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
        ? fechaParam
        : nowChile().iso;

    const diaNombre = getChileDayName(isoFecha); // "Lunes", "Martes", …

    // Límites del día en Chile para el rango de búsqueda en la BD
    const inicioDia = chileStartOfDay(isoFecha);
    const finDia    = chileEndOfDay(isoFecha);

    // MenuSemanal vigente: fecha_inicio <= día <= fecha_fin
    const menuActivo = await db.menuSemanal.findFirst({
      where: {
        fecha_inicio: { lte: finDia    },
        fecha_fin:    { gte: inicioDia },
      },
      orderBy: { creado_en: "desc" },
      include: {
        detalles: {
          where:   { dia_semana: diaNombre },
          include: { plato: true, guarniciones: true },
        },
      },
    });

    if (!menuActivo || menuActivo.detalles.length === 0) {
      return NextResponse.json({ entradas: [], fondos: [], postres: [] });
    }

    const menuFormateado = {
      entradas: menuActivo.detalles
        .filter((d) => d.plato.categoria === "ENTRADA")
        .map((d) => ({ ...d.plato, guarniciones: d.guarniciones })),

      fondos: menuActivo.detalles
        .filter((d) => d.plato.categoria === "FONDO")
        .map((d) => ({ ...d.plato, guarniciones: d.guarniciones })),

      postres: menuActivo.detalles
        .filter((d) => d.plato.categoria === "POSTRE")
        .map((d) => ({ ...d.plato, guarniciones: d.guarniciones })),
    };

    return NextResponse.json(menuFormateado);
  } catch (error) {
    console.error("[menu-semanal] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}