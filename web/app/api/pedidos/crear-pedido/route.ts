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
    const { usuarioId, entradaId, fondoId, postreId, guarnicionId } = body as {
      usuarioId:    string;
      entradaId:    number;
      fondoId:      number;
      postreId:     number;
      guarnicionId?: number | null; // Sprint N: el usuario elige guarnición
    };

    // ── 1. Validar campos obligatorios ────────────────────────────────────────
    if (!usuarioId || !entradaId || !fondoId || !postreId) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios: usuarioId, entradaId, fondoId, postreId' },
        { status: 400 }
      );
    }

    // ── 2. Validar deadline en zona horaria Chile (servidor) ──────────────────
    // Esta validación existe en el servidor para que no pueda ser eludida
    // desde el frontend (DevTools, etc.).
    // Sprint N: leer DEADLINE_HOUR / DEADLINE_MINUTE desde ConfiguracionSistema en BD.
    if (isDeadlinePassed(DEADLINE_HOUR, DEADLINE_MINUTE)) {
      const hh = String(DEADLINE_HOUR).padStart(2, '0');
      const mm = String(DEADLINE_MINUTE).padStart(2, '0');
      return NextResponse.json(
        {
          error:   'El horario de pedidos ha cerrado',
          detalle: `Los pedidos cierran a las ${hh}:${mm} hora Chile`,
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

    // ── 4. Verificar que no haya un pedido registrado hoy (zona horaria Chile) ─
    const inicioDia = chileStartOfDay();
    const finDia    = chileEndOfDay();

    const pedidoExistente = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: { gte: inicioDia, lte: finDia },
      },
      select: { id: true },
    });

    if (pedidoExistente) {
      return NextResponse.json(
        { error: 'Ya registraste un pedido para hoy' },
        { status: 409 }
      );
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
        usuarioId:  usuario.id,
        empresaId:  usuario.empresaId,
        estado:     'PENDIENTE',
        detalles: {
          create: [
            { platoId: entradaId },
            {
              platoId:      fondoId,
              guarnicionId: guarnicionId ?? null,
              // Sprint N: el usuario elige guarnición desde la app.
              // El campo ya está en el schema — solo falta la UI y enviar guarnicionId.
            },
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