import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { empresaId, fecha } = body as { empresaId?: string | number; fecha?: string | null };

    if (!empresaId) {
      return NextResponse.json({ error: 'Falta empresaId' }, { status: 400 });
    }

    let fechaBase = new Date();
    if (fecha) {
      const safeDate = fecha.includes('T') ? fecha : `${fecha}T12:00:00`;
      fechaBase = new Date(safeDate);
    }

    const diaSemana = fechaBase.getDay() || 7;
    const inicioSemana = new Date(fechaBase);
    inicioSemana.setDate(fechaBase.getDate() - diaSemana + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const actualizados = await db.pedido.updateMany({
      where: {
        empresaId: typeof empresaId === 'string' ? parseInt(empresaId, 10) : empresaId,
        estado: 'PENDIENTE',
        fecha: {
          gte: inicioSemana,
          lte: finSemana,
        },
      },
      data: {
        estado: 'CONFIRMADO',
      },
    });

    return NextResponse.json({ success: true, pedidosConfirmados: actualizados.count });
  } catch (error) {
    console.error('[API REPRESENTANTE PLANILLA] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
