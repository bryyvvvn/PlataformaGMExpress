import { NextRequest, NextResponse } from "next/server"
import { EstadoEmpresa } from "@prisma/client"
import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ empresaId: string }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

    const { empresaId: empresaIdParam } = await params
    const empresaId = Number(empresaIdParam)

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      return NextResponse.json({ error: "empresaId invalido" }, { status: 400 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 })
    }

    if (!isRecord(body)) {
      return NextResponse.json({ error: "El body debe ser un objeto JSON" }, { status: 400 })
    }

    if (body.estado !== EstadoEmpresa.ACTIVA && body.estado !== EstadoEmpresa.INACTIVA) {
      return NextResponse.json(
        { error: "El estado debe ser ACTIVA o INACTIVA" },
        { status: 400 }
      )
    }

    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const empresaActualizada = await db.empresa.update({
      where: { id: empresaId },
      data: { estado: body.estado },
      select: {
        id: true,
        nombre: true,
        estado: true,
      },
    })

    return NextResponse.json({ empresa: empresaActualizada })
  } catch (error) {
    console.error("[admin/empresas/estado] Error:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el estado de la empresa" },
      { status: 500 }
    )
  }
}
