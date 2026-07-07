import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { verificarRepresentante } from '@/lib/representante/verificar-representante';

async function obtenerConvenioEmpresa(empresaId: number) {
  const empresa = await db.empresa.findUnique({
    where: { id: empresaId },
    select: {
      ConvenioEmpresa: {
        select: { trabajaFinDeSemana: true, permiteCena: true },
      },
    },
  });

  return {
    trabajaFinDeSemana: Boolean(empresa?.ConvenioEmpresa?.trabajaFinDeSemana),
    permiteCena: Boolean(empresa?.ConvenioEmpresa?.permiteCena),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fechaStr = searchParams.get('fecha');
  const secret = searchParams.get('secret'); // 🔥 Leemos el secreto
  
  let empresaId: number;

  // 🔥 PUERTA TRASERA PARA EL CRON
  if (secret === process.env.CRON_SECRET) {
    const empIdStr = searchParams.get('empresaId');
    if (!empIdStr) return NextResponse.json({ error: 'Falta empresaId para el cron' }, { status: 400 });
    empresaId = parseInt(empIdStr, 10);
  } else {
    // FLUJO NORMAL PARA USUARIOS REALES
    const rep = await verificarRepresentante(request);
    if ('error' in rep) {
      return NextResponse.json({ error: rep.error }, { status: rep.status });
    }
    empresaId = rep.empresaId;
  }

  try {
    let fechaBase = new Date(); 
    
    if (fechaStr && !isNaN(Date.parse(fechaStr))) {
      const safeDate = fechaStr.includes('T') ? fechaStr : `${fechaStr}T12:00:00`;
      fechaBase = new Date(safeDate);
    }

    const diaSemana = fechaBase.getDay() || 7;
    const inicioSemana = new Date(fechaBase);
    inicioSemana.setDate(fechaBase.getDate() - diaSemana + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    const convenio = await obtenerConvenioEmpresa(empresaId);
    finSemana.setDate(inicioSemana.getDate() + (convenio.trabajaFinDeSemana ? 6 : 4));
    finSemana.setHours(23, 59, 59, 999);

    const usuarios = await db.usuario.findMany({
      where: { empresaId, rol: 'TRABAJADOR' },
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
            esCena: true, // 🔥 SE AGREGÓ: Ahora traemos la propiedad esCena desde la base de datos
            detalles: {
              include: {
                plato: true,
                guarnicion: true
              }
            }
          }
        }
      }
    });

    const planillaFormateada = usuarios.map(usuario => {
        const pedidosFormateados = usuario.pedidos.map(p => {
          const listaPlatos = p.detalles.map(d => {
            let texto = d.plato.nombre;
            if (d.guarnicion) texto += ` + ${d.guarnicion.nombre}`;
            return texto;
          });

          return {
            id: p.id,
            fecha: p.fecha.toISOString(),
            estado: p.estado,
            esCena: p.esCena, // 🔥 SE AGREGÓ: Pasamos el valor al frontend para que la tarjeta lo pueda filtrar
            listaPlatos: listaPlatos.length > 0 ? listaPlatos : ['Menú Seleccionado']
          };
        });

        return {
          id: usuario.id,
          nombre: usuario.nombre,
          rut: usuario.rut,
          diasBloqueados: usuario.diasBloqueados, 
          pedidos: pedidosFormateados
        };
      });

    return NextResponse.json(planillaFormateada);
  } catch (error) {
    console.error('[API REPRESENTANTE EMPLEADOS] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
