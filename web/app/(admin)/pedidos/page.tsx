import { obtenerConsolidadoSemana } from "@/lib/pedidos/consolidado"
import { GestionPedidosClient } from "./GestionPedidosClient"

export default async function GestionPedidosPage() {
  const semana = await obtenerConsolidadoSemana()

  return <GestionPedidosClient semana={semana} />
}
