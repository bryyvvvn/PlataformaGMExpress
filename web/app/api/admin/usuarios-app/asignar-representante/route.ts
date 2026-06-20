import { EstadoEmpresa, Rol } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"
import { obtenerNombreVisible } from "@/lib/usuarios/formatos"
import { validarAsignarRepresentantePayload } from "@/lib/usuarios/validaciones"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 })
    }

    const payload = validarAsignarRepresentantePayload(body)

    if ("error" in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const [usuario, empresa] = await Promise.all([
      db.usuario.findUnique({
        where: { id: payload.data.usuarioId },
        select: {
          id: true,
          rol: true,
        },
      }),
      db.empresa.findUnique({
        where: { id: payload.data.empresaId },
        select: {
          id: true,
          nombre: true,
          estado: true,
        },
      }),
    ])

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

    const usuarioActualizado = await db.usuario.update({
      where: { id: usuario.id },
      data: {
        rol: Rol.REPRESENTANTE,
        empresaId: empresa.id,
      },
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
      usuario: {
        id: usuarioActualizado.id,
        nombre: obtenerNombreVisible(usuarioActualizado),
        nombreUsuario: usuarioActualizado.nombreUsuario,
        rut: usuarioActualizado.rut,
        correo: usuarioActualizado.correo,
        rol: usuarioActualizado.rol,
        empresaId: usuarioActualizado.empresaId,
        empresa: usuarioActualizado.empresa,
        perfil: usuarioActualizado.rol,
        estado:
          usuarioActualizado.empresaId === null ? "SIN_EMPRESA" : "ASOCIADO",
      },
    })
  } catch (error) {
    console.error("[admin/usuarios-app/asignar-representante] Error:", error)
    return NextResponse.json(
      { error: "No se pudo asignar el representante" },
      { status: 500 }
    )
  }
}
