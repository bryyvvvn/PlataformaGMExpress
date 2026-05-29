import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PedidoReciente } from "@/lib/admin/dashboard-stats";
import { EstadoPedido } from "@prisma/client";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const variantePorEstado: Record<EstadoPedido, BadgeVariant> = {
  [EstadoPedido.PENDIENTE]: "destructive",
  [EstadoPedido.CONFIRMADO]: "default",
  [EstadoPedido.EN_PRODUCCION]: "outline",
  [EstadoPedido.ENTREGADO]: "secondary",
  [EstadoPedido.CANCELADO]: "outline",
};

const etiquetaEstado: Record<EstadoPedido, string> = {
  [EstadoPedido.PENDIENTE]: "Pendiente",
  [EstadoPedido.CONFIRMADO]: "Confirmado",
  [EstadoPedido.EN_PRODUCCION]: "En producción",
  [EstadoPedido.ENTREGADO]: "Entregado",
  [EstadoPedido.CANCELADO]: "Cancelado",
};

function formatearId(id: number) {
  return `#${String(id).padStart(3, "0")}`;
}

type UltimosPedidosProps = {
  pedidos: PedidoReciente[];
};

export function UltimosPedidos({ pedidos }: UltimosPedidosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Últimos pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        {pedidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay pedidos registrados.
          </p>
        ) : (
          <ul className="space-y-4">
            {pedidos.map((pedido) => (
              <li
                key={pedido.id}
                className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {formatearId(pedido.id)} · {pedido.empresa}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pedido.fecha}
                    </p>
                  </div>
                  <Badge variant={variantePorEstado[pedido.estado]}>
                    {etiquetaEstado[pedido.estado]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pedido.cantidad}{" "}
                  {pedido.cantidad === 1 ? "almuerzo" : "almuerzos"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
