import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"

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
  "trabajaFinDeSemana",
] as const

const TIPOS_EMPAQUETADO = [
  "BOWL_CRAFT",
  "C10_ALUMINIO",
  "SERVICIO_TRADICIONAL_PLATO",
] as const

type CampoConvenio = (typeof CAMPOS_CONVENIO)[number]
type TipoEmpaquetadoValue = (typeof TIPOS_EMPAQUETADO)[number]
type ConvenioPayload = Record<CampoConvenio, boolean> & {
  tipoEmpaquetado?: TipoEmpaquetadoValue | null
}
type ValidationResult<T> = { data: T } | { error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validarTipoEmpaquetado(
  value: unknown
): ValidationResult<TipoEmpaquetadoValue | null> {
  if (value === undefined || value === null || value === "") {
    return { data: null }
  }

  if (
    typeof value !== "string" ||
    !TIPOS_EMPAQUETADO.includes(value as TipoEmpaquetadoValue)
  ) {
    return { error: "El tipo de empaquetado no es valido" }
  }

  return { data: value as TipoEmpaquetadoValue }
}

function validarConvenioPayload(body: unknown): ValidationResult<ConvenioPayload> {
  if (!isRecord(body)) {
    return { error: "El body debe ser un objeto JSON" }
  }

  const camposPermitidos = new Set<string>([
    ...CAMPOS_CONVENIO,
    "tipoEmpaquetado",
  ])
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

  const data = CAMPOS_CONVENIO.reduce(
    (acc, campo) => ({
      ...acc,
      [campo]: body[campo],
    }),
    {} as ConvenioPayload
  )

  if ("tipoEmpaquetado" in body) {
    const tipoEmpaquetado = validarTipoEmpaquetado(body.tipoEmpaquetado)
    if ("error" in tipoEmpaquetado) return tipoEmpaquetado

    data.tipoEmpaquetado = tipoEmpaquetado.data
  }

  return { data }
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
        trabajaFinDeSemana: true,
        tipoEmpaquetado: true,
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
