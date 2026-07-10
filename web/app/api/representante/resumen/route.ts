import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { chileStartOfDay, chileEndOfDay } from "../../../../lib/chile-time";
import { verificarRepresentante } from "@/lib/representante/verificar-representante";
import { normalizarFechaEmpleados } from "@/lib/representante/trabajadores-cache";
import {
  getResumenCache,
  getResumenCacheKey,
  limpiarResumenCacheViejo,
  setResumenCache,
  invalidarResumenCachePorEmpresa,
} from "@/lib/representante/resumen-cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const fecha = searchParams.get("fecha");
  const fechaInicioParam = searchParams.get("fechaInicio");
  const fechaFinParam = searchParams.get("fechaFin");
  const forceRefresh = searchParams.get("refresh") === "1";

  let empresaId: number;

  // 🔥 PUERTA TRASERA PARA EL CRON
  if (secret === process.env.CRON_SECRET) {
    const empIdStr = searchParams.get("empresaId");
    if (!empIdStr)
      return NextResponse.json(
        { error: "Falta empresaId para el cron" },
        { status: 400 },
      );
    empresaId = parseInt(empIdStr, 10);
  } else {
    const rep = await verificarRepresentante(request);
    if ("error" in rep) {
      return NextResponse.json({ error: rep.error }, { status: rep.status });
    }
    empresaId = rep.empresaId;
  }

  try {
    limpiarResumenCacheViejo();

    const fechaReferencia = normalizarFechaEmpleados(fecha);
    const fechaInicio = fechaInicioParam
      ? normalizarFechaEmpleados(fechaInicioParam)
      : fechaReferencia;
    const fechaFin = fechaFinParam
      ? normalizarFechaEmpleados(fechaFinParam)
      : fechaInicio;
    const cacheKey = getResumenCacheKey(empresaId, fechaInicio, fechaFin);
    const cached = getResumenCache(cacheKey);

    if (!forceRefresh && cached) {
      console.log(`[RESUMEN Cache Hit] empresa=${empresaId}`);
      return NextResponse.json(cached, {
        headers: { "X-Resumen-Cache": "HIT" },
      });
    }

    console.log(
      forceRefresh
        ? `[RESUMEN Cache Refresh] empresa=${empresaId}`
        : `[RESUMEN Cache Miss] empresa=${empresaId}`,
    );

    const inicioDia = chileStartOfDay(fechaInicio);
    const finDia = chileEndOfDay(fechaFin);

    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        ConvenioEmpresa: {
          select: { permiteCena: true },
        },
      },
    });
    const permiteCena = Boolean(empresa?.ConvenioEmpresa?.permiteCena);

    // 🔥 PARALELO: ambas queries al mismo tiempo
    const [totalTrabajadores, pedidosListosHoy] = await Promise.all([
      db.usuario.count({
        where: { empresaId, rol: "TRABAJADOR" },
      }),
      db.pedido.count({
        where: {
          empresaId,
          fecha: { gte: inicioDia, lt: finDia },
          ...(permiteCena ? {} : { esCena: false }),
        },
      }),
    ]);

    const data = {
      totalTrabajadores,
      pedidosListos: pedidosListosHoy,
      enviadoAGM: false,
      permiteCena,
    };

    // 🔥 GUARDAR EN CACHE
    setResumenCache(cacheKey, data);
    console.log(
      `[RESUMEN Cache Set] empresa=${empresaId} trabajadores=${totalTrabajadores} pedidosHoy=${pedidosListosHoy}`,
    );

    return NextResponse.json(data, {
      headers: { "X-Resumen-Cache": forceRefresh ? "REFRESH" : "MISS" },
    });
  } catch (error) {
    console.error("[API REPRESENTANTE RESUMEN] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
