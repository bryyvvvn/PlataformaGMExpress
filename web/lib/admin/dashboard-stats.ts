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
import { getConsolidadoDia } from "@/lib/admin/generar-consolidado";
import { chileEndOfDay, chileStartOfDay, getChileHour } from "@/lib/chile-time";

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
  chartDataDia: Array<{ time: string; pedidos: number }>;
  ultimosPedidos: PedidoReciente[];
  zonaCalienteCount: number;
  zonaFriaCount: number;
  empaqueCount: number;
  empresaTop: string | null;
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
  const inicioHoyChile = chileStartOfDay();
  const finHoyChile = chileEndOfDay();

  const [
    pedidosDelDia,
    pedidosPendientes,
    porciones,
    totalEmpresas,
    pedidosEnSemana,
    pedidosHoyChile,
    ultimosPedidos,
    consolidado,
    empaqueCount,
  ] = await Promise.all([
    db.pedido.count({
      where: { fecha: { gte: inicioHoy, lte: finHoy } },
    }),
    db.pedido.count({
      where: { estado: EstadoPedido.PENDIENTE },
    }),
    db.detallePedido.aggregate({_sum: { cantidad: true },
      where: {pedido: {fecha: { gte: inicioHoyChile, lt: finHoyChile },
      estado: { not: EstadoPedido.CANCELADO }}}}),
    db.empresa.count(),
    db.pedido.findMany({
      where: { fecha: { gte: inicioSemana, lte: finSemana } },
      select: { fecha: true },
    }),
    db.pedido.findMany({
      where: { fecha: { gte: inicioHoyChile, lt: finHoyChile } },
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
    getConsolidadoDia(),
    db.pedido.count({
      where: { estado: EstadoPedido.EN_PRODUCCION },
    }),
  ]);

  const zonaFriaCount = consolidado.zonaFria.reduce(
    (sum, i) => sum + i.cantidad,
    0
  );
  const zonaCalienteCount = consolidado.zonaCaliente.reduce(
    (sum, i) => sum + i.cantidad,
    0
  );
  const empresaTop = consolidado.resumenGeneral.empresaTopNombre;

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

  const conteoPorHora = Array.from({ length: 24 }, () => 0);
  for (const { fecha } of pedidosHoyChile) {
    conteoPorHora[getChileHour(fecha)]++;
  }

  const chartDataDia = conteoPorHora.map((pedidos, hour) => ({
    time: `${String(hour).padStart(2, "0")}:00`,
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
    chartDataDia,
    ultimosPedidos: ultimosFormateados,
    zonaCalienteCount,
    zonaFriaCount,
    empaqueCount,
    empresaTop,
  };
}
