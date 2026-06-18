import db from "@/lib/db"
import { obtenerConsolidadoSemana } from "@/lib/pedidos/consolidado"
import { HORA_CIERRE_PEDIDOS } from "@/lib/pedidos/cierre-pedidos"
import { GestionPedidosClient } from "./GestionPedidosClient"

export default async function GestionPedidosPage() {
  const [semana, configuracion] = await Promise.all([
    obtenerConsolidadoSemana(),
    db.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { horaLimite: true },
    }),
  ])

  return (
    <GestionPedidosClient
      semana={semana}
      horaLimitePedidos={configuracion?.horaLimite ?? HORA_CIERRE_PEDIDOS}
    />
  )
}
