import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const empresaIdStr = searchParams.get('empresaId');

  if (!empresaIdStr) {
    return NextResponse.json({ error: 'Falta el empresaId' }, { status: 400 });
  }

  const empresaId = parseInt(empresaIdStr, 10);
  if (isNaN(empresaId)) {
    return NextResponse.json({ error: 'empresaId inválido' }, { status: 400 });
  }

  try {
    const totalTrabajadores = await db.usuario.count({
      where: { empresaId, rol: 'TRABAJADOR' }
    });

    const pedidosListosHoy = await db.pedido.count({
      where: { empresaId }
    });

    return NextResponse.json({
      totalTrabajadores,
      pedidosListos: pedidosListosHoy,
      enviadoAGM: false
    });
  } catch (error) {
    console.error('[API REPRESENTANTE RESUMEN] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
