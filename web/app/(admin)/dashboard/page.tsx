import dynamic from "next/dynamic";
import { Header } from "@/components/admin/header";
import { PedidosSemanalChart } from "@/components/admin/chart";
import { UltimosPedidos } from "@/components/admin/ultimos-items";
import DashboardVista from "@/components/admin/dashboard-vista";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";

const ExportarConsolidados = dynamic(
  () => import("@/components/admin/exportar-consolidados"),
  {
    loading: () => (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Exportación Operativa
        </h3>
      </div>
    ),
  }
);

export default async function DashboardPage() {
  // Consumimos la lógica intacta sin romper el backend
  const stats = await getDashboardStats();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Cabecera Corporativa */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 shadow-sm">
        <Header
          title="Panel de Control Operativo"
          subtitle="Resumen general de logística y estado de pedidos"
        />
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

        {/* KPIs con toggle Día/Semana */}
        <DashboardVista
          statsDia={{
            pedidosDelDia: stats.pedidosDelDia,
            pedidosPendientes: stats.pedidosPendientes,
            totalPorciones: stats.totalPorciones,
            totalEmpresas: stats.totalEmpresas,
            empresaTop: stats.empresaTop,
          }}
        />

        {/* Exportación operativa: PDFs para cocina y logística */}
        <ExportarConsolidados />

        {/* SECCIÓN 3: Gráficos y Tablas Reales */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Tendencia Semanal</h3>
            <PedidosSemanalChart
              dataSemana={stats.chartData}
              dataDia={stats.chartDataDia}
              dataMes={stats.chartDataMes}
              title=""
            />
          </div>
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 overflow-hidden">
            <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Log de Últimos Pedidos</h3>
            <div className="text-sm">
              <UltimosPedidos pedidos={stats.ultimosPedidos} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
