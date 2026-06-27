import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

async function obtenerConvenioEmpresa(empresaId: number) {
  const empresa = await db.empresa.findUnique({
    where: { id: empresaId },
    select: {
      ConvenioEmpresa: {
        select: { trabajaFinDeSemana: true, permiteCena: true },
      },
    },
  });

  return {
    trabajaFinDeSemana: Boolean(empresa?.ConvenioEmpresa?.trabajaFinDeSemana),
    permiteCena: Boolean(empresa?.ConvenioEmpresa?.permiteCena),
  };
}

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
    const empresaIdNumber = typeof empresaId === 'string' ? parseInt(empresaId, 10) : empresaId;
    const convenio = await obtenerConvenioEmpresa(empresaIdNumber);
    finSemana.setDate(inicioSemana.getDate() + (convenio.trabajaFinDeSemana ? 6 : 4));
    finSemana.setHours(23, 59, 59, 999);

    const actualizados = await db.pedido.updateMany({
      where: {
        empresaId: empresaIdNumber,
        estado: 'PENDIENTE',
        ...(convenio.permiteCena ? {} : { esCena: false }),
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
