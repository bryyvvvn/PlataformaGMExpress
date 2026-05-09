import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuarioId, entradaId, fondoId, postreId } = body;

    // Log de depuración
    console.log("Insertando pedido para usuario:", usuarioId);

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      // Si entra aquí, es que el usuarioId enviado no existe en la tabla Usuario
      return NextResponse.json(
        { error: `Usuario ${usuarioId} no encontrado en la base de datos.` }, 
        { status: 400 }
      );
    }

    if (!usuario.empresaId) {
       return NextResponse.json(
        { error: "El usuario existe pero no tiene empresaId asignado." }, 
        { status: 400 }
      );
    }

    // ... resto del código de creación ...

    // 2. Guardar el Pedido y los Detalles en una sola transacción
    const nuevoPedido = await db.pedido.create({
      data: {
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        estado: 'PENDIENTE',
        detalles: {
          create: [
            { platoId: entradaId },
            { platoId: fondoId },
            { platoId: postreId }
          ]
        }
      }
    });

    // Respuesta limpia sin headers manuales
    return NextResponse.json(
      { mensaje: "Pedido creado exitosamente", pedido: nuevoPedido }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error al guardar el pedido:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}