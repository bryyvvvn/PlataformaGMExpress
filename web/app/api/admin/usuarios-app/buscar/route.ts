import { Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"
import { obtenerNombreVisible } from "@/lib/usuarios/formatos"
import { obtenerTerminosTelefonoBusqueda } from "@/lib/usuarios/telefono"
import { obtenerTerminosRut } from "@/lib/usuarios/validaciones"

export const dynamic = "force-dynamic"

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
    const terminosTelefono = obtenerTerminosTelefonoBusqueda(query)

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
          ...terminosTelefono.map((termino) => ({
            telefono: { contains: termino, mode: "insensitive" as const },
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
      usuarios: usuarios.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        nombreUsuario: usuario.nombreUsuario,
        nombreCompleto: obtenerNombreVisible(usuario),
        rut: usuario.rut,
        correo: usuario.correo,
        telefono: usuario.telefono,
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
