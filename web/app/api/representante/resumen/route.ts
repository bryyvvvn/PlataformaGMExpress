import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { verificarRepresentante } from '@/lib/representante/verificar-representante';

export async function GET(request: Request) {
  const rep = await verificarRepresentante(request);
  if ('error' in rep) {
    return NextResponse.json({ error: rep.error }, { status: rep.status });
  }

  const empresaId = rep.empresaId;

  try {
    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        ConvenioEmpresa: {
          select: { permiteCena: true },
        },
      },
    });
    const permiteCena = Boolean(empresa?.ConvenioEmpresa?.permiteCena);

    const totalTrabajadores = await db.usuario.count({
      where: { empresaId, rol: 'TRABAJADOR' }
    });

    const pedidosListosHoy = await db.pedido.count({
      where: {
        empresaId,
        ...(permiteCena ? {} : { esCena: false }),
      }
    });

    return NextResponse.json({
      totalTrabajadores,
      pedidosListos: pedidosListosHoy,
      enviadoAGM: false,
      permiteCena
    });
  } catch (error) {
    console.error('[API REPRESENTANTE RESUMEN] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
