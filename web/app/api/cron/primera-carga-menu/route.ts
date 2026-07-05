import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CHILE_TIMEZONE = "America/Santiago";

function getChileDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
  };
}

function getChileDayOfWeek(weekday: string | undefined) {
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return map[weekday ?? "Mon"] ?? 1;
}

function formatYmd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysToChileDate(
  year: number,
  month: number,
  day: number,
  daysToAdd: number
) {
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd, 12, 0, 0));

  return formatYmd(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

export async function GET(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get("secret");

  if (!process.env.CRON_SECRET) {
    console.error("[CRON CACHÉ] Falta CRON_SECRET");

    return NextResponse.json(
      {
        success: false,
        error: "CRON_SECRET no está configurado",
      },
      { status: 500 }
    );
  }

  if (querySecret !== process.env.CRON_SECRET) {
    return new NextResponse("Acceso denegado", { status: 401 });
  }

  try {
    const urlBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "https://admin.gmexpress.cl";

    const hoyChile = getChileDateParts();
    const diaSemanaChile = getChileDayOfWeek(hoyChile.weekday);

    const diasHastaLunes = 1 - diaSemanaChile;

    const fechasSemana = Array.from({ length: 5 }, (_, index) =>
      addDaysToChileDate(
        hoyChile.year,
        hoyChile.month,
        hoyChile.day,
        diasHastaLunes + index
      )
    );

    console.log("[CRON CACHÉ] Iniciando calentamiento de menú semanal");
    console.log("[CRON CACHÉ] URL base:", urlBase);
    console.log("[CRON CACHÉ] Fechas:", fechasSemana);

    const resultados = await Promise.allSettled(
      fechasSemana.map(async (fecha) => {
        const url = `${urlBase}/api/trabajador/menu-semanal?fecha=${fecha}`;

        console.log(`[CRON CACHÉ] Llamando: ${url}`);

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        const body = await response.text();

        if (!response.ok) {
          throw new Error(
            `Falló menú semanal para ${fecha}. Status: ${response.status}. Body: ${body}`
          );
        }

        return {
          fecha,
          status: response.status,
        };
      })
    );

    const exitosos = resultados
      .filter((resultado) => resultado.status === "fulfilled")
      .map((resultado) => resultado.value);

    const fallidos = resultados
      .filter((resultado) => resultado.status === "rejected")
      .map((resultado) => {
        const error = resultado.reason;
        return error instanceof Error ? error.message : String(error);
      });

    if (fallidos.length > 0) {
      console.error("[CRON CACHÉ] Algunas fechas fallaron:", fallidos);

      return NextResponse.json(
        {
          success: false,
          mensaje:
            "El cron se ejecutó, pero una o más llamadas a menú semanal fallaron.",
          fechas: fechasSemana,
          exitosos,
          fallidos,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje:
        "Cron ejecutado correctamente. La ruta de menú semanal fue llamada para poblar la caché.",
      fechas: fechasSemana,
      resultados: exitosos,
      timezone: CHILE_TIMEZONE,
    });
  } catch (error) {
    console.error("[CRON CACHÉ] Error crítico:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del cron de caché",
      },
      { status: 500 }
    );
  }
}