import { Header } from "@/components/admin/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex min-h-full flex-col">
      <Header title="Inicio" subtitle="Cargando resumen…" />
      <div className="grid gap-6 p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] animate-pulse rounded-xl bg-muted" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded bg-muted" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
