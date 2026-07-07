import { NextResponse } from 'next/server';
import { verificarRepresentante } from '@/lib/representante/verificar-representante';
import { obtenerEmpleadosRepresentante } from '@/lib/representante/trabajadores-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');
  const secret = searchParams.get('secret');
  const forceRefresh = searchParams.get('refresh') === '1';

  let empresaId: number;

  if (secret === process.env.CRON_SECRET) {
    const empIdStr = searchParams.get('empresaId');
    if (!empIdStr) return NextResponse.json({ error: 'Falta empresaId para el cron' }, { status: 400 });

    empresaId = parseInt(empIdStr, 10);
    if (!Number.isFinite(empresaId)) {
      return NextResponse.json({ error: 'empresaId invalido' }, { status: 400 });
    }
  } else {
    const rep = await verificarRepresentante(request);
    if ('error' in rep) {
      return NextResponse.json({ error: rep.error }, { status: rep.status });
    }
    empresaId = rep.empresaId;
  }

  try {
    const resultado = await obtenerEmpleadosRepresentante({
      empresaId,
      fecha,
      forceRefresh,
    });

    return NextResponse.json(resultado.data, {
      headers: {
        'X-Empleados-Cache': resultado.cacheStatus,
        'X-Empleados-Cache-Key': resultado.cacheKey,
      },
    });
  } catch (error) {
    console.error('[API REPRESENTANTE EMPLEADOS] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
