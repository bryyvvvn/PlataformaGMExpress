import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
import {
  normalizarFechaEmpleados,
  obtenerEmpleadosCacheStats,
  obtenerEmpleadosRepresentante,
} from '../../../../lib/representante/trabajadores-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get('secret');

  if (!process.env.CRON_SECRET) {
    console.error('[CRON CACHE TRABAJADORES] Falta CRON_SECRET');
    return NextResponse.json({ success: false, error: 'CRON_SECRET no esta configurado' }, { status: 500 });
  }

  if (querySecret !== process.env.CRON_SECRET) {
    console.warn('[CRON CACHE TRABAJADORES] Acceso denegado: secret invalido');
    return new NextResponse('Acceso denegado', { status: 401 });
  }

  try {
    const fechaHoy = normalizarFechaEmpleados(request.nextUrl.searchParams.get('fecha'));

    const empresas = await db.empresa.findMany({
      where: { estado: 'ACTIVA' },
      select: { id: true, nombre: true },
    });

    console.log('[CRON CACHE TRABAJADORES] Iniciando precarga', {
      fechaBase: fechaHoy,
      empresas: empresas.length,
    });

    const resultados = await Promise.allSettled(
      empresas.map(async (empresa) => {
        const resultado = await obtenerEmpleadosRepresentante({
          empresaId: empresa.id,
          fecha: fechaHoy,
          forceRefresh: true,
        });

        return {
          empresaId: empresa.id,
          nombre: empresa.nombre,
          cache: resultado.cacheStatus,
          trabajadores: resultado.data.length,
        };
      })
    );

    const exitosos = resultados
      .filter((resultado) => resultado.status === 'fulfilled')
      .map((resultado) => resultado.value);

    const fallidos = resultados
      .map((resultado, index) => ({ resultado, empresa: empresas[index] }))
      .filter((item) => item.resultado.status === 'rejected')
      .map(({ resultado, empresa }) => ({
        empresaId: empresa.id,
        nombre: empresa.nombre,
        error: resultado.status === 'rejected' ? resultado.reason?.message ?? 'Error desconocido' : null,
      }));

    if (fallidos.length > 0) {
      console.error('[CRON CACHE TRABAJADORES] Fallaron algunas empresas', { fallidos });
      return NextResponse.json(
        {
          success: false,
          mensaje: 'Se ejecuto el cron, pero fallo la precarga para algunas empresas.',
          exitosos,
          fallidos,
          cache: obtenerEmpleadosCacheStats(),
        },
        { status: 500 }
      );
    }

    console.log('[CRON CACHE TRABAJADORES] Primera carga completada con exito', {
      fechaBase: fechaHoy,
      empresasActualizadas: exitosos.length,
      cache: obtenerEmpleadosCacheStats(),
    });

    return NextResponse.json({
      success: true,
      mensaje: 'Cache de trabajadores precargada correctamente para todas las empresas activas.',
      fechaUsada: fechaHoy,
      empresasActualizadas: exitosos.length,
      cache: obtenerEmpleadosCacheStats(),
    });
  } catch (error) {
    console.error('[CRON CACHE TRABAJADORES] Error critico:', error);
    return NextResponse.json({ success: false, error: 'Error interno del cron' }, { status: 500 });
  }
}
