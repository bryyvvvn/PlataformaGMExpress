import { NextResponse }  from 'next/server';
import db                from '../../../../lib/db';
import {
  isDeadlinePassed,
  chileStartOfDay,
  chileEndOfDay,
  nowChile,
} from '../../../../lib/chile-time';

export const dynamic = 'force-dynamic';

// ── CONFIGURACIÓN DE DEADLINE ─────────────────────────────────────────────────
const DEADLINE_HOUR   = parseInt(process.env.DEADLINE_HOUR   ?? '10', 10);
const DEADLINE_MINUTE = parseInt(process.env.DEADLINE_MINUTE ?? '0',  10);

// ─── ENDPOINT POST (CREAR / MODIFICAR) ───────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuarioId, entradaId, fondoId, postreId, guarnicionId, fecha } = body as {
      usuarioId:    string;
      entradaId:    number;
      fondoId:      number;
      postreId:     number;
      guarnicionId?: number | null;
      fecha?: string | null;
    };

    // 1. Validar campos obligatorios
    if (!usuarioId || !entradaId || !fondoId || !postreId) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      );
    }

    // 2. Determinar fecha objetivo
    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget    = chileEndOfDay(targetIso);

    // ── VALIDACIÓN DE HORARIO (DESACTIVADA PARA PRUEBAS) ──
    /*
    const deadlineInstant = new Date(inicioDiaTarget.getTime() + DEADLINE_HOUR * 3600_000 + DEADLINE_MINUTE * 60_000);
    if (Date.now() > deadlineInstant.getTime()) {
      return NextResponse.json({ error: 'El horario de pedidos ha cerrado' }, { status: 403 });
    }
    */
   
    // 3. Verificar usuario y empresa
    const usuario = await db.usuario.findUnique({
      where:  { id: usuarioId },
      select: { id: true, empresaId: true },
    });

    if (!usuario || !usuario.empresaId) {
      return NextResponse.json({ error: 'Usuario no válido o sin empresa' }, { status: 400 });
    }

    // 4. Verificar si existe pedido para actualizarlo
    const pedidoExistente = await db.pedido.findFirst({
      where: { usuarioId, fecha: { gte: inicioDiaTarget, lte: finDiaTarget } },
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
      console.log(`[crear-pedido] 🔄 Actualizado: ${pedidoExistente.id}`);
      return NextResponse.json({ mensaje: 'Pedido actualizado', pedidoId: pedidoExistente.id });
    }

    // 5. Crear nuevo pedido
    const nuevoPedido = await db.pedido.create({
      data: {
        fecha: inicioDiaTarget,
        usuarioId:  usuario.id,
        empresaId:  usuario.empresaId,
        estado:     'PENDIENTE',
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

  } catch (error: any) {
    console.error('[crear-pedido] Error POST:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─── ENDPOINT DELETE (ELIMINAR) ──────────────────────────────────────────────

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
    const finDiaTarget    = chileEndOfDay(targetIso);

    // Buscar el pedido antes de borrar
    const pedidoParaEliminar = await db.pedido.findFirst({
      where: { 
        usuarioId, 
        fecha: { gte: inicioDiaTarget, lte: finDiaTarget } 
      },
    });

    if (!pedidoParaEliminar) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Borrado en cascada manual (Detalles -> Pedido)
    await db.$transaction(async (tx) => {
      await tx.detallePedido.deleteMany({
        where: { pedidoId: pedidoParaEliminar.id }
      });
      await tx.pedido.delete({
        where: { id: pedidoParaEliminar.id }
      });
    });

    console.log(`[crear-pedido] 🗑️ Eliminado: ${pedidoParaEliminar.id}`);
    return NextResponse.json({ mensaje: 'Pedido eliminado correctamente' });

  } catch (error: any) {
    console.error('[crear-pedido] Error DELETE:', error);
    return NextResponse.json({ error: 'Error al eliminar pedido' }, { status: 500 });
  }
}