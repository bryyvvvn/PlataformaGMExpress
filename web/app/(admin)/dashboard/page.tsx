import { Header } from "@/components/admin/header";
import { StatsCard } from "@/components/admin/stats-card";
import { PedidosSemanalChart } from "@/components/admin/chart";
import { UltimosPedidos } from "@/components/admin/ultimos-items";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";
import { Building2, Clock, ShoppingCart, Utensils, Flame, Snowflake, CheckCircle2 } from "lucide-react";

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
        
        {/* SECCIÓN 1: KPIs Principales (Tus datos reales) */}
        <div>
          <h2 className="text-sm font-bold text-[#1B2C56] uppercase tracking-wider mb-4">
            Métricas del Día
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-[#1B2C56]"></div>
              <StatsCard
                title="Pedidos Hoy"
                value={stats.pedidosDelDia}
                icon={<ShoppingCart className="h-5 w-5 text-[#1B2C56]" />}
                color="primary"
              />
            </div>
            
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-amber-500"></div>
              <StatsCard
                title="En Espera"
                value={stats.pedidosPendientes}
                icon={<Clock className="h-5 w-5 text-amber-600" />}
                color="warning"
              />
            </div>

            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-[#75AA46]"></div>
              <StatsCard
                title="Porciones Totales"
                value={stats.totalPorciones}
                icon={<Utensils className="h-5 w-5 text-[#75AA46]" />}
                color="success"
              />
            </div>

            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-slate-700"></div>
              <StatsCard
                title="Empresas Activas"
                value={stats.totalEmpresas}
                icon={<Building2 className="h-5 w-5 text-slate-700" />}
                color="primary"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Visión Estática para la Reunión (Mockup visual para vender la idea) */}
        <div>
          <h2 className="text-sm font-bold text-[#1B2C56] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#75AA46]"></span>
            </span>
            Monitor de Áreas (En Desarrollo)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded text-red-600"><Flame className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Zona Caliente</p>
                  <p className="text-lg font-bold text-slate-800">12 Platos</p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">En fuego</span>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded text-blue-600"><Snowflake className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Zona Fría</p>
                  <p className="text-lg font-bold text-slate-800">8 Ensaladas</p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">Preparando</span>
            </div>

            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Empaque / Despacho</p>
                  <p className="text-lg font-bold text-slate-800">45 Listos</p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">Despachando</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Gráficos y Tablas Reales */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Tendencia Semanal</h3>
            <PedidosSemanalChart
              data={stats.chartData}
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