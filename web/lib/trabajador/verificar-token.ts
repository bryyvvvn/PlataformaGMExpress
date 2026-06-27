import { verifyToken } from '@clerk/nextjs/server'

type VerificacionResult =
  | { userId: string }
  | { error: string; status: 401 | 403 }

/**
 * Verifica que:
 * 1. El header Authorization contiene un Bearer token válido de Clerk
 * 2. El sub del token (userId de Clerk) coincide con el usuarioId
 *    recibido como parámetro
 *
 * Esto previene BOLA: un trabajador no puede operar con el
 * usuarioId de otro trabajador.
 */
export async function verificarTokenTrabajador(
  request: Request,
  usuarioId: string
): Promise<VerificacionResult> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Token de autorización requerido', status: 401 }
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    if (payload.sub !== usuarioId) {
      return { error: 'No autorizado para este usuario', status: 403 }
    }

    return { userId: payload.sub }
  } catch {
    return { error: 'Token inválido o expirado', status: 401 }
  }
}
