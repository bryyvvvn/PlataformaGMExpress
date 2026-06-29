import { NextResponse } from 'next/server';
import { verifyToken } from '@clerk/nextjs/server';
import db from '../../../../lib/db';
import { guardarRutSchema } from '@/lib/schemas/usuarios';

export async function PATCH(request: Request) {
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

  const result = guardarRutSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  // Verificar que el clerkId del body coincide con el token
  if (result.data.clerkId !== tokenUserId) {
    return NextResponse.json(
      { error: 'No autorizado para modificar este usuario' },
      { status: 403 }
    );
  }

  try {
    const usuarioActualizado = await db.usuario.update({
      where: { id: result.data.clerkId },
      // 🔥 AQUÍ LE DECIMOS A PRISMA QUE TAMBIÉN GUARDE EL TELÉFONO
      data: { 
        rut: result.data.rut,
        telefono: result.data.telefono 
      },
    });

    return NextResponse.json({ success: true, usuario: usuarioActualizado });
  } catch (error) {
    console.error('[API GUARDAR DATOS] Error:', error);

    // Si el error es por RUT duplicado, avisamos al frontend
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Este RUT ya se encuentra registrado en otra cuenta.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Error interno guardando los datos' }, { status: 500 });
  }
}