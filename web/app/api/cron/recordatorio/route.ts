import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db'; 
import '../../../../lib/firebase-admin'; 
import { getMessaging, Message } from 'firebase-admin/messaging'; 

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get('secret');

  if (querySecret !== process.env.CRON_SECRET) {
    return new NextResponse('Acceso denegado. Intento no autorizado.', { status: 401 });
  }

  try {
    const hoy = new Date();
    const opcionesFecha = { timeZone: 'America/Santiago' };
    const fechaChileString = hoy.toLocaleString('en-US', opcionesFecha);
    const fechaChile = new Date(fechaChileString);
    
    const inicioDia = new Date(fechaChile);
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(fechaChile);
    finDia.setHours(23, 59, 59, 999);

    const trabajadoresSinPedido = await db.usuario.findMany({
      where: {
        fcmToken: { not: null },
        pedidos: {
          none: {
            fecha: {
              gte: inicioDia,
              lte: finDia
            }
          }
        }
      },
      select: {
        fcmToken: true,
        nombre: true
      }
    });

    const tokens = trabajadoresSinPedido
      .map(t => t.fcmToken)
      .filter((token): token is string => 
        token !== null && 
        token.trim() !== '' && 
        token !== 'undefined' && 
        token !== 'null' &&
        token.length > 50 
      );

    console.log(`[Cron Recordatorio] Cantidad de dispositivos válidos encontrados: ${tokens.length}`);

    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        mensaje: 'Todos los trabajadores ya hicieron su pedido o no hay dispositivos válidos registrados.' 
      });
    }

    const mensajes: Message[] = tokens.map(token => ({
      token: token,
      notification: {
        title: '¡Recuerda pedir tu colación! 🍽️',
        body: 'Aún estás a tiempo de ingresar a GM Express y armar tu menú antes de que se cumpla la hora límite.'
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      }
    }));

    const respuestaFCM = await getMessaging().sendEach(mensajes);

    let exitosos = 0;
    let fallidos = 0;

    respuestaFCM.responses.forEach((resp, index) => {
      if (resp.success) {
        exitosos++;
      } else {
        fallidos++;
        console.error(`[FCM Error] Falló el envío al token índice [${index}]:`, resp.error?.message);
      }
    });

    return NextResponse.json({
      success: true,
      usuariosEvaluados: tokens.length,
      detallesFirebase: {
        exitosos,
        fallidos
      }
    });

  } catch (error) {
    console.error('Error crítico en el cron de recordatorios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}