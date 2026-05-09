import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuarioId');

  if (!usuarioId) return NextResponse.json({ existe: false });

  // Buscamos un pedido de este usuario creado HOY
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pedidoHoy = await db.pedido.findFirst({
    where: {
      usuarioId: usuarioId,
      fecha: {
        gte: hoy, // Mayor o igual al inicio de hoy
      },
    },
  });

  return NextResponse.json({ existe: !!pedidoHoy });
}