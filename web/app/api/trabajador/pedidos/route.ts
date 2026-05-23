import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuarioId');

  if (!usuarioId) {
    return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });
  }

  if (searchParams.get('historial') === 'true') {
    try {
      const pedidos = await db.pedido.findMany({
        where: { usuarioId },
        orderBy: { fecha: 'desc' },
        include: {
          detalles: {
            include: { plato: true, guarnicion: true }
          }
        }
      });

      return NextResponse.json(pedidos);
    } catch (error) {
      console.error('[API PEDIDOS] Error al obtener historial:', error);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  }

  try {
    const fechaParam = searchParams.get('fecha');
    const inicioDia = chileStartOfDay(fechaParam ?? undefined);
    const finDia = chileEndOfDay(fechaParam ?? undefined);

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
          include: { plato: true, guarnicion: true }
        }
      }
    });

    if (!pedidoExistente) {
      return NextResponse.json({ existe: false });
    }

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
    console.error('[API PEDIDOS] Error al verificar pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuarioId, entradaId, fondoId, postreId, guarnicionId, fecha } = body as {
      usuarioId?: string;
      entradaId?: number;
      fondoId?: number;
      postreId?: number;
      guarnicionId?: number | null;
      fecha?: string | null;
    };

    if (!usuarioId || !entradaId || !fondoId || !postreId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Obtener usuario y su empresaId
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, empresaId: true },
    });

    if (!usuario || !usuario.empresaId) {
      return NextResponse.json({ error: 'Usuario no válido o sin empresa' }, { status: 400 });
    }

    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget = chileEndOfDay(targetIso);

    const pedidoExistente = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: {
          gte: inicioDiaTarget,
          lte: finDiaTarget,
        },
      },
    });

    if (pedidoExistente) {
      await db.$transaction(async (tx) => {
        await tx.detallePedido.deleteMany({ where: { pedidoId: pedidoExistente.id } });
        await tx.detallePedido.createMany({
          data: [
            { pedidoId: pedidoExistente.id, platoId: entradaId },
            { pedidoId: pedidoExistente.id, platoId: fondoId, guarnicionId: guarnicionId ?? null },
            { pedidoId: pedidoExistente.id, platoId: postreId },
          ],
        });
      });

      return NextResponse.json({ mensaje: 'Pedido actualizado', pedidoId: pedidoExistente.id });
    }

    const nuevoPedido = await db.pedido.create({
      data: {
        fecha: inicioDiaTarget,
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        estado: 'PENDIENTE',
        detalles: {
          create: [
            { platoId: entradaId },
            { platoId: fondoId, guarnicionId: guarnicionId ?? null },
            { platoId: postreId },
          ],
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ mensaje: 'Creado exitosamente', pedidoId: nuevoPedido.id }, { status: 201 });
  } catch (error) {
    console.error('[API PEDIDOS] Error al crear/actualizar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');
    const fecha = searchParams.get('fecha');

    if (!usuarioId) {
      return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });
    }

    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget = chileEndOfDay(targetIso);

    const pedidoParaEliminar = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: {
          gte: inicioDiaTarget,
          lte: finDiaTarget,
        },
      },
    });

    if (!pedidoParaEliminar) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.detallePedido.deleteMany({ where: { pedidoId: pedidoParaEliminar.id } });
      await tx.pedido.delete({ where: { id: pedidoParaEliminar.id } });
    });

    return NextResponse.json({ mensaje: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('[API PEDIDOS] Error al eliminar pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
