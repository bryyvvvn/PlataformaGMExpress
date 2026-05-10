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
// Sprint actual : se lee desde .env → DEADLINE_HOUR=10 / DEADLINE_MINUTE=0
// Sprint N (Panel Admin): reemplaza estas dos líneas por una consulta a
//   ConfiguracionSistema en BD. El resto del endpoint no cambia.
const DEADLINE_HOUR   = parseInt(process.env.DEADLINE_HOUR   ?? '10', 10);
const DEADLINE_MINUTE = parseInt(process.env.DEADLINE_MINUTE ?? '0',  10);

// ─── ENDPOINT ────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuarioId, entradaId, fondoId, postreId, guarnicionId, fecha } = body as {
      usuarioId:    string;
      entradaId:    number;
      fondoId:      number;
      postreId:     number;
      guarnicionId?: number | null; // Sprint N: el usuario elige guarnición
      fecha?: string | null;
    };

    // ── 1. Validar campos obligatorios ────────────────────────────────────────
    if (!usuarioId || !entradaId || !fondoId || !postreId) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios: usuarioId, entradaId, fondoId, postreId' },
        { status: 400 }
      );
    }

    // ── 2. Determinar fecha objetivo y validar deadline en zona horaria Chile ─
    // Si el cliente envía una `fecha` explícita usamos esa; si no usamos el día actual.
    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget    = chileEndOfDay(targetIso);

    // Calcular instante límite (deadline) para la fecha objetivo: inicioDia + DEADLINE_HOUR
    const deadlineInstant = new Date(inicioDiaTarget.getTime() + DEADLINE_HOUR * 3600_000 + DEADLINE_MINUTE * 60_000);
    if (Date.now() > deadlineInstant) {
      const hh = String(DEADLINE_HOUR).padStart(2, '0');
      const mm = String(DEADLINE_MINUTE).padStart(2, '0');
      return NextResponse.json(
        {
          error:   'El horario de pedidos ha cerrado para la fecha solicitada',
          detalle: `Los pedidos para ${targetIso ?? 'hoy'} cierran a las ${hh}:${mm} hora Chile`,
        },
        { status: 403 }
      );
    }

    // ── 3. Verificar que el usuario existe y tiene empresa asignada ───────────
    const usuario = await db.usuario.findUnique({
      where:  { id: usuarioId },
      select: { id: true, empresaId: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: `Usuario ${usuarioId} no encontrado en la base de datos` },
        { status: 404 }
      );
    }

    if (!usuario.empresaId) {
      // Sprint N (Usuario Empresa): la vinculación RUT → Empresa se implementa
      // en el siguiente sprint. Por ahora bloqueamos para no crear pedidos huérfanos.
      return NextResponse.json(
        { error: 'El usuario no tiene empresa asignada. Contacta al administrador.' },
        { status: 400 }
      );
    }

    // ── 4. Verificar si existe un pedido para la fecha objetivo (si existe, actualizamos)
    const pedidoExistente = await db.pedido.findFirst({
      where: { usuarioId, fecha: { gte: inicioDiaTarget, lte: finDiaTarget } },
      include: { detalles: true },
    });

    if (pedidoExistente) {
      // Dentro del deadline permitimos actualizar el pedido: reemplazamos los detalles
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

      console.log(`[crear-pedido] 🔄 Pedido actualizado ${pedidoExistente.id} — usuario ${usuarioId}`);
      return NextResponse.json({ mensaje: 'Pedido actualizado correctamente', pedidoId: pedidoExistente.id }, { status: 200 });
    }

    // ── 5. Validar que los platos existen y tienen la categoría correcta ──────
    // Sprint N: también verificar que pertenecen al MenuDetalle del día activo.
    const [entrada, fondo, postre] = await Promise.all([
      db.plato.findUnique({ where: { id: entradaId }, select: { id: true, categoria: true } }),
      db.plato.findUnique({ where: { id: fondoId   }, select: { id: true, categoria: true } }),
      db.plato.findUnique({ where: { id: postreId  }, select: { id: true, categoria: true } }),
    ]);

    if (!entrada || entrada.categoria !== 'ENTRADA') {
      return NextResponse.json({ error: `El plato ${entradaId} no es una ENTRADA válida` }, { status: 400 });
    }
    if (!fondo || fondo.categoria !== 'FONDO') {
      return NextResponse.json({ error: `El plato ${fondoId} no es un FONDO válido` }, { status: 400 });
    }
    if (!postre || postre.categoria !== 'POSTRE') {
      return NextResponse.json({ error: `El plato ${postreId} no es un POSTRE válido` }, { status: 400 });
    }

    // ── 6. Crear pedido + detalles en una transacción ─────────────────────────
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

    const { iso } = nowChile();
    console.log(`[crear-pedido] ✅ Pedido ${nuevoPedido.id} — usuario ${usuarioId} — ${iso}`);

    return NextResponse.json(
      { mensaje: 'Pedido creado exitosamente', pedidoId: nuevoPedido.id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[crear-pedido] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalle: error.message },
      { status: 500 }
    );
  }
}