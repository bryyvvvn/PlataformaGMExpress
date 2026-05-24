import { NextRequest, NextResponse } from "next/server";
import { deleteMenuWeek, listMenuWeeks } from "@/lib/menu-week";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error gestionando semanas";
}

export async function GET() {
  try {
    const semanas = await listMenuWeeks();
    return NextResponse.json({ semanas });
  } catch (error) {
    console.error("[menu-weeks] Error:", error);
    return NextResponse.json({ error: "Error obteniendo semanas cargadas" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    const result = await deleteMenuWeek(id);

    if (result.blocked) {
      return NextResponse.json(
        { error: `No se puede eliminar: existen ${result.pedidos} pedidos asociados a esa semana`, ...result },
        { status: 409 }
      );
    }

    if (result.deleted === 0) {
      return NextResponse.json({ error: "Semana no encontrada" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[menu-weeks] Error eliminando:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
