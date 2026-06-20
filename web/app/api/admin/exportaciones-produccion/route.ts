import { NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const exportaciones = await db.exportacionProduccion.findMany({
      orderBy: { creadoEn: "desc" },
      take: 50,
    })
    return NextResponse.json({ exportaciones })
  } catch (error) {
    console.error("[exportaciones-produccion] Error:", error)
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    )
  }
}
