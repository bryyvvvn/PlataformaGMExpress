import { NextResponse } from 'next/server';
import { verifyToken } from '@clerk/nextjs/server';
import db from '../../../../lib/db'; // Tu ruta a Prisma
import { guardarTokenSchema } from '@/lib/schemas/usuarios';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Token de autorización requerido' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  let tokenUserId: string;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    tokenUserId = payload.sub;
  } catch {
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const result = guardarTokenSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  // Verificar que el usuarioId del body coincide con el token
  if (result.data.usuarioId !== tokenUserId) {
    return NextResponse.json(
      { error: 'No autorizado para modificar este usuario' },
      { status: 403 }
    );
  }

  try {
    // Guardamos el token en el perfil del usuario
    await db.usuario.update({
      where: { id: result.data.usuarioId },
      data: { fcmToken: result.data.fcmToken },
    });

    return NextResponse.json({ success: true, mensaje: 'Token guardado correctamente' });
  } catch (error) {
    console.error('Error guardando FCM Token:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
