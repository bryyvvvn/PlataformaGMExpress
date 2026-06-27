import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export async function POST(request: Request) {
  try {
    const { usuarioId, fecha, tipoMenu, esCena } = await request.json();

    if (!usuarioId || !fecha || !tipoMenu) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // 1. Mapeo de los botones al nombre exacto del plato en tu Base de Datos
    // ⚠️ REVISA ESTOS NOMBRES: Deben ser iguales a los que tienes en tu BD
    const mapaPlatos: Record<string, string> = {
      'MENU_DIA': 'Menú del Día',
      'HIPOCALORICO': 'Hipocalórico',
      'VEGETARIANO': 'Vegetariano',
      'COLACION': 'Colación',
    };

    const nombrePlato = mapaPlatos[tipoMenu];
    
    // Buscamos el plato comodín en la base de datos
    const plato = await db.plato.findUnique({ 
      where: { nombre: nombrePlato } 
    });

    if (!plato) {
      return NextResponse.json({ error: `Plato '${nombrePlato}' no encontrado en la base de datos` }, { status: 404 });
    }

    // 2. Definir rango de la fecha usando tus helpers de hora chilena
    const inicioDia = chileStartOfDay(fecha);
    const finDia = chileEndOfDay(fecha);

    // 3. Revisar si el trabajador ya tiene un pedido para ese día en ese turno (Almuerzo/Cena)
    const pedidoExistente = await db.pedido.findFirst({
      where: { 
        usuarioId, 
        fecha: { gte: inicioDia, lte: finDia }, 
        esCena 
      }
    });

    // 4. Crear o Sobrescribir
    if (pedidoExistente) {
      // Si ya existía, borramos los platos viejos y metemos el nuevo (Sobrescribir)
      await db.detallePedido.deleteMany({ where: { pedidoId: pedidoExistente.id } });
      await db.detallePedido.create({ 
        data: { pedidoId: pedidoExistente.id, platoId: plato.id, cantidad: 1 } 
      });
      
      // Asegurarnos de que el pedido esté CONFIRMADO
      await db.pedido.update({
        where: { id: pedidoExistente.id },
        data: { estado: 'CONFIRMADO' }
      });
      
    } else {
      // Si no existe, creamos el pedido desde cero
      const usuario = await db.usuario.findUnique({ 
        where: { id: usuarioId }, 
        select: { empresaId: true } 
      });

      if (!usuario || !usuario.empresaId) {
         return NextResponse.json({ error: 'Usuario no tiene empresa asignada' }, { status: 400 });
      }

      await db.pedido.create({
        data: {
          fecha: inicioDia, // Usamos la fecha a las 00:00 hora Chile
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