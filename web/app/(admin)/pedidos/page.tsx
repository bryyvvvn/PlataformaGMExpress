import db from "@/lib/db"
import { obtenerConsolidadoSemana } from "@/lib/pedidos/consolidado"
import { HORA_CIERRE_PEDIDOS } from "@/lib/pedidos/cierre-pedidos"
import { GestionPedidosClient } from "./GestionPedidosClient"

export default async function GestionPedidosPage() {
  const [semana, configuracion, empresas] = await Promise.all([
    obtenerConsolidadoSemana(),
    db.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { horaLimite: true },
    }),
    db.empresa.findMany({
      where: { estado: "ACTIVA" },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return (
    <GestionPedidosClient
      semana={semana}
      horaLimitePedidos={configuracion?.horaLimite ?? HORA_CIERRE_PEDIDOS}
      empresas={empresas}
    />
  )
}
