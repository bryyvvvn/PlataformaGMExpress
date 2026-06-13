import { auth } from "@clerk/nextjs/server"
import { Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import {
  crearPedidoManual,
  listarPedidosManuales,
  type FiltrosPedidosManuales,
} from "@/lib/admin/pedidos-manuales"
import { esFechaISOValida } from "@/lib/pedidos/cierre-pedidos"

export const dynamic = "force-dynamic"

type ValidationResult<T> = { data: T } | { error: string }

type CrearPedidoManualPayload = {
  empresaId: number
  fecha: string
  cantidad: number
  observacion: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function validarAdmin() {
  const { userId } = await auth()

  if (!userId) {
    return { error: "No autorizado", status: 401 as const }
  }

  const administrador = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true, nombre: true, apellido: true, nombreUsuario: true, correo: true },
  })

  if (administrador?.rol !== Rol.ADMIN) {
    return { error: "Acceso denegado", status: 403 as const }
  }

  const nombreVisible = [administrador.nombre, administrador.apellido].filter(Boolean).join(" ").trim()

  return {
    userId,
    creadoPor: (nombreVisible || administrador.nombreUsuario || administrador.correo || userId).slice(0, 100),
  }
}

function validarEnteroPositivo(value: unknown, campo: string): ValidationResult<number> {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return { error: `${campo} debe ser un n\u00famero entero mayor a 0` }
  }

  return { data: numberValue }
}

function validarObservacion(value: unknown): ValidationResult<string | null> {
  if (value === undefined || value === null) {
    return { data: null }
  }

  if (typeof value !== "string") {
    return { error: "observacion debe ser texto" }
  }

  const observacion = value.trim()

  if (observacion.length === 0) {
    return { data: null }
  }

  if (observacion.length > 500) {
    return { error: "observacion no puede superar 500 caracteres" }
  }

  return { data: observacion }
}

function validarPayload(body: unknown): ValidationResult<CrearPedidoManualPayload> {
  if (!isRecord(body)) {
    return { error: "El body debe ser un objeto JSON" }
  }

  if (body.empresaId === undefined || body.empresaId === null || body.empresaId === "") {
    return { error: "empresaId es requerido" }
  }

  const empresaId = validarEnteroPositivo(body.empresaId, "empresaId")
  if ("error" in empresaId) return empresaId

  if (typeof body.fecha !== "string" || body.fecha.length === 0) {
    return { error: "fecha es requerida" }
  }

  if (!esFechaISOValida(body.fecha)) {
    return { error: "fecha debe usar formato YYYY-MM-DD y ser v\u00e1lida" }
  }

  if (body.cantidad === undefined || body.cantidad === null || body.cantidad === "") {
    return { error: "cantidad es requerida" }
  }

  const cantidad = validarEnteroPositivo(body.cantidad, "cantidad")
  if ("error" in cantidad) return cantidad

  const observacion = validarObservacion(body.observacion)
  if ("error" in observacion) return observacion

  return {
    data: {
      empresaId: empresaId.data,
      fecha: body.fecha,
      cantidad: cantidad.data,
      observacion: observacion.data,
    },
  }
}

function obtenerFiltros(searchParams: URLSearchParams): ValidationResult<FiltrosPedidosManuales> {
  const empresaIdRaw = searchParams.get("empresaId")
  const fechaDesde = searchParams.get("fechaDesde")?.trim()
  const fechaHasta = searchParams.get("fechaHasta")?.trim()
  const filtros: FiltrosPedidosManuales = {}

  if (empresaIdRaw) {
    const empresaId = validarEnteroPositivo(empresaIdRaw, "empresaId")
    if ("error" in empresaId) return empresaId
    filtros.empresaId = empresaId.data
  }

  if (fechaDesde) {
    if (!esFechaISOValida(fechaDesde)) {
      return { error: "fechaDesde debe usar formato YYYY-MM-DD y ser v\u00e1lida" }
    }
    filtros.fechaDesde = fechaDesde
  }

  if (fechaHasta) {
    if (!esFechaISOValida(fechaHasta)) {
      return { error: "fechaHasta debe usar formato YYYY-MM-DD y ser v\u00e1lida" }
    }
    filtros.fechaHasta = fechaHasta
  }

  if (filtros.fechaDesde && filtros.fechaHasta && filtros.fechaDesde > filtros.fechaHasta) {
    return { error: "fechaDesde no puede ser posterior a fechaHasta" }
  }

  return { data: filtros }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await validarAdmin()
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const { searchParams } = new URL(req.url)
    const filtros = obtenerFiltros(searchParams)

    if ("error" in filtros) {
      return NextResponse.json({ error: filtros.error }, { status: 400 })
    }

    const pedidosManuales = await listarPedidosManuales(filtros.data)
    return NextResponse.json({ pedidosManuales })
  } catch (error) {
    console.error("[admin/pedidos-manuales] Error:", error)
    return NextResponse.json(
      { error: "No se pudieron cargar los pedidos manuales" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await validarAdmin()
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 })
    }

    const payload = validarPayload(body)

    if ("error" in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const pedidoManual = await crearPedidoManual({
      ...payload.data,
      creadoPor: admin.creadoPor,
    })

    return NextResponse.json({ pedidoManual }, { status: 201 })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo crear el pedido manual"
    const status = mensaje.includes("empresa") ? 400 : 500

    if (status === 500) {
      console.error("[admin/pedidos-manuales] Error creando:", error)
    }

    return NextResponse.json({ error: mensaje }, { status })
  }
}
