import { NextRequest, NextResponse } from "next/server";
import db from '../../../../lib/db';

export const dynamic = "force-dynamic";

const CHILE_TIMEZONE = "America/Santiago";

function getChileDateString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function GET(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get("secret");

  if (!process.env.CRON_SECRET) {
    console.error("[CRON CACHE TRABAJADORES] Falta CRON_SECRET");
    return NextResponse.json({ success: false, error: "CRON_SECRET no está configurado" }, { status: 500 });
  }

  if (querySecret !== process.env.CRON_SECRET) {
    console.warn("[CRON CACHE TRABAJADORES] Acceso denegado: secret inválido");
    return new NextResponse("Acceso denegado", { status: 401 });
  }

  try {
    const urlBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://admin.gmexpress.cl";
    const fechaHoy = getChileDateString();

    // Solo empresas activas para no calentar cache de empresas inactivas
    const empresas = await db.empresa.findMany({
      where: { estado: 'ACTIVA' },
      select: { id: true, nombre: true }
    });

    console.log(`[CRON CACHE TRABAJADORES] Iniciando carga de planillas para ${empresas.length} empresas activas`, {
      timezone: CHILE_TIMEZONE,
      fechaBase: fechaHoy
    });

    const resultados = await Promise.allSettled(
      empresas.map(async (empresa) => {
        const url = `${urlBase}/api/representante/empleados?fecha=${fechaHoy}&empresaId=${empresa.id}&secret=${process.env.CRON_SECRET}`;

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Ruta respondió con error ${response.status}`);
        }

        return {
          empresaId: empresa.id,
          nombre: empresa.nombre,
          status: response.status,
        };
      })
    );

    const exitosos = resultados
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    const fallidos = resultados
      .map((resultado, index) => ({ resultado, empresa: empresas[index] }))
      .filter((item) => item.resultado.status === "rejected")
      .map(({ resultado, empresa }) => ({
        empresaId: empresa.id,
        nombre: empresa.nombre,
        error: (resultado as PromiseRejectedResult).reason.message,
      }));

    if (fallidos.length > 0) {
      console.error("[CRON CACHE TRABAJADORES] Fallaron algunas empresas", { fallidos });
      return NextResponse.json(
        {
          success: false,
          mensaje: "Se ejecutó el cron, pero falló la carga para algunas empresas.",
          exitosos,
          fallidos,
        },
        { status: 500 }
      );
    }

    console.log("[CRON CACHE TRABAJADORES] Primera carga completada con éxito", { exitosos });

    return NextResponse.json({
      success: true,
      mensaje: "Caché de trabajadores precargada correctamente para todas las empresas activas.",
      fechaUsada: fechaHoy,
      empresasActualizadas: exitosos.length,
    });

  } catch (error) {
    console.error("[CRON CACHE TRABAJADORES] Error crítico:", error);
    return NextResponse.json({ success: false, error: "Error interno del cron" }, { status: 500 });
  }
}