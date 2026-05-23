import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaIdStr = searchParams.get('empresaId');

    if (!empresaIdStr) {
      return NextResponse.json({ error: 'Falta el ID de la empresa' }, { status: 400 });
    }

    const empresaId = parseInt(empresaIdStr, 10);
    if (isNaN(empresaId)) {
      return NextResponse.json({ error: 'ID de empresa inválido' }, { status: 400 });
    }

    // Trae solo ID y Nombre de forma rápida, ordenados alfabéticamente
    const trabajadores = await db.usuario.findMany({
      where: {
        empresaId: empresaId,
        rol: 'TRABAJADOR',
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(trabajadores);
    
  } catch (error) {
    console.error('[API USUARIOS TRABAJADORES] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}