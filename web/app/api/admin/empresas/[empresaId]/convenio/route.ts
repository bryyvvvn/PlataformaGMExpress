import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ empresaId: string }>
}

const CAMPOS_CONVENIO = [
  "permitePlato",
  "permiteEntrada",
  "permitePostre",
  "permitePan",
  "permiteJugo",
  "permiteBebida",
  "permiteAguaSaborizada",
] as const

type CampoConvenio = (typeof CAMPOS_CONVENIO)[number]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validarConvenioPayload(body: unknown) {
  if (!isRecord(body)) {
    return { error: "El body debe ser un objeto JSON" }
  }

  const camposPermitidos = new Set<string>(CAMPOS_CONVENIO)
  const camposExtra = Object.keys(body).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos no permitidos: ${camposExtra.join(", ")}` }
  }

  for (const campo of CAMPOS_CONVENIO) {
    if (!(campo in body)) {
      return { error: `Falta el campo ${campo}` }
    }

    if (typeof body[campo] !== "boolean") {
      return { error: `El campo ${campo} debe ser booleano` }
    }
  }

  return {
    data: CAMPOS_CONVENIO.reduce(
      (acc, campo) => ({
        ...acc,
        [campo]: body[campo],
      }),
      {} as Record<CampoConvenio, boolean>
    ),
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
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

    const payload = validarConvenioPayload(body)

    if ("error" in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const convenio = await db.convenioEmpresa.upsert({
      where: { empresaId },
      update: payload.data,
      create: {
        empresaId,
        ...payload.data,
      },
      select: {
        id: true,
        empresaId: true,
        permitePlato: true,
        permiteEntrada: true,
        permitePostre: true,
        permitePan: true,
        permiteJugo: true,
        permiteBebida: true,
        permiteAguaSaborizada: true,
      },
    })

    return NextResponse.json({ convenio })
  } catch (error) {
    console.error("[admin/empresas/convenio] Error:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el convenio" },
      { status: 500 }
    )
  }
}
