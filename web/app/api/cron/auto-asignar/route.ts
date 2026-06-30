import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get('secret');

  if (querySecret !== process.env.CRON_SECRET) {
    return new NextResponse('Acceso denegado', { status: 401 });
  }

  try {
    // 2. OBTENER Y NORMALIZAR LA HORA ACTUAL EN CHILE (AL CUARTO DE HORA)
    const ahora = new Date();
    const formatter = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const [horaStr, minutoStr] = formatter.format(ahora).split(':');
    let hora = parseInt(horaStr);
    const m = parseInt(minutoStr);
    
    // Redondeo robusto al cuarto de hora más cercano
    let minutoNormalizado = '00';
    if (m >= 53) {
      minutoNormalizado = '00';
      hora = hora === 23 ? 0 : hora + 1; // Ajuste por si cambia de día/hora
    } else if (m >= 38) {
      minutoNormalizado = '45';
    } else if (m >= 23) {
      minutoNormalizado = '30';
    } else if (m >= 8) {
      minutoNormalizado = '15';
    }

    const horaFinal = hora.toString().padStart(2, '0');
    const horaActualStr = `${horaFinal}:${minutoNormalizado}`; 

    console.log(`[CRON] Revisando cierres para la hora: ${horaActualStr}`);

    // 3. BUSCAR EMPRESAS QUE TIENEN CONFIGURADA ESTA HORA DE DESPACHO
    const empresasAlCierre = await db.empresa.findMany({
      where: { horaDespacho: horaActualStr },
      select: { id: true, nombre: true }
    });

    if (empresasAlCierre.length === 0) {
      return NextResponse.json({ 
        success: true, 
        mensaje: `Ninguna empresa tiene configurado el cierre a las ${horaActualStr}.` 
      });
    }

    const idsEmpresasCierre = empresasAlCierre.map((e) => e.id);
    console.log(`[CRON] Empresas a procesar:`, empresasAlCierre.map(e => e.nombre));

    // 4. OBTENER EL MENÚ DEL DÍA EXACTO PARA HOY
    const inicioDia = chileStartOfDay();
    const finDia = chileEndOfDay();

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
        entradasSeleccionadas: { include: { menuDetalle: true } }
      }
    });

    if (!menuHoy) {
      console.log('No hay Menú del Día configurado para hoy.');
      return NextResponse.json({ success: true, mensaje: 'Sin menú configurado, no se asignó nada.' });
    }

    // 5. ARMAR EL PLATO PERFECTO
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

    // 6. BUSCAR A LOS USUARIOS REZAGADOS SÓLO DE LAS EMPRESAS QUE CIERRAN AHORA
    const usuariosSinPedido = await db.usuario.findMany({
      where: {
        empresaId: { in: idsEmpresasCierre },
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
      return NextResponse.json({ success: true, mensaje: 'Los trabajadores de estas empresas ya pidieron o no hay rezagados. Nada que asignar.' });
    }

    // 7. CREACIÓN MASIVA CON TRANSACCIÓN
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
      mensaje: `¡Éxito! Se asignó el menú del día a ${usuariosSinPedido.length} rezagados de las empresas: ${empresasAlCierre.map(e => e.nombre).join(', ')}.` 
    });

  } catch (error) {
    console.error('[CRON AUTO-ASIGNAR] Error crítico:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}