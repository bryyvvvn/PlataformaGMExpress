import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CHILE_TIMEZONE = "America/Santiago";

class MenuSemanalPreloadError extends Error {
  fecha: string;
  status: number | null;
  url: string;

  constructor({
    fecha,
    status,
    url,
    message,
  }: {
    fecha: string;
    status: number | null;
    url: string;
    message: string;
  }) {
    super(message);
    this.fecha = fecha;
    this.status = status;
    this.url = url;
  }
}

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

function getCurrentChileWeekdays() {
  const hoyChile = getChileDateParts();
  const diaSemanaChile = getChileDayOfWeek(hoyChile.weekday);
  const diasHastaLunes = 1 - diaSemanaChile;

  return Array.from({ length: 7 }, (_, index) =>
    addDaysToChileDate(
      hoyChile.year,
      hoyChile.month,
      hoyChile.day,
      diasHastaLunes + index
    )
  );
}

function getMenuSemanalUrl(urlBase: string, fecha: string, esCena?: boolean) {
  const params = new URLSearchParams();
  params.set('fecha', fecha);
  if (typeof esCena === 'boolean') params.set('esCena', esCena ? 'true' : 'false');
  return `${urlBase}/api/trabajador/menu-semanal?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get("secret");

  if (!process.env.CRON_SECRET) {
    console.error("[CRON CACHE] Falta CRON_SECRET");

    return NextResponse.json(
      {
        success: false,
        error: "CRON_SECRET no esta configurado",
      },
      { status: 500 }
    );
  }

  if (querySecret !== process.env.CRON_SECRET) {
    console.warn("[CRON CACHE] Acceso denegado: secret invalido o ausente");
    return new NextResponse("Acceso denegado", { status: 401 });
  }

  try {
    const urlBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "https://admin.gmexpress.cl";

    const fechasSemana = getCurrentChileWeekdays();

    console.log("[CRON CACHE] Iniciando primera carga de menu semanal", {
      timezone: CHILE_TIMEZONE,
      urlBase,
      fechas: fechasSemana,
    });

    // 🔥 CORRECCIÓN: Solo hacemos 1 llamada por día, porque esa llamada ya carga almuerzos y cenas en caché.
    const tareas: { fecha: string; esCena: boolean; url: string }[] = [];
    fechasSemana.forEach((fecha) => {
      tareas.push({ fecha, esCena: false, url: getMenuSemanalUrl(urlBase, fecha) });
    });

    const resultados = await Promise.allSettled(
      tareas.map(async (t) => {
        console.log("[CRON CACHE] Llamando menu-semanal", { fecha: t.fecha, esCena: t.esCena, url: t.url });

        const response = await fetch(t.url, {
          method: "GET",
          cache: "no-store",
        });

        const body = await response.text();

        console.log("[CRON CACHE] Respuesta menu-semanal", {
          fecha: t.fecha,
          esCena: t.esCena,
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          throw new MenuSemanalPreloadError({
            fecha: t.fecha,
            status: response.status,
            url: t.url,
            message: body.slice(0, 500) || "menu-semanal respondio con error",
          });
        }

        return {
          fecha: t.fecha,
          esCena: t.esCena,
          status: response.status,
          url: t.url,
        };
      })
    );

    const exitosos = resultados
      .map((r, idx) => ({ r, meta: tareas[idx] }))
      .filter(({ r }) => r.status === "fulfilled")
      .map(({ r }) => (r as PromiseFulfilledResult<any>).value);

    const fallidos = resultados
      .map((resultado, index) => ({ resultado, meta: tareas[index] }))
      .filter(
        (item): item is {
          resultado: PromiseRejectedResult;
          meta: { fecha: string; esCena: boolean; url: string };
        } => item.resultado.status === "rejected"
      )
      .map(({ resultado, meta }) => {
        const error = resultado.reason;

        if (error instanceof MenuSemanalPreloadError) {
          return {
            fecha: error.fecha,
            esCena: meta.esCena,
            status: error.status,
            url: error.url,
            error: error.message,
          };
        }

        return {
          fecha: meta.fecha,
          esCena: meta.esCena,
          status: null,
          url: meta.url,
          error: error instanceof Error ? error.message : String(error),
        };
      });

    if (fallidos.length > 0) {
      console.error("[CRON CACHE] Fechas fallidas en primera carga", {
        fallidos,
      });

      return NextResponse.json(
        {
          success: false,
          mensaje:
            "El cron se ejecuto, pero una o mas llamadas a menu-semanal fallaron.",
          fechas: fechasSemana,
          exitosos,
          fallidos,
        },
        { status: 500 }
      );
    }

    console.log("[CRON CACHE] Primera carga completada", {
      exitosos,
    });

    return NextResponse.json({
      success: true,
      mensaje:
        "Cron ejecutado correctamente. La ruta menu-semanal fue llamada para poblar la cache.",
      fechas: fechasSemana,
      resultados: exitosos,
      timezone: CHILE_TIMEZONE,
    });
  } catch (error) {
    console.error("[CRON CACHE] Error critico:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del cron de cache",
      },
      { status: 500 }
    );
  }
}