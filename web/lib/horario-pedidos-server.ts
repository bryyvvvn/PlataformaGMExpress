import db from '@/lib/db'
import { getEstadoHorario, type EstadoHorario } from './horario-pedidos'

export async function getHorarioEmpresa(empresaId: number): Promise<EstadoHorario> {
  const [configuracion, empresa] = await Promise.all([
    db.configuracionSistema.findUnique({ where: { id: 1 }, select: { horaLimite: true } }),
    db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        horaDespacho: true,
        ConvenioEmpresa: { select: { trabajaFinDeSemana: true } },
      },
    }),
  ])

  const horaGlobal = configuracion?.horaLimite ?? '10:00'
  const horaDespacho = empresa?.horaDespacho ?? null
  const trabajaFinDeSemana = empresa?.ConvenioEmpresa?.trabajaFinDeSemana ?? false

  return getEstadoHorario(horaDespacho, horaGlobal, trabajaFinDeSemana)
}
