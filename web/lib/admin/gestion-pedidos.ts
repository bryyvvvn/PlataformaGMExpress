// web/lib/admin/gestion-pedidos.ts
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
  // Traemos todas las empresas y sus pedidos asociados
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

  // Mapeamos los datos para calcular los totales de forma sencilla
  return empresas.map(empresa => {
    const totalPedidos = empresa.pedidos.length;
    
    // Filtramos cuántos de esos pedidos están en estado PENDIENTE
    const pedidosPendientes = empresa.pedidos.filter(
      (p) => p.estado === EstadoPedido.PENDIENTE
    ).length;
    
    // Sumamos la cantidad de platos (porciones) de todos los detalles de todos los pedidos
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