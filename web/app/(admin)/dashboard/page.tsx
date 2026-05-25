import { Header } from "@/components/admin/header";
import { StatsCard } from "@/components/admin/stats-card";
import { PedidosSemanalChart } from "@/components/admin/chart";
import { UltimosPedidos } from "@/components/admin/ultimos-items";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";
import { Building2, Clock, ShoppingCart, Utensils } from "lucide-react";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex min-h-full flex-col">
      <Header
        title="Inicio"
        subtitle="Resumen del día y actividad reciente"
      />

      <div className="p-8">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Pedidos hoy"
              value={stats.pedidosDelDia}
              icon={<ShoppingCart className="h-5 w-5" />}
              color="primary"
            />
            <StatsCard
              title="Pendientes"
              value={stats.pedidosPendientes}
              icon={<Clock className="h-5 w-5" />}
              color="warning"
            />
            <StatsCard
              title="Porciones pedidas"
              value={stats.totalPorciones}
              icon={<Utensils className="h-5 w-5" />}
              color="success"
            />
            <StatsCard
              title="Empresas activas"
              value={stats.totalEmpresas}
              icon={<Building2 className="h-5 w-5" />}
              color="primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PedidosSemanalChart
                data={stats.chartData}
                title="Pedidos de la semana"
              />
            </div>
            <UltimosPedidos pedidos={stats.ultimosPedidos} />
          </div>
        </div>
      </div>
    </div>
  );
}
