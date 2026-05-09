import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuarioId');
  const fechaParam = searchParams.get('fecha'); // Importante para ver otros días

  if (!usuarioId) return NextResponse.json({ existe: false });

  // Si pasas una fecha (ej: la del lunes), buscamos esa. Si no, la de hoy.
  const fechaABuscar = fechaParam ? new Date(fechaParam) : new Date();
  fechaABuscar.setHours(0, 0, 0, 0);

  try {
    const pedidoHoy = await db.pedido.findFirst({
      where: {
        usuarioId: usuarioId,
        fecha: {
          gte: fechaABuscar,
          lt: new Date(fechaABuscar.getTime() + 24 * 60 * 60 * 1000)
        },
      },
    });

    return NextResponse.json({ existe: !!pedidoHoy });
  } catch (error) {
    return NextResponse.json({ existe: false, error: "Error base de datos" }, { status: 500 });
  }
}