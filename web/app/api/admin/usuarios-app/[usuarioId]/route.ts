import { EstadoEmpresa, Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"
import { obtenerNombreVisible } from "@/lib/usuarios/formatos"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ usuarioId: string }>
}

type PatchUsuarioPayload = {
  rol?: "TRABAJADOR" | "REPRESENTANTE"
  empresaId?: number | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validarPatchPayload(
  body: unknown
): { data: PatchUsuarioPayload; raw: Record<string, unknown> } | { error: string } {
  if (!isRecord(body)) {
    return { error: "El body debe ser un objeto JSON" }
  }

  const camposPermitidos = new Set(["rol", "empresaId"])
  const camposExtra = Object.keys(body).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos no permitidos: ${camposExtra.join(", ")}` }
  }

  const result: PatchUsuarioPayload = {}

  if ("rol" in body) {
    if (body.rol !== "TRABAJADOR" && body.rol !== "REPRESENTANTE") {
      return { error: "El rol debe ser TRABAJADOR o REPRESENTANTE" }
    }
    result.rol = body.rol
  }

  if ("empresaId" in body) {
    if (body.empresaId === null) {
      result.empresaId = null
    } else {
      const id =
        typeof body.empresaId === "number" ? body.empresaId : Number(body.empresaId)

      if (!Number.isInteger(id) || id <= 0) {
        return { error: "empresaId debe ser un ID válido o null" }
      }

      result.empresaId = id
    }
  }

  if (Object.keys(result).length === 0) {
    return { error: "Se debe especificar al menos un campo a actualizar" }
  }

  return { data: result, raw: body }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const { usuarioId } = await params

    let rawBody: unknown

    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
    }

    const validated = validarPatchPayload(rawBody)

    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { data: payload, raw } = validated

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, rol: true, empresaId: true },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (usuario.rol === Rol.ADMIN) {
      return NextResponse.json(
        { error: "No se puede modificar un usuario administrador" },
        { status: 400 }
      )
    }

    const rolFinal: Rol = payload.rol ? Rol[payload.rol] : usuario.rol

    let empresaIdFinal: number | null

    if (rolFinal === Rol.REPRESENTANTE) {
      if (!("empresaId" in raw) || payload.empresaId === null || payload.empresaId === undefined) {
        return NextResponse.json(
          { error: "La empresa es obligatoria para un representante" },
          { status: 400 }
        )
      }
      empresaIdFinal = payload.empresaId
    } else {
      // TRABAJADOR: keep current if not provided, desvincular if null explicitly
      if (!("empresaId" in raw)) {
        empresaIdFinal = usuario.empresaId
      } else {
        empresaIdFinal = payload.empresaId ?? null
      }
    }

    if (empresaIdFinal !== null) {
      const empresa = await db.empresa.findUnique({
        where: { id: empresaIdFinal },
        select: { id: true, estado: true },
      })

      if (!empresa) {
        return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
      }

      if (empresa.estado !== EstadoEmpresa.ACTIVA) {
        return NextResponse.json(
          { error: "La empresa seleccionada no está activa" },
          { status: 400 }
        )
      }
    }

    const usuarioActualizado = await db.usuario.update({
      where: { id: usuario.id },
      data: {
        rol: rolFinal,
        empresaId: empresaIdFinal,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        nombreUsuario: true,
        rut: true,
        correo: true,
        telefono: true,
        rol: true,
        empresaId: true,
        empresa: {
          select: { id: true, nombre: true },
        },
      },
    })

    return NextResponse.json({
      usuario: {
        id: usuarioActualizado.id,
        nombre: obtenerNombreVisible(usuarioActualizado),
        nombreUsuario: usuarioActualizado.nombreUsuario,
        rut: usuarioActualizado.rut,
        correo: usuarioActualizado.correo,
        telefono: usuarioActualizado.telefono,
        empresa: usuarioActualizado.empresa,
        perfil: usuarioActualizado.rol,
        estado:
          usuarioActualizado.empresaId === null ? "SIN_EMPRESA" : "ASOCIADO",
      },
    })
  } catch (error) {
    console.error("[admin/usuarios-app/[usuarioId]] Error:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el usuario" },
      { status: 500 }
    )
  }
}
