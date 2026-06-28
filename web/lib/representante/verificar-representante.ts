import { auth } from '@clerk/nextjs/server'
import { Rol } from '@prisma/client'
import db from '@/lib/db'

type VerificacionRepresentante =
  | { userId: string; empresaId: number }
  | { error: string; status: 401 | 403 }

export async function verificarRepresentante(): Promise<VerificacionRepresentante> {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'No autorizado', status: 401 }
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true, empresaId: true },
  })

  if (!usuario || usuario.rol !== Rol.REPRESENTANTE) {
    return { error: 'Acceso denegado', status: 403 }
  }

  if (!usuario.empresaId) {
    return { error: 'Sin empresa asignada', status: 403 }
  }

  return { userId, empresaId: usuario.empresaId }
}
