import { NextResponse } from 'next/server';
import db from '../../../lib/db'; 

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const menuActivo = await db.menuSemanal.findFirst({
      orderBy: { creado_en: 'desc' },
      include: {
        detalles: {
          // OJO: Aquí dice 'Lunes' fijo. Más adelante deberás cambiar esto 
          // para que lea el día actual usando new Date() formateado.
          where: { dia_semana: 'Lunes' }, 
          include: {
            plato: true,
            guarniciones: true, // 🔥 AQUÍ ESTÁ LA MAGIA: Traemos las opciones de la tabla intermedia
          },
        },
      },
    });

    if (!menuActivo) {
      return NextResponse.json({ entradas: [], fondos: [], postres: [] });
    }

    // Ahora al mapear, le "pegamos" el arreglo de guarniciones al objeto del plato
    // para que el frontend lo pueda leer fácilmente.
    const menuFormateado = {
      entradas: menuActivo.detalles
        .filter(d => d.plato.categoria === 'ENTRADA')
        .map(d => ({ ...d.plato, guarniciones: d.guarniciones })),
        
      fondos: menuActivo.detalles
        .filter(d => d.plato.categoria === 'FONDO')
        .map(d => ({ ...d.plato, guarniciones: d.guarniciones })),
        
      postres: menuActivo.detalles
        .filter(d => d.plato.categoria === 'POSTRE')
        .map(d => ({ ...d.plato, guarniciones: d.guarniciones })),
    };

    return NextResponse.json(menuFormateado);

  } catch (error) {
    console.error("Error obteniendo el menú:", error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}