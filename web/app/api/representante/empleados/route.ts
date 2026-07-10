import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verificarRepresentante } from '@/lib/representante/verificar-representante';
import { normalizarFechaEmpleados } from '@/lib/representante/trabajadores-cache';

function dateFromISO(fechaISO: string, finDia = false) {
  const date = new Date(`${fechaISO}T12:00:00`);
  date.setHours(finDia ? 23 : 0, finDia ? 59 : 0, finDia ? 59 : 0, finDia ? 999 : 0);
  return date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');
  const fechaInicio = searchParams.get('fechaInicio');
  const fechaFin = searchParams.get('fechaFin');
  const secret = searchParams.get('secret');

  let empresaId: number;

  if (secret === process.env.CRON_SECRET) {
    const empIdStr = searchParams.get('empresaId');
    if (!empIdStr) return NextResponse.json({ error: 'Falta empresaId para el cron' }, { status: 400 });

    empresaId = parseInt(empIdStr, 10);
    if (!Number.isFinite(empresaId)) {
      return NextResponse.json({ error: 'empresaId invalido' }, { status: 400 });
    }
  } else {
    const rep = await verificarRepresentante(request);
    if ('error' in rep) {
      return NextResponse.json({ error: rep.error }, { status: rep.status });
    }
    empresaId = rep.empresaId;
  }

  try {
    const fechaISO = normalizarFechaEmpleados(fecha);
    const fechaInicioISO = fechaInicio ? normalizarFechaEmpleados(fechaInicio) : undefined;
    const fechaFinISO = fechaFin ? normalizarFechaEmpleados(fechaFin) : undefined;

    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        ConvenioEmpresa: {
          select: {
            trabajaFinDeSemana: true,
            permiteCena: true,
          },
        },
      },
    });
    const convenio = {
      trabajaFinDeSemana: Boolean(empresa?.ConvenioEmpresa?.trabajaFinDeSemana),
      permiteCena: Boolean(empresa?.ConvenioEmpresa?.permiteCena),
    };

    let fechaInicioRango = fechaInicioISO;
    let fechaFinRango = fechaFinISO;

    if (!fechaInicioRango || !fechaFinRango) {
      const fechaBase = new Date(`${fechaISO}T12:00:00`);
      const diaSemana = fechaBase.getDay() || 7;
      const inicioSemana = new Date(fechaBase);
      inicioSemana.setDate(fechaBase.getDate() - diaSemana + 1);

      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + (convenio.trabajaFinDeSemana ? 6 : 4));

      fechaInicioRango = inicioSemana.toISOString().slice(0, 10);
      fechaFinRango = finSemana.toISOString().slice(0, 10);
    }

    const inicioSemana = dateFromISO(fechaInicioRango);
    const finSemana = dateFromISO(fechaFinRango, true);

    const usuarios = await db.usuario.findMany({
      where: { empresaId, rol: 'TRABAJADOR' },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        nombre: true,
        rut: true,
        diasBloqueados: true,
        pedidos: {
          where: {
            fecha: { gte: inicioSemana, lte: finSemana },
            ...(convenio.permiteCena ? {} : { esCena: false }),
          },
          orderBy: { fecha: 'asc' },
          select: {
            id: true,
            fecha: true,
            estado: true,
            esCena: true,
            detalles: {
              select: {
                plato: { select: { nombre: true } },
                guarnicion: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    const data = usuarios.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      rut: usuario.rut,
      diasBloqueados: usuario.diasBloqueados,
      pedidos: usuario.pedidos.map((pedido) => {
        const listaPlatos = pedido.detalles.map((detalle) => {
          if (detalle.guarnicion) return `${detalle.plato.nombre} + ${detalle.guarnicion.nombre}`;
          return detalle.plato.nombre;
        });

        return {
          id: pedido.id,
          fecha: pedido.fecha.toISOString(),
          estado: pedido.estado,
          esCena: pedido.esCena,
          listaPlatos: listaPlatos.length > 0 ? listaPlatos : ['Menu Seleccionado'],
        };
      }),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API REPRESENTANTE EMPLEADOS] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
