import db from "@/lib/db"
import { EstadoEmpresa } from "@prisma/client"
import { FacturacionClient } from "./FacturacionClient"

export default async function FacturacionPage() {
  const empresas = await db.empresa.findMany({
    where: { estado: EstadoEmpresa.ACTIVA },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  })

  return <FacturacionClient empresas={empresas} />
}
