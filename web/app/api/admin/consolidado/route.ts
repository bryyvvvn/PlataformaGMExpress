import { auth } from "@clerk/nextjs/server"
import { Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { getConsolidadoDia } from "@/lib/admin/generar-consolidado"
import { getConsolidadoSemana } from "@/lib/admin/generar-consolidado-semana"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const usuario = await db.usuario.findUnique({
      where: { id: userId },
      select: { rol: true },
    })

    if (usuario?.rol !== Rol.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const modo = searchParams.get("modo") ?? "dia"
    const fechaParam = searchParams.get("fecha")
    const fecha = fechaParam ? new Date(fechaParam) : undefined
    const soloCenas = searchParams.get("cenas") === "true"

    if (modo === "semana") {
      const consolidado = await getConsolidadoSemana(fecha)
      return NextResponse.json(
        { modo: "semana", ...consolidado },
        { headers: { "Cache-Control": "no-store" } }
      )
    } else {
      const consolidado = await getConsolidadoDia(fecha, soloCenas)
      return NextResponse.json(
        { modo: "dia", ...consolidado },
        { headers: { "Cache-Control": "no-store" } }
      )
    }
  } catch (error) {
    console.error("[admin/consolidado] Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
