import db from "@/lib/db";
import { EstadoPedido } from "@prisma/client";

export type EmpresaPedidosStat = {
  id: number;
  nombre: string;
  totalPedidos: number;
  pedidosPendientes: number;
  totalPorciones: number;
};

export async function getGestionPedidosStats(): Promise<EmpresaPedidosStat[]> {
  const empresas = await db.empresa.findMany({
    select: {
      id: true,
      nombre: true,
      pedidos: {
        select: {
          estado: true,
          detalles: {
            select: { cantidad: true }
          }
        }
      }
    },
    orderBy: { nombre: 'asc' }
  });

  return empresas.map(empresa => {
    const totalPedidos = empresa.pedidos.length;

    const pedidosPendientes = empresa.pedidos.filter(
      (p) => p.estado === EstadoPedido.PENDIENTE
    ).length;

    const totalPorciones = empresa.pedidos.reduce((acc, pedido) => {
      const porcionesDelPedido = pedido.detalles.reduce((sum, det) => sum + det.cantidad, 0);
      return acc + porcionesDelPedido;
    }, 0);

    return {
      id: empresa.id,
      nombre: empresa.nombre,
      totalPedidos,
      pedidosPendientes,
      totalPorciones
    };
  });
}