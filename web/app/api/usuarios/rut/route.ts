import { clerkClient, verifyToken } from "@clerk/nextjs/server"
import { Rol } from "@prisma/client"
import { NextResponse } from "next/server"

import db from "@/lib/db"
import { guardarRutSchema } from "@/lib/schemas/usuarios"
import { normalizarTelefonoChileno } from "@/lib/usuarios/telefono"

function normalizarRutComparable(rut: string) {
  return rut.replace(/[.\-\s]/g, "").toUpperCase()
}

async function validarDuplicadoRut(clerkId: string, rut: string) {
  const usuarios = await db.usuario.findMany({
    where: { rut: { not: null } },
    select: { id: true, rut: true },
  })

  const rutComparable = normalizarRutComparable(rut)

  return usuarios.some(
    (usuario) =>
      usuario.id !== clerkId &&
      usuario.rut !== null &&
      normalizarRutComparable(usuario.rut) === rutComparable
  )
}

async function validarDuplicadoTelefono(clerkId: string, telefono: string) {
  const usuarios = await db.usuario.findMany({
    where: { telefono: { not: null } },
    select: { id: true, telefono: true },
  })

  return usuarios.some((usuario) => {
    if (usuario.id === clerkId || !usuario.telefono) return false

    try {
      return normalizarTelefonoChileno(usuario.telefono) === telefono
    } catch {
      return usuario.telefono.trim() === telefono
    }
  })
}

function obtenerCorreoPrincipal(user: Awaited<ReturnType<typeof obtenerUsuarioClerk>>) {
  return user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
}

async function obtenerUsuarioClerk(userId: string) {
  const clerk = await clerkClient()
  return clerk.users.getUser(userId)
}

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  let tokenUserId: string

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })
    tokenUserId = payload.sub
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 })
  }

  const result = guardarRutSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 })
  }

  if (result.data.clerkId !== tokenUserId) {
    return NextResponse.json(
      { error: "No autorizado para modificar este usuario" },
      { status: 403 }
    )
  }

  let telefonoNormalizado: string

  try {
    const telefono = normalizarTelefonoChileno(result.data.telefono)

    if (!telefono) {
      return NextResponse.json(
        {
          error:
            "El telefono debe tener un formato valido, por ejemplo +56 9 1234 5678.",
        },
        { status: 400 }
      )
    }

    telefonoNormalizado = telefono
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "El telefono debe tener un formato valido, por ejemplo +56 9 1234 5678.",
      },
      { status: 400 }
    )
  }

  try {
    const [rutDuplicado, telefonoDuplicado] = await Promise.all([
      validarDuplicadoRut(result.data.clerkId, result.data.rut),
      validarDuplicadoTelefono(result.data.clerkId, telefonoNormalizado),
    ])

    if (rutDuplicado) {
      return NextResponse.json(
        { error: "Este RUT ya esta registrado." },
        { status: 409 }
      )
    }

    if (telefonoDuplicado) {
      return NextResponse.json(
        { error: "Este telefono ya esta registrado." },
        { status: 409 }
      )
    }

    const usuarioClerk = await obtenerUsuarioClerk(tokenUserId)
    const correo = obtenerCorreoPrincipal(usuarioClerk)

    const usuario = await db.usuario.upsert({
      where: { id: tokenUserId },
      update: {
        rut: result.data.rut,
        telefono: telefonoNormalizado,
      },
      create: {
        id: tokenUserId,
        nombreUsuario: usuarioClerk.username,
        nombre: usuarioClerk.firstName,
        apellido: usuarioClerk.lastName,
        correo,
        rut: result.data.rut,
        telefono: telefonoNormalizado,
        rol: Rol.TRABAJADOR,
        empresaId: null,
      },
    })

    return NextResponse.json({ ok: true, success: true, usuario })
  } catch (error) {
    console.error("[usuarios/rut] error", error)

    return NextResponse.json(
      { error: "No se pudo completar el perfil." },
      { status: 500 }
    )
  }
}
