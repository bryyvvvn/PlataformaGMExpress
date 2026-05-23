import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { empresaId, fecha } = body;

    if (!empresaId) {
      return NextResponse.json({ error: 'Falta empresaId' }, { status: 400 });
    }

    // Calculamos el rango de la semana seleccionada (blindado contra zonas horarias)
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

    // 🔥 LA MAGIA: Actualizamos masivamente los pedidos
    const actualizados = await db.pedido.updateMany({
      where: {
        empresaId: parseInt(empresaId, 10),
        estado: 'PENDIENTE',
        fecha: {
          gte: inicioSemana,
          lte: finSemana
        }
      },
      data: {
        estado: 'CONFIRMADO'
      }
    });

    return NextResponse.json({ 
      success: true, 
      pedidosConfirmados: actualizados.count 
    });
    
  } catch (error) {
    console.error('[API ENVIAR PLANILLA] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}