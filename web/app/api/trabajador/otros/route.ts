import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/trabajador/otros
 * Devuelve los platos que pertenecen a categorías "otros" (CANJE, SANDWICH, BEBIDA, SNACK, JUGO, AGUA_SABORIZADA)
 */
export async function GET() {
  try {
    const platos = await db.plato.findMany({
      where: { categoria: { in: ['CANJE', 'SANDWICH', 'BEBIDA', 'SNACK', 'JUGO', 'AGUA_SABORIZADA'] } },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({ platos });
  } catch (error) {
    console.error('[api/trabajador/otros] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}