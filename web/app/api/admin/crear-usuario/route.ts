import { clerkClient } from "@clerk/nextjs/server"
import { EstadoEmpresa, Prisma, Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"
import {
  normalizarTelefonoChileno,
  TELEFONO_CHILENO_ERROR,
} from "@/lib/usuarios/telefono"

export const dynamic = "force-dynamic"

type ValidationResult<T> = { data: T } | { error: string; status?: number }

type RolCreable = "TRABAJADOR" | "REPRESENTANTE"

type CrearUsuarioPayload = {
  rut: string
  rutUsername: string
  nombre: string
  apellido: string
  password: string
  empresaId: number
  telefono: string
  correo: string
  rol: RolCreable
}

type ClerkErrorItem = {
  code?: string
  message?: string
  longMessage?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizarTextoObligatorio(
  value: unknown,
  campo: string,
  maxLength: number
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { error: `${campo} es obligatorio` }
  }

  const normalizado = value.trim()

  if (normalizado.length === 0) {
    return { error: `${campo} es obligatorio` }
  }

  if (normalizado.length > maxLength) {
    return { error: `${campo} no puede superar ${maxLength} caracteres` }
  }

  return { data: normalizado }
}

function obtenerRutComparable(value: string) {
  return value.replace(/[.\-\s]/g, "").toUpperCase()
}

function normalizarRut(value: unknown): ValidationResult<{
  rut: string
  rutUsername: string
}> {
  const rutTexto = normalizarTextoObligatorio(value, "RUT", 20)
  if ("error" in rutTexto) return rutTexto

  const limpio = obtenerRutComparable(rutTexto.data)

  if (limpio.length < 2 || limpio.length > 10) {
    return { error: "RUT invalido" }
  }

  const cuerpo = limpio.slice(0, -1)
  const digito = limpio.slice(-1)

  if (!/^\d+$/.test(cuerpo) || !/^[0-9K]$/.test(digito)) {
    return { error: "RUT invalido" }
  }

  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return {
    data: {
      rut: `${cuerpoConPuntos}-${digito}`,
      rutUsername: limpio.toLowerCase(),
    },
  }
}

function normalizarCorreo(value: unknown): ValidationResult<string> {
  const correo = normalizarTextoObligatorio(value, "Correo", 100)
  if ("error" in correo) return correo

  const normalizado = correo.data.toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)) {
    return { error: "Correo invalido" }
  }

  return { data: normalizado }
}

function normalizarTelefono(value: unknown): ValidationResult<string> {
  const telefono = normalizarTextoObligatorio(value, "Telefono", 30)
  if ("error" in telefono) return telefono

  try {
    const normalizado = normalizarTelefonoChileno(telefono.data)

    if (!normalizado) {
      return { error: "Telefono es obligatorio" }
    }

    return { data: normalizado }
  } catch {
    return { error: TELEFONO_CHILENO_ERROR }
  }
}

function normalizarEmpresaId(value: unknown): ValidationResult<number> {
  const empresaId = Number(value)

  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    return { error: "Empresa es obligatoria" }
  }

  return { data: empresaId }
}

function normalizarRol(value: unknown): ValidationResult<RolCreable> {
  if (value === undefined || value === null || value === "") {
    return { data: Rol.TRABAJADOR }
  }

  if (value !== Rol.TRABAJADOR && value !== Rol.REPRESENTANTE) {
    return { error: "No se puede crear usuarios con ese rol" }
  }

  return { data: value }
}

