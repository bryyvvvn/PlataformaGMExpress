import { NextResponse } from "next/server"
import { Rol } from "@prisma/client"
import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ empresaId: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

    const { empresaId: empresaIdParam } = await params
    const empresaId = Number(empresaIdParam)

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      return NextResponse.json({ error: "empresaId invalido" }, { status: 400 })
    }

    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nombre: true,
      },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const usuarios = await db.usuario.findMany({
      where: {
        empresaId,
        rol: {
          in: [Rol.REPRESENTANTE, Rol.TRABAJADOR],
        },
      },
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        nombreUsuario: true,
        correo: true,
        rol: true,
        _count: {
          select: {
            pedidos: true,
          },
        },
      },
    })

    const trabajadores = usuarios.map((usuario) => {
      const nombreCompleto = [usuario.nombre, usuario.apellido]
        .filter(Boolean)
        .join(" ")
        .trim()

      const nombreVisible =
        nombreCompleto ||
        usuario.nombreUsuario?.trim() ||
        usuario.correo?.trim() ||
        "Usuario sin nombre"

      return {
        id: usuario.id,
        nombre: nombreVisible,
        rol: usuario.rol,
        pedidos: usuario._count.pedidos,
      }
    })

    const totalTrabajadores = trabajadores.filter(
      (usuario) => usuario.rol === Rol.TRABAJADOR
    ).length

    const totalRepresentantes = trabajadores.filter(
      (usuario) => usuario.rol === Rol.REPRESENTANTE
    ).length

    return NextResponse.json({
      empresa,
      trabajadores,
      resumen: {
        total: trabajadores.length,
        trabajadores: totalTrabajadores,
        representantes: totalRepresentantes,
      },
    })
  } catch (error) {
    console.error("[admin/empresas/trabajadores] Error:", error)
    return NextResponse.json(
      { error: "No se pudieron cargar los trabajadores de la empresa" },
      { status: 500 }
    )
  }
}
