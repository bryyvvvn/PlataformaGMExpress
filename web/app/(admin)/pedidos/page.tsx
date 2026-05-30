// web/app/(admin)/pedidos/page.tsx
import { getGestionPedidosStats } from "@/lib/admin/gestion-pedidos";
import { ClipboardList } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function GestionPedidosPage() {
  // Llamamos a la base de datos directamente desde el servidor
  const stats = await getGestionPedidosStats();

  // Calculamos unos totales rápidos para la cabecera
  const totalGlobalPedidos = stats.reduce((sum, stat) => sum + stat.totalPedidos, 0);
  const totalGlobalPendientes = stats.reduce((sum, stat) => sum + stat.pedidosPendientes, 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      {/* --- CABECERA --- */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Gestión de Pedidos
        </h1>
        <p className="text-muted-foreground">
          {totalGlobalPedidos} pedidos históricos · {totalGlobalPendientes} pendientes de entrega
        </p>
      </div>

      {/* --- TABLA DE ESTADÍSTICAS --- */}
      <Card className="overflow-hidden border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ClipboardList className="h-5 w-5 text-[#1b2c56]" />
            Resumen por Empresa
          </CardTitle>
          <CardDescription>
            Volumen de pedidos y porciones solicitadas por cada cliente corporativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-center">Total Pedidos</TableHead>
                  <TableHead className="text-center">Porciones Solicitadas</TableHead>
                  <TableHead className="text-center">Estado de Entregas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      No hay empresas ni pedidos registrados aún.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium text-slate-900">
                        {stat.nombre}
                      </TableCell>
                      <TableCell className="text-center text-slate-600">
                        {stat.totalPedidos}
                      </TableCell>
                      <TableCell className="text-center font-bold text-[#1b2c56]">
                        {stat.totalPorciones}
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.pedidosPendientes > 0 ? (
                          <Badge 
                            variant="secondary" 
                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          >
                            {stat.pedidosPendientes} Pendientes
                          </Badge>
                        ) : stat.totalPedidos === 0 ? (
                          <span className="text-xs text-slate-400">Sin actividad</span>
                        ) : (
                          <Badge 
                            variant="secondary" 
                            className="bg-[#75aa46]/20 text-[#5d8a38] hover:bg-[#75aa46]/20"
                          >
                            Todo entregado
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}