import { verifyToken } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import db from '../../../../lib/db';
import { guardarRutSchema } from '@/lib/schemas/usuarios';
import { normalizarTelefonoChileno } from '@/lib/usuarios/telefono';

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

  if (result.data.clerkId !== tokenUserId) {
    return NextResponse.json(
      { error: 'No autorizado para modificar este usuario' },
      { status: 403 }
    );
  }

  try {
    const datosActualizados: { rut: string; telefono?: string | null } = {
      rut: result.data.rut,
    };

    if (Object.prototype.hasOwnProperty.call(result.data, 'telefono')) {
      try {
        datosActualizados.telefono = normalizarTelefonoChileno(
          result.data.telefono
        );
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'El teléfono debe tener un formato válido.',
          },
          { status: 400 }
        );
      }
    }

    const usuarioActualizado = await db.usuario.update({
      where: { id: result.data.clerkId },
      data: datosActualizados,
    });

    return NextResponse.json({ success: true, usuario: usuarioActualizado });
  } catch (error) {
    console.error('[API GUARDAR DATOS] Error:', error);

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

    return NextResponse.json(
      { error: 'Error interno guardando los datos' },
      { status: 500 }
    );
  }
}
