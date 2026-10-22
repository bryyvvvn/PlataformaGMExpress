import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export async function POST(request: Request) {
  try {
    const { usuarioId, fecha, tipoMenu, esCena } = await request.json();

    if (!usuarioId || !fecha || !tipoMenu) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        empresaId: true,
        empresa: {
          select: {
            ConvenioEmpresa: {
              select: { permiteCena: true },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.empresaId) {
      return NextResponse.json({ error: 'Usuario no tiene empresa asignada' }, { status: 400 });
    }

    if (Boolean(esCena) && !Boolean(usuario.empresa?.ConvenioEmpresa?.permiteCena)) {
      return NextResponse.json(
        { error: 'La empresa no tiene habilitados pedidos de cena.' },
        { status: 403 }
      );
    }

    const mapaPlatos: Record<string, string> = {
      'MENU_DIA': 'Menú del Día',
      'HIPOCALORICO': 'Hipocalórico',
      'VEGETARIANO': 'Vegetariano',
      'COLACION': 'Colación',
    };

    const nombrePlato = mapaPlatos[tipoMenu];

    const plato = await db.plato.findUnique({ 
      where: { nombre: nombrePlato } 
    });

    if (!plato) {
      return NextResponse.json({ error: `Plato '${nombrePlato}' no encontrado en la base de datos` }, { status: 404 });
    }

    const inicioDia = chileStartOfDay(fecha);
    const finDia = chileEndOfDay(fecha);

    const pedidoExistente = await db.pedido.findFirst({
      where: { 
        usuarioId, 
        fecha: { gte: inicioDia, lte: finDia }, 
        esCena 
      }
    });

    if (pedidoExistente) {
      await db.detallePedido.deleteMany({ where: { pedidoId: pedidoExistente.id } });
      await db.detallePedido.create({ 
        data: { pedidoId: pedidoExistente.id, platoId: plato.id, cantidad: 1 } 
      });
      
      await db.pedido.update({
        where: { id: pedidoExistente.id },
        data: { estado: 'CONFIRMADO' }
      });
      
    } else {
      await db.pedido.create({
        data: {
          fecha: inicioDia,
          usuarioId,
          empresaId: usuario.empresaId,
          estado: 'CONFIRMADO',
          esCena,
          tipoCena: esCena ? tipoMenu : null,
          detalles: { 
            create: { platoId: plato.id, cantidad: 1 } 
          }
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Pedido manual asignado correctamente' });
  } catch (error) {
    console.error('[API PEDIDO MANUAL]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
