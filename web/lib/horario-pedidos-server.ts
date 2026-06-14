import db from '@/lib/db'
import { getEstadoHorario, type EstadoHorario } from './horario-pedidos'

export async function getHorarioEmpresa(empresaId: number): Promise<EstadoHorario> {
  const [configuracion, empresa] = await Promise.all([
    db.configuracionSistema.findUnique({ where: { id: 1 }, select: { horaLimite: true } }),
    db.empresa.findUnique({ where: { id: empresaId }, select: { horaDespacho: true } }),
  ])

  const horaGlobal = configuracion?.horaLimite ?? '10:00'
  const horaDespacho = empresa?.horaDespacho ?? null

  return getEstadoHorario(horaDespacho, horaGlobal)
}
