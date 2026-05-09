import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuarioId');

  if (!usuarioId) {
    return NextResponse.json([], { status: 400 });
  }

  try {
    const pedidos = await db.pedido.findMany({
      where: { usuarioId },
      orderBy: { fecha: 'desc' },
      include: {
        detalles: {
          include: { plato: true }
        }
      }
    });
    
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error("Error historial:", error);
    return NextResponse.json({ error: "Error al traer historial" }, { status: 500 });
  }
}