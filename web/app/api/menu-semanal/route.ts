import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Headers CORS — permiten que la app móvil (puerto 5173) llame a esta API (puerto 3000)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Responde al preflight OPTIONS que el browser envía antes del GET
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    console.log('[menu-semanal] GET request received');

    const menus = await prisma.menuSemanal.findMany({
      include: {
        detalles: {
          include: { plato: true },
        },
      },
      orderBy: { fecha_inicio: 'desc' },
    });

    console.log(`[menu-semanal] Menús encontrados: ${menus.length}`);

    if (menus.length === 0) {
      console.warn('[menu-semanal] No hay menús en la base de datos');
      return NextResponse.json(null, { status: 404, headers: corsHeaders });
    }

    const hoyStr = new Date().toISOString().split('T')[0];
    console.log(`[menu-semanal] Fecha hoy (UTC): ${hoyStr}`);

    const menuActivo = menus.find((m) => {
      const inicio = m.fecha_inicio.toISOString().split('T')[0];
      const fin    = m.fecha_fin.toISOString().split('T')[0];
      return inicio <= hoyStr && hoyStr <= fin;
    });

    const resultado = menuActivo ?? menus[0];
    console.log(`[menu-semanal] Retornando id=${resultado.id}, detalles=${resultado.detalles.length}`);

    return NextResponse.json(resultado, { headers: corsHeaders });
  } catch (error) {
    console.error('[menu-semanal] Error:', error);
    return NextResponse.json(
      { error: 'Error al cargar base de datos' },
      { status: 500, headers: corsHeaders }
    );
  }
}