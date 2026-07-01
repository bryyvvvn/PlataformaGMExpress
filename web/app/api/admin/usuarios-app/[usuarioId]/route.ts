import { EstadoEmpresa, Prisma, Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"
import { obtenerNombreVisible } from "@/lib/usuarios/formatos"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ usuarioId: string }>
}

type ValidationResult<T> = { data: T } | { error: string }

type EditarUsuarioPayload = {
  rol?: "TRABAJADOR" | "REPRESENTANTE"
  empresaId?: number | null
  nombre?: string
  rut?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizarStringOpcional(
  value: unknown,
  campo: string,
  maxLength: number
): ValidationResult<string | null | undefined> {
  if (value === undefined) {
    return { data: undefined }
  }

  if (value === null) {
    return { data: null }
  }

  if (typeof value !== "string") {
    return { error: `${campo} debe ser texto` }
  }

  const normalizado = value.trim()

  if (normalizado.length === 0) {
    return { data: null }
  }

  if (normalizado.length > maxLength) {
    return { error: `${campo} no puede superar ${maxLength} caracteres` }
  }

  return { data: normalizado }
}

function validarPayload(body: unknown): ValidationResult<EditarUsuarioPayload> {
  if (!isRecord(body)) {
    return { error: "Body JSON invalido" }
  }

  const camposPermitidos = new Set(["rol", "empresaId", "nombre", "rut"])
  const camposExtra = Object.keys(body).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos no permitidos: ${camposExtra.join(", ")}` }
  }

  const payload: EditarUsuarioPayload = {}

  if (body.rol !== undefined) {
    if (body.rol !== Rol.TRABAJADOR && body.rol !== Rol.REPRESENTANTE) {
      return { error: "rol debe ser TRABAJADOR o REPRESENTANTE" }
    }

    payload.rol = body.rol
  }

  if (body.empresaId !== undefined) {
    if (body.empresaId === null) {
      payload.empresaId = null
    } else {
      const empresaId = Number(body.empresaId)

      if (!Number.isInteger(empresaId) || empresaId <= 0) {
        return { error: "empresaId debe ser un numero positivo o null" }
      }

      payload.empresaId = empresaId
    }
  }

  const nombre = normalizarStringOpcional(body.nombre, "nombre", 100)
  if ("error" in nombre) return nombre

  if (nombre.data === null) {
    return { error: "nombre no puede estar vacio" }
  }

  if (nombre.data !== undefined) {
    payload.nombre = nombre.data
  }

  const rut = normalizarStringOpcional(body.rut, "rut", 20)
  if ("error" in rut) return rut

  if (rut.data !== undefined) {
    payload.rut = rut.data
  }

  if (
    payload.rol === undefined &&
    payload.empresaId === undefined &&
    payload.nombre === undefined &&
    payload.rut === undefined
  ) {
    return { error: "No hay cambios para actualizar" }
  }

  return { data: payload }
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

    const { usuarioId } = await params

    if (usuarioId.trim().length === 0) {
      return NextResponse.json({ error: "usuarioId invalido" }, { status: 400 })
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

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        rol: true,
        empresaId: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (usuario.rol === Rol.ADMIN) {
      return NextResponse.json(
        { error: "No se puede modificar un usuario administrador" },
        { status: 400 }
      )
    }

    const rolFinal = payload.data.rol ?? usuario.rol
    const empresaIdFueEspecificado = payload.data.empresaId !== undefined
    const empresaIdFinal = empresaIdFueEspecificado
      ? payload.data.empresaId
      : usuario.empresaId

    if (rolFinal === Rol.REPRESENTANTE && empresaIdFinal === null) {
      return NextResponse.json(
        { error: "empresaId es obligatorio para representantes" },
        { status: 400 }
      )
    }

    if (empresaIdFinal !== null) {
      const empresa = await db.empresa.findUnique({
        where: { id: empresaIdFinal },
        select: {
          id: true,
          estado: true,
        },
      })

      if (!empresa) {
        return NextResponse.json(
          { error: "Empresa no encontrada" },
          { status: 404 }
        )
      }

      if (empresa.estado !== EstadoEmpresa.ACTIVA) {
        return NextResponse.json(
          { error: "La empresa seleccionada no esta activa" },
          { status: 400 }
        )
      }
    }

    const usuarioActualizado = await db.usuario.update({
      where: { id: usuario.id },
      data: {
        ...(payload.data.rol !== undefined ? { rol: payload.data.rol } : {}),
        ...(empresaIdFueEspecificado
          ? { empresaId: payload.data.empresaId }
          : {}),
        ...(payload.data.nombre !== undefined
          ? { nombre: payload.data.nombre, apellido: null }
          : {}),
        ...(payload.data.rut !== undefined ? { rut: payload.data.rut } : {}),
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
          select: {
            id: true,
            nombre: true,
          },
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese RUT" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el usuario" },
      { status: 500 }
    )
  }
}
