import { auth, verifyToken } from '@clerk/nextjs/server'
import { Rol } from '@prisma/client'
import db from '@/lib/db'

type VerificacionRepresentante =
  | { userId: string; empresaId: number }
  | { error: string; status: 401 | 403 }

export async function verificarRepresentante(request: Request): Promise<VerificacionRepresentante> {
  const { userId: cookieUserId } = await auth()

  let userId: string | null = cookieUserId

  if (!userId) {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'No autorizado', status: 401 }
    }

    const token = authHeader.slice(7)

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })
      userId = payload.sub
    } catch {
      return { error: 'Token inválido o expirado', status: 401 }
    }
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