function validarPayload(body: unknown): ValidationResult<CrearUsuarioPayload> {
  if (!isRecord(body)) {
    return { error: "Body JSON invalido" }
  }

  const camposPermitidos = new Set([
    "rut",
    "nombre",
    "apellido",
    "password",
    "empresaId",
    "telefono",
    "correo",
    "rol",
  ])
  const camposExtra = Object.keys(body).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos no permitidos: ${camposExtra.join(", ")}` }
  }

  const rut = normalizarRut(body.rut)
  if ("error" in rut) return rut

  const nombre = normalizarTextoObligatorio(body.nombre, "Nombre", 100)
  if ("error" in nombre) return nombre

  const apellido = normalizarTextoObligatorio(body.apellido, "Apellido", 100)
  if ("error" in apellido) return apellido

  const password = normalizarTextoObligatorio(body.password, "Contrasena", 256)
  if ("error" in password) return password

  if (password.data.length < 8) {
    return { error: "La contrasena debe tener al menos 8 caracteres" }
  }

  const empresaId = normalizarEmpresaId(body.empresaId)
  if ("error" in empresaId) return empresaId

  const telefono = normalizarTelefono(body.telefono)
  if ("error" in telefono) return telefono

  const correo = normalizarCorreo(body.correo)
  if ("error" in correo) return correo

  const rol = normalizarRol(body.rol)
  if ("error" in rol) return rol

  return {
    data: {
      rut: rut.data.rut,
      rutUsername: rut.data.rutUsername,
      nombre: nombre.data,
      apellido: apellido.data,
      password: password.data,
      empresaId: empresaId.data,
      telefono: telefono.data,
      correo: correo.data,
      rol: rol.data,
    },
  }
}

function obtenerMensajeSeguro(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error
  }

  return "Error desconocido"
}

function obtenerPrimerErrorClerk(error: unknown): ClerkErrorItem | null {
  if (!isRecord(error)) return null

  const errors = Array.isArray(error.errors)
    ? error.errors
    : isRecord(error.data) && Array.isArray(error.data.errors)
      ? error.data.errors
      : null

  if (!errors || errors.length === 0 || !isRecord(errors[0])) {
    return null
  }

  return {
    code: typeof errors[0].code === "string" ? errors[0].code : undefined,
    message:
      typeof errors[0].message === "string" ? errors[0].message : undefined,
    longMessage:
      typeof errors[0].longMessage === "string"
        ? errors[0].longMessage
        : undefined,
  }
}

function obtenerRespuestaErrorClerk(error: unknown) {
  const primerError = obtenerPrimerErrorClerk(error)
  const codigo = primerError?.code?.toLowerCase() ?? ""
  const mensaje = [
    primerError?.message,
    primerError?.longMessage,
    obtenerMensajeSeguro(error),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (
    codigo.includes("email") ||
    mensaje.includes("email") ||
    mensaje.includes("correo")
  ) {
    if (mensaje.includes("exist") || codigo.includes("exist")) {
      return {
        error: "Ya existe un usuario en Clerk con ese correo.",
        status: 409,
      }
    }
  }

  if (mensaje.includes("username") && mensaje.includes("exist")) {
    return {
      error: "Ya existe un usuario en Clerk con ese RUT o correo.",
      status: 409,
    }
  }

  const status =
    isRecord(error) && typeof error.status === "number" ? error.status : 500

  return {
    error:
      primerError?.message ??
      primerError?.longMessage ??
      "No se pudo crear el usuario en Clerk",
    status,
  }
}

function obtenerErrorPrisma(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return { error: "Ya existe un usuario con esos datos.", status: 409 }
  }

  return { error: "No se pudo guardar el usuario en la base de datos", status: 500 }
}

async function validarDuplicadosLocales(payload: CrearUsuarioPayload) {
  const usuariosConRut = await db.usuario.findMany({
    where: { rut: { not: null } },
    select: { rut: true },
  })

  const rutComparable = obtenerRutComparable(payload.rut)
  const existeRut = usuariosConRut.some(
    (usuario) =>
      usuario.rut !== null && obtenerRutComparable(usuario.rut) === rutComparable
  )

  if (existeRut) {
    return { error: "Ya existe un usuario con ese RUT.", status: 409 }
  }

  const usuarioConCorreo = await db.usuario.findFirst({
    where: {
      correo: {
        equals: payload.correo,
        mode: "insensitive",
      },
    },
    select: { id: true },
  })

  if (usuarioConCorreo) {
    return { error: "Ya existe un usuario con ese correo.", status: 409 }
  }

  const usuariosConTelefono = await db.usuario.findMany({
    where: { telefono: { not: null } },
    select: { telefono: true },
  })

  const existeTelefono = usuariosConTelefono.some((usuario) => {
    if (!usuario.telefono) return false

    try {
      return normalizarTelefonoChileno(usuario.telefono) === payload.telefono
    } catch {
      return usuario.telefono.trim() === payload.telefono
    }
  })

  if (existeTelefono) {
    return { error: "Ya existe un usuario con ese telefono.", status: 409 }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    return await crearUsuario(req)
  } catch (error) {
    console.error(
      "[admin/crear-usuario] Error inesperado:",
      obtenerMensajeSeguro(error)
    )

    return NextResponse.json(
      { error: "No se pudo crear el usuario" },
      { status: 500 }
    )
  }
}

async function crearUsuario(req: NextRequest) {
  const admin = await validarAdministrador()

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
    return NextResponse.json(
      { error: payload.error },
      { status: payload.status ?? 400 }
    )
  }

  const empresa = await db.empresa.findUnique({
    where: { id: payload.data.empresaId },
    select: { id: true, nombre: true, estado: true },
  })

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  if (empresa.estado !== EstadoEmpresa.ACTIVA) {
    return NextResponse.json(
      { error: "La empresa seleccionada no esta activa" },
      { status: 400 }
    )
  }

  const duplicado = await validarDuplicadosLocales(payload.data)

  if (duplicado) {
    return NextResponse.json(
      { error: duplicado.error },
      { status: duplicado.status }
    )
  }

  const clerk = await clerkClient()

  let usuarioClerkId: string | null = null

  try {
    const usuarioClerk = await clerk.users.createUser({
      emailAddress: [payload.data.correo],
      password: payload.data.password,
      firstName: payload.data.nombre,
      lastName: payload.data.apellido,
      username: payload.data.rutUsername,
      publicMetadata: {
        role: payload.data.rol,
        rol: payload.data.rol,
        empresaId: payload.data.empresaId,
        rut: payload.data.rut,
      },
    })

    usuarioClerkId = usuarioClerk.id
  } catch (error) {
    const respuesta = obtenerRespuestaErrorClerk(error)

    console.error("[admin/crear-usuario] Clerk:", respuesta.error)

    return NextResponse.json(
      { error: respuesta.error },
      { status: respuesta.status }
    )
  }

  if (!usuarioClerkId) {
    return NextResponse.json(
      { error: "Clerk no retorno un ID de usuario valido" },
      { status: 500 }
    )
  }

  try {
    const usuario = await db.usuario.upsert({
      where: { id: usuarioClerkId },
      update: {
        nombreUsuario: payload.data.rutUsername,
        nombre: payload.data.nombre,
        apellido: payload.data.apellido,
        rut: payload.data.rut,
        correo: payload.data.correo,
        telefono: payload.data.telefono,
        rol: payload.data.rol,
        empresaId: payload.data.empresaId,
      },
      create: {
        id: usuarioClerkId,
        nombreUsuario: payload.data.rutUsername,
        nombre: payload.data.nombre,
        apellido: payload.data.apellido,
        rut: payload.data.rut,
        correo: payload.data.correo,
        telefono: payload.data.telefono,
        rol: payload.data.rol,
        empresaId: payload.data.empresaId,
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
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        usuario: {
          id: usuario.id,
          nombre: [usuario.nombre, usuario.apellido].filter(Boolean).join(" "),
          nombreUsuario: usuario.nombreUsuario,
          rut: usuario.rut,
          correo: usuario.correo,
          telefono: usuario.telefono,
          empresa: usuario.empresa,
          perfil: usuario.rol,
          estado: "ASOCIADO",
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const respuesta = obtenerErrorPrisma(error)

    console.error("[admin/crear-usuario] Base local:", respuesta.error)

    try {
      await clerk.users.deleteUser(usuarioClerkId)
    } catch (rollbackError) {
      console.error(
        "[admin/crear-usuario] Rollback Clerk:",
        obtenerMensajeSeguro(rollbackError)
      )

      return NextResponse.json(
        {
          error:
            "El usuario se creo en Clerk, pero fallo el guardado local y no se pudo eliminar automaticamente. Revisa Clerk antes de reintentar.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: `${respuesta.error}. La cuenta creada en Clerk fue revertida.`,
      },
      { status: respuesta.status }
    )
  }
}
