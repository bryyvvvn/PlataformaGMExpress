import { NextResponse }    from 'next/server';
import db                  from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pedidos/verificar-pedido?usuarioId=xxx&fecha=YYYY-MM-DD
 *
 * Verifica si el usuario ya realizó un pedido en la fecha dada (o hoy si no se pasa fecha).
 * Los límites del día se calculan en zona horaria Chile para evitar el bug UTC.
 *
 * Retorna: { existe: boolean }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuarioId  = searchParams.get('usuarioId');
  const fechaParam = searchParams.get('fecha'); // 'YYYY-MM-DD', opcional

  if (!usuarioId) {
    return NextResponse.json({ existe: false });
  }

  try {
    // Límites del día en zona horaria Chile
    // Sin fechaParam → usa el día actual en Chile (no en UTC del servidor)
    const inicioDia = chileStartOfDay(fechaParam ?? undefined);
    const finDia    = chileEndOfDay(fechaParam   ?? undefined);

    const pedidoExistente = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      select: { id: true }, // solo necesitamos saber si existe
    });

    return NextResponse.json({ existe: !!pedidoExistente });

  } catch (error) {
    console.error('[verificar-pedido] Error:', error);
    return NextResponse.json(
      { existe: false, error: 'Error en base de datos' },
      { status: 500 }
    );
  }
}