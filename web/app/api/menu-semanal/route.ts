import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
  try {
    const menuActivo = await prisma.menuSemanal.findFirst({
      orderBy: { creado_en: 'desc' },
      include: {
        detalles: {
          where: { dia_semana: 'Lunes' },
          include: {
            plato: true,
          },
        },
      },
    });

    if (!menuActivo) {
      return NextResponse.json(
        { entradas: [], fondos: [], postres: [] },
        { headers: corsHeaders }
      );
    }

    const menuFormateado = {
      entradas: menuActivo.detalles
        .filter(d => d.plato.categoria === 'ENTRADA')
        .map(d => d.plato),
      fondos: menuActivo.detalles
        .filter(d => d.plato.categoria === 'FONDO')
        .map(d => d.plato),
      postres: menuActivo.detalles
        .filter(d => d.plato.categoria === 'POSTRE')
        .map(d => d.plato),
    };

    // Devolvemos el menú formateado con las cabeceras CORS
    return NextResponse.json(menuFormateado, { headers: corsHeaders });

  } catch (error) {
    console.error("Error obteniendo el menú:", error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}