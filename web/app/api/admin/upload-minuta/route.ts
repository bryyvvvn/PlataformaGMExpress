import { NextRequest, NextResponse } from "next/server";
import { invalidateMenuCacheForDates } from "@/lib/menu-cache/server-menu-cache";
import { buscarMenuSemanalExistente, guardarMinuta } from "@/lib/minuta/guardarMinuta";
import { parsearMinutaExcel } from "@/lib/minuta/parsearMinutaExcel";
import { validarAdministrador } from "@/lib/usuarios/admin";

export const dynamic = "force-dynamic";

function getErrorDetalle(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}

function formatIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  try {
    const admin = await validarAdministrador();

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parseResult = parsearMinutaExcel(buffer);

    if (!parseResult.ok) {
      if (parseResult.logContext) {
        console.error("[upload-minuta] fechaInicio or fechaFin no determinada", parseResult.logContext);
      }

      return NextResponse.json({ error: parseResult.error }, { status: 400 });
    }

    const { fechaInicio, fechaFin } = parseResult.minuta;
    const menuExistente = await buscarMenuSemanalExistente(fechaInicio, fechaFin);

    if (menuExistente) {
      return NextResponse.json(
        {
          error: "Ya existe un menú cargado para esta semana",
          detalle: `Semana del ${fechaInicio.toISOString().split("T")[0]} al ${fechaFin.toISOString().split("T")[0]}`,
        },
        { status: 409 }
      );
    }

    await guardarMinuta(parseResult.minuta);

    const fechasInvalidar = parseResult.minuta.dias.map((dia) => formatIsoDate(dia.fecha));
    invalidateMenuCacheForDates(fechasInvalidar);
    console.info("[menu-cache] invalidated upload-minuta", { fechas: fechasInvalidar });

    return NextResponse.json(
      {
        message: "Minuta cargada correctamente",
        periodo: {
          inicio: formatIsoDate(fechaInicio),
          fin: formatIsoDate(fechaFin),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[upload-minuta] Error:", error);
    return NextResponse.json(
      { error: "Error procesando el archivo", detalle: getErrorDetalle(error) },
      { status: 500 }
    );
  }
}
