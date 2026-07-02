import { Header } from "@/components/admin/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatSkeleton() {
  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="h-7 w-16 animate-pulse rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="relative flex min-h-full flex-col bg-slate-50">
      <Header title="Inicio" subtitle="Cargando resumen…" />
      <div className="grid gap-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-md border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader>
              <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
            </CardHeader>
            <CardContent>
              <div className="h-[180px] animate-pulse rounded-md bg-slate-100" />
            </CardContent>
          </Card>
          <Card className="rounded-md border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-slate-100" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-blanco.png" alt="GM Express" className="w-32 drop-shadow-lg" />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B2C56] border-t-transparent" />
        </div>
      </div>
    </div>
  );
}
