import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; // Tu ruta a Prisma

export async function POST(request: Request) {
  try {
    const { usuarioId, fcmToken } = await request.json();

    if (!usuarioId || !fcmToken) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Guardamos el token en el perfil del usuario
    await db.usuario.update({
      where: { id: usuarioId },
      data: { fcmToken: fcmToken },
    });

    return NextResponse.json({ success: true, mensaje: 'Token guardado correctamente' });
  } catch (error) {
    console.error('Error guardando FCM Token:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}