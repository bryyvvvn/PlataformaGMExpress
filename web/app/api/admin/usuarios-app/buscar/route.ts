import { Rol } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"

export const dynamic = "force-dynamic"

function obtenerNombreVisible(usuario: {
  nombre: string | null
  apellido: string | null
  nombreUsuario: string | null
  correo: string | null
}) {
  const nombreCompleto = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .join(" ")
    .trim()

  return (
    nombreCompleto ||
    usuario.nombreUsuario?.trim() ||
    usuario.correo?.trim() ||
    "Usuario sin nombre"
  )
}

function normalizarRutBusqueda(value: string) {
  return value.replace(/[.\-\s]/g, "")
}

function formatearRutConPuntos(value: string) {
  if (value.length < 2) return null

  const cuerpo = value.slice(0, -1)
  const digito = value.slice(-1)
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${cuerpoConPuntos}-${digito}`
}

function obtenerTerminosRut(query: string) {
  const terminos = new Set<string>([query])
  const rutLimpio = normalizarRutBusqueda(query)

  if (rutLimpio.length >= 2) {
    terminos.add(rutLimpio)

    const rutConPuntos = formatearRutConPuntos(rutLimpio)
    if (rutConPuntos) terminos.add(rutConPuntos)

    if (rutLimpio.length > 1) {
      terminos.add(`${rutLimpio.slice(0, -1)}-${rutLimpio.slice(-1)}`)
    }
  }

  return Array.from(terminos).filter((termino) => termino.trim().length >= 2)
}

async function validarAdministrador() {
  const { userId } = await auth()

  if (!userId) {
    return { error: "No autorizado", status: 401 as const }
  }

  const administrador = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true },
  })

  if (administrador?.rol !== Rol.ADMIN) {
    return { error: "Acceso denegado", status: 403 as const }
  }

  return { userId }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const query = (searchParams.get("q") ?? "").trim()

    if (query.length < 2) {
      return NextResponse.json({ usuarios: [] })
    }

    const terminosRut = obtenerTerminosRut(query)

    const usuarios = await db.usuario.findMany({
      where: {
        rol: {
          not: Rol.ADMIN,
        },
        OR: [
          { nombre: { contains: query, mode: "insensitive" } },
          { apellido: { contains: query, mode: "insensitive" } },
          { nombreUsuario: { contains: query, mode: "insensitive" } },
          { correo: { contains: query, mode: "insensitive" } },
          ...terminosRut.map((termino) => ({
            rut: { contains: termino, mode: "insensitive" as const },
          })),
        ],
      },
      take: 12,
      orderBy: [
        { nombre: "asc" },
        { apellido: "asc" },
        { nombreUsuario: "asc" },
      ],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        nombreUsuario: true,
        rut: true,
        correo: true,
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
      usuarios: usuarios.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        nombreUsuario: usuario.nombreUsuario,
        nombreCompleto: obtenerNombreVisible(usuario),
        rut: usuario.rut,
        correo: usuario.correo,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
        empresa: usuario.empresa,
      })),
    })
  } catch (error) {
    console.error("[admin/usuarios-app/buscar] Error:", error)
    return NextResponse.json(
      { error: "No se pudo buscar usuarios registrados" },
      { status: 500 }
    )
  }
}
