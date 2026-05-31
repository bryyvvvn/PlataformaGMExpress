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
    let fechaBase = new Date(); // Asumimos hoy por defecto
    
    // 🔥 NUEVA PROTECCIÓN: Verificamos que fechaStr exista Y que no sea una palabra basura (ej. "REPRESENTANTE")
    if (fechaStr && !isNaN(Date.parse(fechaStr))) {
      const safeDate = fechaStr.includes('T') ? fechaStr : `${fechaStr}T12:00:00`;
      fechaBase = new Date(safeDate);
    }

    const diaSemana = fechaBase.getDay() || 7;
    const inicioSemana = new Date(fechaBase);
    inicioSemana.setDate(fechaBase.getDate() - diaSemana + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const usuarios = await db.usuario.findMany({
      where: { empresaId, rol: 'TRABAJADOR' },
      select: {
        id: true,
        nombre: true,
        // 👇 AQUÍ ESTÁ LA MAGIA: Le pedimos a Prisma que traiga el arreglo de días
        diasBloqueados: true, 
        pedidos: {
          where: { fecha: { gte: inicioSemana, lte: finSemana } },
          orderBy: { fecha: 'asc' },
          select: {  
            id: true,
            fecha: true,
            estado: true, 
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
            listaPlatos: listaPlatos.length > 0 ? listaPlatos : ['Menú Seleccionado']
          };
        });

        return {
          id: usuario.id,
          nombre: usuario.nombre,
          // 👇 Y AQUÍ se lo enviamos al frontend
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