import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { planillaSchema } from '@/lib/schemas/representante';
import { verificarRepresentante } from '@/lib/representante/verificar-representante';

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
  const rep = await verificarRepresentante(request);
  if ('error' in rep) {
    return NextResponse.json({ error: rep.error }, { status: rep.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const result = planillaSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { fecha } = result.data;
  const empresaIdSeguro = rep.empresaId; // ignorar body.empresaId

  try {
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
    const convenio = await obtenerConvenioEmpresa(empresaIdSeguro);
    finSemana.setDate(inicioSemana.getDate() + (convenio.trabajaFinDeSemana ? 6 : 4));
    finSemana.setHours(23, 59, 59, 999);

    const actualizados = await db.pedido.updateMany({
      where: {
        empresaId: empresaIdSeguro,
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
