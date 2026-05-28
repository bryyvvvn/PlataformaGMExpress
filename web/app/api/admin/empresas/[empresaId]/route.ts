import { NextResponse } from "next/server"
import { Rol } from "@prisma/client"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ empresaId: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
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
        razonSocial: true,
        rut: true,
        nombreComercial: true,
        correo_contacto: true,
        telefono: true,
        direccion: true,
        comuna: true,
        region: true,
        sector: true,
        nombreFaena: true,
        direccionFaena: true,
        representanteLegal: true,
        rutRepresentanteLegal: true,
        estado: true,
        creado_en: true,
        actualizado_en: true,
        convenio: {
          select: {
            id: true,
            permitePlato: true,
            permiteEntrada: true,
            permitePostre: true,
            permitePan: true,
            permiteJugo: true,
            permiteBebida: true,
            permiteAguaSaborizada: true,
          },
        },
        contactos: {
          orderBy: [{ activo: "desc" }, { tipo: "asc" }, { id: "asc" }],
          select: {
            id: true,
            tipo: true,
            nombresApellidos: true,
            rut: true,
            rolCargo: true,
            telefono: true,
            email: true,
            fechaNacimiento: true,
            activo: true,
          },
        },
      },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const [trabajadores, representantes, pedidos] = await Promise.all([
      db.usuario.count({
        where: {
          empresaId,
          rol: Rol.TRABAJADOR,
        },
      }),
      db.usuario.count({
        where: {
          empresaId,
          rol: Rol.REPRESENTANTE,
        },
      }),
      db.pedido.count({
        where: { empresaId },
      }),
    ])

    return NextResponse.json({
      empresa: {
        ...empresa,
        metricas: {
          trabajadores,
          representantes,
          pedidos,
        },
      },
    })
  } catch (error) {
    console.error("[admin/empresas/detalle] Error:", error)
    return NextResponse.json(
      { error: "No se pudo obtener el detalle de la empresa" },
      { status: 500 }
    )
  }
}
