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
      include: {
        detalles: {
          include: { plato: true, guarnicion: true },
        },
      },
    });
  
    if (!pedidoExistente) return NextResponse.json({ existe: false });

    const resumen = pedidoExistente.detalles.map(d => ({
      platoId: d.platoId,
      nombre: d.plato.nombre,
      categoria: d.plato.categoria,
      guarnicionId: d.guarnicionId ?? null,
      guarnicionNombre: d.guarnicion?.nombre ?? null,
    }));

    return NextResponse.json({
      existe: true,
      pedido: {
        id: pedidoExistente.id,
        fecha: pedidoExistente.fecha.toISOString(),
        resumen,
      },
    });

  } catch (error) {
    console.error('[verificar-pedido] Error:', error);
    return NextResponse.json(
      { existe: false, error: 'Error en base de datos' },
      { status: 500 }
    );
  }
}