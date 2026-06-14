import { Rol } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"

export const dynamic = "force-dynamic"

const LIMITE_POR_TIPO = 5

type ResultadoBusqueda = {
  id: string
  tipo: "EMPRESA" | "TRABAJADOR" | "REPRESENTANTE" | "ADMIN"
  titulo: string
  descripcion: string
  href: string
}

function obtenerNombreUsuario(usuario: {
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

function rolesCoincidentes(query: string): Rol[] {
  const normalized = query.toLowerCase()
  const roles: Rol[] = []

  if ("trabajador".includes(normalized)) roles.push(Rol.TRABAJADOR)
  if ("representante".includes(normalized)) roles.push(Rol.REPRESENTANTE)
  if ("admin".includes(normalized) || "administrador".includes(normalized)) {
    roles.push(Rol.ADMIN)
  }

  return roles
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const administrador = await db.usuario.findUnique({
      where: { id: userId },
      select: { rol: true },
    })

    if (administrador?.rol !== Rol.ADMIN) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = (searchParams.get("q") ?? "").trim()

    if (query.length < 2) {
      return NextResponse.json({ resultados: [] })
    }

    const roles = rolesCoincidentes(query)

    const [empresas, usuarios] = await Promise.all([
      db.empresa.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: "insensitive" } },
            { razonSocial: { contains: query, mode: "insensitive" } },
            { nombreComercial: { contains: query, mode: "insensitive" } },
            { rut: { contains: query, mode: "insensitive" } },
            { correo_contacto: { contains: query, mode: "insensitive" } },
          ],
        },
        take: LIMITE_POR_TIPO,
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          nombreComercial: true,
          rut: true,
          correo_contacto: true,
        },
      }),
      db.usuario.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: "insensitive" } },
            { apellido: { contains: query, mode: "insensitive" } },
            { nombreUsuario: { contains: query, mode: "insensitive" } },
            { rut: { contains: query, mode: "insensitive" } },
            { correo: { contains: query, mode: "insensitive" } },
            ...(roles.length > 0 ? [{ rol: { in: roles } }] : []),
          ],
        },
        take: LIMITE_POR_TIPO,
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
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      }),
    ])

    const resultadosEmpresas: ResultadoBusqueda[] = empresas.map((empresa) => ({
      id: `empresa-${empresa.id}`,
      tipo: "EMPRESA",
      titulo: empresa.nombre,
      descripcion:
        empresa.rut ||
        empresa.correo_contacto ||
        empresa.razonSocial ||
        empresa.nombreComercial ||
        "Empresa cliente",
      href: `/empresas/${empresa.id}`,
    }))

    const resultadosUsuarios: ResultadoBusqueda[] = usuarios.map((usuario) => ({
      id: `usuario-${usuario.id}`,
      tipo: usuario.rol,
      titulo: obtenerNombreUsuario(usuario),
      descripcion:
        usuario.empresa?.nombre ||
        usuario.rut ||
        usuario.correo ||
        "Usuario sin empresa asociada",
      href: usuario.empresa ? `/empresas/${usuario.empresa.id}` : "/usuarios",
    }))

    return NextResponse.json({
      resultados: [...resultadosEmpresas, ...resultadosUsuarios],
    })
  } catch (error) {
    console.error("[admin/busqueda] Error:", error)
    return NextResponse.json(
      { error: "No se pudo realizar la busqueda" },
      { status: 500 }
    )
  }
}
