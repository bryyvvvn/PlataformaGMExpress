import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export const dynamic = 'force-dynamic';

// CAMBIADO A POST PARA PRODUCCIÓN
export async function POST(request: NextRequest) {
  
  // 1. SEGURIDAD ACTIVADA: Solo Railway con el CRON_SECRET puede ejecutar esto
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Acceso denegado. Intento no autorizado.', { status: 401 });
  }

  try {
    const inicioDia = chileStartOfDay();
    const finDia = chileEndOfDay();

    // 2. OBTENER EL MENÚ DEL DÍA EXACTO PARA HOY
    const menuHoy = await db.menuDiaSeleccion.findFirst({
      where: {
        fecha_dia: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      include: {
        entradaDetalle: true,
        fondoDetalle: true,
        postreDetalle: true,
        entradasSeleccionadas: {
          include: { menuDetalle: true }
        }
      }
    });

    if (!menuHoy) {
      console.log('No hay Menú del Día configurado para hoy.');
      return NextResponse.json({ success: true, mensaje: 'Sin menú configurado, no se asignó nada.' });
    }

    // 3. ARMAR EL PLATO PERFECTO
    const detallesData: { platoId: number; guarnicionId?: number | null; cantidad: number }[] = [];

    // -- Entradas
    if (menuHoy.entradasSeleccionadas && menuHoy.entradasSeleccionadas.length > 0) {
      menuHoy.entradasSeleccionadas.forEach(ent => {
        detallesData.push({ platoId: ent.menuDetalle.platoId, cantidad: 1 });
      });
    } else if (menuHoy.entradaDetalle) {
      detallesData.push({ platoId: menuHoy.entradaDetalle.platoId, cantidad: 1 });
    }

    // -- Fondo + Guarnición
    if (menuHoy.fondoDetalle) {
      detallesData.push({ 
        platoId: menuHoy.fondoDetalle.platoId, 
        guarnicionId: menuHoy.guarnicionId ?? null, 
        cantidad: 1 
      });
    }

    // -- Postre
    if (menuHoy.postreDetalle) {
      detallesData.push({ platoId: menuHoy.postreDetalle.platoId, cantidad: 1 });
    }

    // -- Jugo/Bebida
    if (menuHoy.bebidaPlatoId) {
      detallesData.push({ platoId: menuHoy.bebidaPlatoId, cantidad: 1 });
    }

    // 4. BUSCAR A LOS USUARIOS REZAGADOS
    const usuariosSinPedido = await db.usuario.findMany({
      where: {
        empresaId: { not: null },
        pedidos: {
          none: {
            fecha: {
              gte: inicioDia,
              lte: finDia,
            },
          },
        },
      },
      select: { 
        id: true, 
        empresaId: true 
      },
    });

    if (usuariosSinPedido.length === 0) {
      return NextResponse.json({ success: true, mensaje: 'Todos los usuarios ya pidieron o no hay trabajadores disponibles. Nada que asignar.' });
    }

    // 5. CREACIÓN MASIVA CON TRANSACCIÓN
    const transacciones = usuariosSinPedido.map((usuario) => {
      return db.pedido.create({
        data: {
          fecha: inicioDia, 
          usuarioId: usuario.id,
          empresaId: usuario.empresaId!, 
          estado: 'PENDIENTE',
          detalles: {
            create: detallesData, 
          },
        },
      });
    });

    await db.$transaction(transacciones);

    return NextResponse.json({ 
      success: true, 
      mensaje: `¡Éxito! Se asignó el menú del día a ${usuariosSinPedido.length} usuarios rezagados.` 
    });

  } catch (error) {
    console.error('[CRON AUTO-ASIGNAR] Error crítico:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}