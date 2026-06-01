import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; // Ajusta la ruta a tu lib/db

export async function POST(req: Request) {
  try {
    const { usuarioId, empresaId } = await req.json();

    if (!usuarioId || !empresaId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Actualizamos el usuario para asignarle la empresa
    await db.usuario.update({
      where: { id: usuarioId },
      data: { empresaId: Number(empresaId) }
    });

    return NextResponse.json({ success: true, message: 'Trabajador vinculado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error('Error vinculando trabajador:', error);
    return NextResponse.json({ error: 'Error al vincular trabajador' }, { status: 500 });
  }
}