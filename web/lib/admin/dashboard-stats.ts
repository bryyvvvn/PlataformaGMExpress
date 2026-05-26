import db from "@/lib/db";
import { EstadoPedido } from "@prisma/client";
import {
  addDays,
  endOfDay,
  format,
  formatDistanceToNow,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export type PedidoReciente = {
  id: number;
  empresa: string;
  cantidad: number;
  fecha: string;
  estado: EstadoPedido;
};

export type DashboardStats = {
  pedidosDelDia: number;
  pedidosPendientes: number;
  totalPorciones: number;
  totalEmpresas: number;
  chartData: Array<{ day: string; pedidos: number }>;
  ultimosPedidos: PedidoReciente[];
};

function etiquetaDia(fecha: Date): string {
  const abrev = format(fecha, "EEE", { locale: es });
  return abrev.charAt(0).toUpperCase() + abrev.slice(1);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const ahora = new Date();
  const inicioHoy = startOfDay(ahora);
  const finHoy = endOfDay(ahora);
  const lunes = startOfWeek(ahora, { weekStartsOn: 1 });
  const inicioSemana = startOfDay(lunes);
  const finSemana = endOfDay(addDays(lunes, 6));

  const [
    pedidosDelDia,
    pedidosPendientes,
    porciones,
    totalEmpresas,
    pedidosEnSemana,
    ultimosPedidos,
  ] = await Promise.all([
    db.pedido.count({
      where: { fecha: { gte: inicioHoy, lte: finHoy } },
    }),
    db.pedido.count({
      where: { estado: EstadoPedido.PENDIENTE },
    }),
    db.detallePedido.aggregate({ _sum: { cantidad: true } }),
    db.empresa.count(),
    db.pedido.findMany({
      where: { fecha: { gte: inicioSemana, lte: finSemana } },
      select: { fecha: true },
    }),
    db.pedido.findMany({
      take: 5,
      orderBy: { fecha: "desc" },
      include: {
        empresa: { select: { nombre: true } },
        detalles: { select: { cantidad: true } },
      },
    }),
  ]);

  const conteoPorDia = Array.from({ length: 7 }, () => 0);
  for (const { fecha } of pedidosEnSemana) {
    const offset = Math.floor(
      (startOfDay(fecha).getTime() - inicioSemana.getTime()) / 86_400_000
    );
    if (offset >= 0 && offset < 7) {
      conteoPorDia[offset]++;
    }
  }

  const chartData = conteoPorDia.map((pedidos, i) => ({
    day: etiquetaDia(addDays(lunes, i)),
    pedidos,
  }));

  const ultimosFormateados: PedidoReciente[] = ultimosPedidos.map((pedido) => ({
    id: pedido.id,
    empresa: pedido.empresa.nombre,
    cantidad: pedido.detalles.reduce((sum, d) => sum + d.cantidad, 0),
    fecha: formatDistanceToNow(pedido.fecha, { addSuffix: true, locale: es }),
    estado: pedido.estado,
  }));

  return {
    pedidosDelDia,
    pedidosPendientes,
    totalPorciones: porciones._sum.cantidad ?? 0,
    totalEmpresas,
    chartData,
    ultimosPedidos: ultimosFormateados,
  };
}
