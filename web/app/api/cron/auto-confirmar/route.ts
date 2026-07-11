import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { getHoraLimiteEfectiva } from '../../../../lib/horario-pedidos';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export const dynamic = 'force-dynamic';

const VENTANA_MIN_MINUTOS = 1;
const VENTANA_MAX_MINUTOS = 15;

/*
 * Endpoint para ejecución de Cron
 * Valida credenciales, calcula ventana de tiempo por empresa
 * y confirma los pedidos pendientes de la semana actual (Lunes a Domingo).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && querySecret !== process.env.CRON_SECRET) {
    return new NextResponse('Acceso denegado', { status: 401 });
  }
// pelao puro wn
  try {
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

    /*
     * Calcular inicio (Lunes) y fin (Domingo) de la semana en curso en Chile
     */
    const hoyChile = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    const diaSemana = hoyChile.getDay() || 7; 
    
    const lunes = new Date(hoyChile);
    lunes.setDate(hoyChile.getDate() - diaSemana + 1);
    
    const domingo = new Date(hoyChile);
    domingo.setDate(hoyChile.getDate() - diaSemana + 7);

    const formatIso = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const inicioSemana = chileStartOfDay(formatIso(lunes));
    const finSemana = chileEndOfDay(formatIso(domingo));

    const configuracion = await db.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { horaLimite: true },
    });
    const horaGlobal = configuracion?.horaLimite ?? '17:00';

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

    /*
     * Filtrado de empresas dentro de la ventana de cierre
     */
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
        mensaje: 'Ninguna empresa está dentro de la ventana de cierre (1-15 min) en este momento.',
      });
    }

    console.log(
      `[CRON CONFIRMAR-PLANILLA] Empresas en ventana de cierre:`,
      empresasEnVentana.map((e) => e.nombre)
    );

    const resultados: { empresa: string; confirmados: number }[] = [];

    /*
     * Confirmación masiva de pedidos por empresa
     * Limitado estrictamente al rango de la semana actual
     */
    for (const empresa of empresasEnVentana) {
      const permiteCena = Boolean(empresa.ConvenioEmpresa?.permiteCena);

      const actualizados = await db.pedido.updateMany({
        where: {
          empresaId: empresa.id,
          estado: 'PENDIENTE',
          fecha: {
            gte: inicioSemana,
            lte: finSemana,
          },
          ...(permiteCena ? {} : { esCena: false }),
        },
        data: { estado: 'CONFIRMADO' },
      });

      if (actualizados.count > 0) {
        resultados.push({ empresa: empresa.nombre, confirmados: actualizados.count });
        console.log(
          `[CRON CONFIRMAR-PLANILLA] ${empresa.nombre}: ${actualizados.count} pedidos confirmados automáticamente (Semana actual).`
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