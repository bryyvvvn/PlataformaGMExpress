import { clerkClient, verifyToken } from "@clerk/nextjs/server"
import { Rol } from "@prisma/client"
import { NextResponse } from "next/server"

import db from "@/lib/db"
import { guardarRutSchema } from "@/lib/schemas/usuarios"
import { normalizarTelefonoChileno } from "@/lib/usuarios/telefono"

function normalizarRutComparable(rut: string) {
  return rut.replace(/[.\-\s]/g, "").toUpperCase()
}

function obtenerAmbienteSecretKey() {
  const secretKey = process.env.CLERK_SECRET_KEY

  if (!secretKey) return "missing"
  if (secretKey.startsWith("sk_live")) return "live"
  if (secretKey.startsWith("sk_test")) return "test"

  return "unknown"
}

function sanitizarMensajeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return message.replace(/(sk|pk)_(live|test)_[A-Za-z0-9._-]+/g, "$1_$2_...")
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
    console.error("[usuarios/rut] token ausente", {
      hasAuthorizationHeader: Boolean(authHeader),
      route: "/api/usuarios/rut",
    })

    return NextResponse.json(
      { error: "No autorizado: token ausente." },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7).trim()

  if (!token) {
    console.error("[usuarios/rut] token ausente", {
      hasAuthorizationHeader: true,
      route: "/api/usuarios/rut",
    })

    return NextResponse.json(
      { error: "No autorizado: token ausente." },
      { status: 401 }
    )
  }

  let tokenUserId: string

  try {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error("CLERK_SECRET_KEY no configurada")
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    if (!payload.sub) {
      throw new Error("Token Clerk sin subject")
    }

    tokenUserId = payload.sub
  } catch (error) {
    console.error("[usuarios/rut] error autenticando Clerk", {
      message: sanitizarMensajeError(error),
      secretKeyEnv: obtenerAmbienteSecretKey(),
      tokenLength: token.length,
      route: "/api/usuarios/rut",
    })

    return NextResponse.json(
      {
        error:
          "No autorizado: sesión inválida o ambiente Clerk incompatible.",
      },
      { status: 401 }
    )
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
    console.error("[usuarios/rut] usuario no coincide con sesion", {
      hasBodyClerkId: Boolean(result.data.clerkId),
      hasTokenUserId: Boolean(tokenUserId),
      route: "/api/usuarios/rut",
    })

    return NextResponse.json(
      { error: "No autorizado: el usuario no coincide con la sesión." },
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
