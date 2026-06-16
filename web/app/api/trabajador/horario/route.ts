import { NextRequest, NextResponse } from 'next/server'
import { Rol } from '@prisma/client'
import db from '@/lib/db'
import { getHorarioEmpresa } from '@/lib/horario-pedidos-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuarioId')

  if (!usuarioId) {
    return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 })
  }

  try {
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: true, empresaId: true },
    })

    if (!usuario || usuario.rol !== Rol.TRABAJADOR || !usuario.empresaId) {
      return NextResponse.json(
        { permitido: true, fechaBloqueada: null },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const estado = await getHorarioEmpresa(usuario.empresaId)

    return NextResponse.json(estado, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[API HORARIO] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
