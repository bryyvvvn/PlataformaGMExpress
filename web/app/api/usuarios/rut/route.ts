import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function PATCH(request: Request) {
  try {
    const { clerkId, rut } = await request.json();

    if (!clerkId || !rut) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const usuarioActualizado = await db.usuario.update({
      where: { id: clerkId },
      data: { rut: rut }
    });

    return NextResponse.json({ success: true, usuario: usuarioActualizado });
  } catch (error: any) {
    console.error('[API GUARDAR RUT] Error:', error);
    
    // 🔥 MAGIA AQUÍ: Si el error es por RUT duplicado, avisamos al frontend
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Este RUT ya se encuentra registrado en otra cuenta.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Error interno guardando el RUT' }, { status: 500 });
  }
}