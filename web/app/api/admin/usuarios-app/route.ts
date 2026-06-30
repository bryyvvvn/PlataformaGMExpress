import { Rol } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import db from "@/lib/db"

export const dynamic = "force-dynamic"

type EstadoVinculacion = "ASOCIADO" | "SIN_EMPRESA"

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

export async function GET() {
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

    const usuarios = await db.usuario.findMany({
      where: {
        rol: {
          in: [Rol.TRABAJADOR, Rol.REPRESENTANTE],
        },
      },
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

    const usuariosApp = usuarios.map((usuario) => ({
      id: usuario.id,
      nombre: obtenerNombreVisible(usuario),
      nombreUsuario: usuario.nombreUsuario,
      rut: usuario.rut,
      correo: usuario.correo,
      telefono: usuario.telefono,
      empresa: usuario.empresa,
      perfil: usuario.rol,
      estado: (usuario.empresaId === null ? "SIN_EMPRESA" : "ASOCIADO") satisfies EstadoVinculacion,
    }))

    const representantes = usuariosApp.filter(
      (usuario) => usuario.perfil === Rol.REPRESENTANTE
    ).length

    const sinEmpresa = usuariosApp.filter(
      (usuario) => usuario.estado === "SIN_EMPRESA"
    ).length

    return NextResponse.json({
      usuarios: usuariosApp,
      resumen: {
        total: usuariosApp.length,
        trabajadores: usuariosApp.length - representantes,
        representantes,
        sinEmpresa,
      },
    })
  } catch (error) {
    console.error("[admin/usuarios-app] Error:", error)
    return NextResponse.json(
      { error: "No se pudieron cargar los usuarios de la aplicación" },
      { status: 500 }
    )
  }
}
