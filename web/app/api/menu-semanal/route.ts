import { NextResponse } from 'next/server';
import db from '../../../lib/db'; 

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Cambiamos 'prisma' por 'db'
    const menuActivo = await db.menuSemanal.findFirst({
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
      // Ya no necesitamos inyectar los headers aquí
      return NextResponse.json({ entradas: [], fondos: [], postres: [] });
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

    // Devolvemos el menú formateado limpio
    return NextResponse.json(menuFormateado);

  } catch (error) {
    console.error("Error obteniendo el menú:", error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}