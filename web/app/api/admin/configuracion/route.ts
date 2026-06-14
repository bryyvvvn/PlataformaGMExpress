import { auth } from "@clerk/nextjs/server"
import { Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"

export const dynamic = "force-dynamic"

const CONFIGURACION_ID = 1
const CONFIGURACION_DEFAULTS = {
  id: CONFIGURACION_ID,
  horaLimite: "11:00",
  diasAnticipacion: 1,
  mensajePedidoTrabajadores: null as string | null,
}

type ValidationResult<T> = { data: T } | { error: string }

type ConfiguracionUpdateData = {
  horaLimite: string
  mensajePedidoTrabajadores: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function requireAdmin() {
  const { userId } = await auth()

  if (!userId) {
    return { error: "No autorizado", status: 401 as const }
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true },
  })

  if (usuario?.rol !== Rol.ADMIN) {
    return { error: "Acceso denegado", status: 403 as const }
  }

  return { userId }
}

function validarHoraLimite(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") {
    return { error: "La hora limite debe ser texto" }
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return { error: "La hora limite debe tener formato HH:mm valido" }
  }

  return { data: value }
}

function validarMensaje(value: unknown): ValidationResult<string | null> {
  if (value === undefined || value === null) {
    return { data: null }
  }

  if (typeof value !== "string") {
    return { error: "El mensaje para trabajadores debe ser texto" }
  }

  const normalized = value.trim()

  if (normalized.length === 0) {
    return { data: null }
  }

  if (normalized.length > 500) {
    return { error: "El mensaje para trabajadores no puede superar 500 caracteres" }
  }

  return { data: normalized }
}

function validarConfiguracionPayload(
  body: unknown
): ValidationResult<ConfiguracionUpdateData> {
  if (!isRecord(body)) {
    return { error: "El body debe ser un objeto JSON" }
  }

  const camposPermitidos = new Set([
    "horaLimite",
    "mensajePedidoTrabajadores",
  ])
  const camposExtra = Object.keys(body).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos no permitidos: ${camposExtra.join(", ")}` }
  }

  const horaLimite = validarHoraLimite(body.horaLimite)
  if ("error" in horaLimite) return horaLimite

  const mensajePedidoTrabajadores = validarMensaje(body.mensajePedidoTrabajadores)
  if ("error" in mensajePedidoTrabajadores) return mensajePedidoTrabajadores

  return {
    data: {
      horaLimite: horaLimite.data,
      mensajePedidoTrabajadores: mensajePedidoTrabajadores.data,
    },
  }
}

async function asegurarConfiguracion() {
  return db.configuracionSistema.upsert({
    where: { id: CONFIGURACION_ID },
    update: {},
    create: CONFIGURACION_DEFAULTS,
    select: {
      id: true,
      horaLimite: true,
      diasAnticipacion: true,
      mensajePedidoTrabajadores: true,
      actualizadoEn: true,
    },
  })
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const configuracion = await asegurarConfiguracion()
    return NextResponse.json({ configuracion })
  } catch (error) {
    console.error("[admin/configuracion] Error GET:", error)
    return NextResponse.json(
      { error: "No se pudo cargar la configuracion" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 })
    }

    const payload = validarConfiguracionPayload(body)

    if ("error" in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    await asegurarConfiguracion()

    const configuracion = await db.configuracionSistema.update({
      where: { id: CONFIGURACION_ID },
      data: {
        horaLimite: payload.data.horaLimite,
        mensajePedidoTrabajadores: payload.data.mensajePedidoTrabajadores,
        actualizadoEn: new Date(),
      },
      select: {
        id: true,
        horaLimite: true,
        diasAnticipacion: true,
        mensajePedidoTrabajadores: true,
        actualizadoEn: true,
      },
    })

    return NextResponse.json({ configuracion })
  } catch (error) {
    console.error("[admin/configuracion] Error PATCH:", error)
    return NextResponse.json(
      { error: "No se pudo guardar la configuracion" },
      { status: 500 }
    )
  }
}
