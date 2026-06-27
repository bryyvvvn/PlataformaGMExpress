import { NextResponse } from "next/server"
import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

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
