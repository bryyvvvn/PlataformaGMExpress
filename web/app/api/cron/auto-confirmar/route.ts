import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { getHoraLimiteEfectiva } from '../../../../lib/horario-pedidos';

export const dynamic = 'force-dynamic';

const VENTANA_MIN_MINUTOS = 5;
const VENTANA_MAX_MINUTOS = 10;

export async function GET(request: NextRequest) {
  // 1. SEGURIDAD: Acepta Header O Parámetro en la URL
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && querySecret !== process.env.CRON_SECRET) {
    return new NextResponse('Acceso denegado', { status: 401 });
  }

  try {
    // 2. HORA ACTUAL EN CHILE, en minutos desde medianoche
    const ahora = new Date();
    const formatter = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [horaStr, minutoStr] = formatter.format(ahora).split(':');
    const minutosAhora = parseInt(horaStr) * 60 + parseInt(minutoStr);

    console.log(`[CRON CONFIRMAR-PLANILLA] Ejecutando a las ${horaStr}:${minutoStr} (Chile)`);

    // 3. CONFIGURACIÓN GLOBAL (hora límite por defecto si la empresa no tiene horaDespacho)
    const configuracion = await db.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { horaLimite: true },
    });
    const horaGlobal = configuracion?.horaLimite ?? '17:00';

    // 4. TRAER TODAS LAS EMPRESAS ACTIVAS CON SU horaDespacho Y CONVENIO
    const empresas = await db.empresa.findMany({
      where: { estado: 'ACTIVA' },
      select: {
        id: true,
        nombre: true,
        horaDespacho: true,
        ConvenioEmpresa: {
          select: { permiteCena: true },
        },
      },
    });

    // 5. FILTRAR EMPRESAS CUYA HORA LÍMITE EFECTIVA CAE EN LA VENTANA [5, 10] MIN
    const empresasEnVentana = empresas.filter((empresa) => {
      const { horaLimite } = getHoraLimiteEfectiva(empresa.horaDespacho, horaGlobal);
      const [hLimite, mLimite] = horaLimite.split(':').map(Number);
      const minutosLimite = hLimite * 60 + mLimite;

      const minutosRestantes = minutosLimite - minutosAhora;

      return minutosRestantes >= VENTANA_MIN_MINUTOS && minutosRestantes <= VENTANA_MAX_MINUTOS;
    });

    if (empresasEnVentana.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: 'Ninguna empresa está dentro de la ventana de cierre (5-10 min) en este momento.',
      });
    }

    console.log(
      `[CRON CONFIRMAR-PLANILLA] Empresas en ventana de cierre:`,
      empresasEnVentana.map((e) => e.nombre)
    );

    // 6. CONFIRMAR PEDIDOS PENDIENTES PARA CADA EMPRESA EN VENTANA
    const resultados: { empresa: string; confirmados: number }[] = [];

    for (const empresa of empresasEnVentana) {
      const permiteCena = Boolean(empresa.ConvenioEmpresa?.permiteCena);

      const actualizados = await db.pedido.updateMany({
        where: {
          empresaId: empresa.id,
          estado: 'PENDIENTE',
          ...(permiteCena ? {} : { esCena: false }),
        },
        data: { estado: 'CONFIRMADO' },
      });

      if (actualizados.count > 0) {
        resultados.push({ empresa: empresa.nombre, confirmados: actualizados.count });
        console.log(
          `[CRON CONFIRMAR-PLANILLA] ${empresa.nombre}: ${actualizados.count} pedidos confirmados automáticamente.`
        );
      }
    }

    return NextResponse.json({
      success: true,
      empresasEvaluadas: empresasEnVentana.length,
      resultados,
    });
  } catch (error) {
    console.error('[CRON CONFIRMAR-PLANILLA] Error crítico:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}