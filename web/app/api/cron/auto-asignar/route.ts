import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; // Ajusta los '..' según la profundidad de tu carpeta

export async function GET(request: Request) {
  // Nota: Usamos GET para poder probarla fácilmente en el navegador y para que Vercel la ejecute.

  // Opcional: Proteger la ruta para que nadie externo pueda ejecutarla
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // 1. Definir para cuándo es el pedido. 
    // Asumimos que si la hora límite es hoy a las 17:00, estamos asignando la comida de MAÑANA.
    const fechaObjetivo = new Date();
    fechaObjetivo.setDate(fechaObjetivo.getDate() + 1); // +1 día (Mañana)

    const isoString = fechaObjetivo.toISOString().split('T')[0]; 
    const numDiaSemana = fechaObjetivo.getDay(); // 1 = Lunes, 5 = Viernes...

    // No hacemos nada si mañana es Sábado (6) o Domingo (0)
    if (numDiaSemana === 0 || numDiaSemana === 6) {
      return NextResponse.json({ message: 'Fin de semana. No se auto-asignan pedidos.' });
    }

    // 2. Buscar el Menú del Día configurado para esa fecha
    const inicioDia = new Date(`${isoString}T00:00:00.000Z`);
    const finDia = new Date(`${isoString}T23:59:59.999Z`);

    const menuDia = await db.menuDiaSeleccion.findFirst({
      where: { fecha_dia: { gte: inicioDia, lte: finDia } },
      include: {
        entradaDetalle: true,
        fondoDetalle: true,
        postreDetalle: true,
      }
    });

    if (!menuDia) {
      return NextResponse.json({ message: 'No hay Menú del Día configurado para mañana.' });
    }

    // 3. Traer todos los trabajadores activos y sus pedidos de esa fecha
    const trabajadores = await db.usuario.findMany({
      where: { rol: 'TRABAJADOR' },
      include: {
        pedidos: {
          where: { fecha: { gte: inicioDia, lte: finDia } }
        }
      }
    });

    // 4. Filtrar a los "despistados": Los que NO pidieron y NO tienen el día bloqueado
    const despistados = trabajadores.filter(t => {
      const yaPidio = t.pedidos.length > 0;
      const diaBloqueado = t.diasBloqueados.includes(numDiaSemana);
      return !yaPidio && !diaBloqueado;
    });

    if (despistados.length === 0) {
      return NextResponse.json({ message: 'Genial. Todos pidieron o tienen el día bloqueado.' });
    }

    // 5. Inyectar los pedidos en la base de datos masivamente
    const operaciones = despistados.map(t => {
      // Validamos si el plato de fondo incluye guarnición en el Menú del Día
      const datosGuarnicion = menuDia.guarnicionId ? { guarnicionId: menuDia.guarnicionId } : {};

      return db.pedido.create({
        data: {
          fecha: new Date(`${isoString}T12:00:00.000Z`), // Guardamos a mediodía para evitar lios de zonas horarias
          estado: 'PENDIENTE', // O 'CONFIRMADO', dependiendo de cómo inicie tu flujo
          empresaId: t.empresaId!,
          usuarioId: t.id,
          detalles: {
            create: [
              { platoId: menuDia.entradaDetalle.platoId, cantidad: 1 },
              { platoId: menuDia.fondoDetalle.platoId, cantidad: 1, ...datosGuarnicion },
              { platoId: menuDia.postreDetalle.platoId, cantidad: 1 }
            ]
          }
        }
      });
    });

    // Ejecutamos todo de golpe con una transacción (si falla uno, no se guarda ninguno, protegiendo tu BD)
    await db.$transaction(operaciones);

    return NextResponse.json({
      success: true,
      asignados: despistados.length,
      nombres: despistados.map(u => u.nombre),
      mensaje: `Menú del Día asignado exitosamente a ${despistados.length} trabajadores.`
    });

  } catch (error) {
    console.error('[CRON AUTO-ASIGNAR] Error:', error);
    return NextResponse.json({ error: 'Error interno ejecutando el Cron' }, { status: 500 });
  }
}