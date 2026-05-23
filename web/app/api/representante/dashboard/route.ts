import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const empresaIdStr = searchParams.get('empresaId');
  const fechaStr = searchParams.get('fecha'); 

  if (!empresaIdStr) {
    return NextResponse.json({ error: 'Falta el empresaId' }, { status: 400 });
  }

  const empresaId = parseInt(empresaIdStr, 10);
  if (isNaN(empresaId)) {
    return NextResponse.json({ error: 'empresaId inválido' }, { status: 400 });
  }

  try {
    // 🔥 BLINDAJE DE ZONA HORARIA: Forzamos el mediodía para evitar que Chile (UTC-4) reste un día
    let fechaBase = new Date();
    if (fechaStr) {
      const safeDate = fechaStr.includes('T') ? fechaStr : `${fechaStr}T12:00:00`;
      fechaBase = new Date(safeDate);
    }
    
    // Contadores del día seleccionado
    const inicioHoy = new Date(fechaBase);
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(fechaBase);
    finHoy.setHours(23, 59, 59, 999);

    // Calculamos el Lunes y el Domingo de ESA semana
    const diaSemana = fechaBase.getDay() || 7; 
    const inicioSemana = new Date(fechaBase);
    inicioSemana.setDate(fechaBase.getDate() - diaSemana + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const totalTrabajadores = await db.usuario.count({
      where: { empresaId, rol: 'TRABAJADOR' }
    });

    const pedidosListosHoy = await db.pedido.count({
      where: {
        empresaId,
        fecha: { gte: inicioHoy, lte: finHoy }
      }
    });

    // Búsqueda con filtro estricto de semana
    const usuarios = await db.usuario.findMany({
      where: { empresaId, rol: 'TRABAJADOR' },
      select: {
        id: true,
        nombre: true,
        pedidos: {
          // 🔥 FILTRO ACTIVO: Solo trae pedidos que calcen en la semana calculada
          where: { fecha: { gte: inicioSemana, lte: finSemana } },
          orderBy: { fecha: 'asc' }, 
          include: {
            detalles: { include: { plato: true, guarnicion: true } }
          }
        }
      }
    });

    const planillaFormateada = usuarios
      .filter(usuario => usuario.pedidos.length > 0) 
      .map(usuario => {
        const pedidosFormateados = usuario.pedidos.map(p => {
          const listaPlatos = p.detalles.map(d => {
            let texto = d.plato.nombre;
            if (d.guarnicion) texto += ` + ${d.guarnicion.nombre}`;
            return texto;
          });

          return {
            id: p.id,
            fecha: p.fecha.toISOString(), 
            listaPlatos: listaPlatos.length > 0 ? listaPlatos : ['Menú Seleccionado']
          };
        });

        return {
          id: usuario.id,
          nombre: usuario.nombre,
          pedidos: pedidosFormateados
        };
      });

    return NextResponse.json({
      resumenEmpresa: {
        totalTrabajadores,
        pedidosListos: pedidosListosHoy,
        enviadoAGM: false
      },
      planilla: planillaFormateada
    });
    
  } catch (error) {
    console.error('[API DASHBOARD REPRESENTANTE] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}