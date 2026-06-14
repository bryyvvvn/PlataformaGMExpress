import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';

export const dynamic = 'force-dynamic';

type DetallePedidoInput = { platoId: number; guarnicionId?: number | null; cantidad?: number };

type PedidoRequestBody = {
  usuarioId?: string;
  entradaId?: number | string;
  entradasIds?: Array<number | string>;
  fondoId?: number | string;
  postreId?: number | string;
  jugoId?: number | string;
  guarnicionId?: number | null;
  fecha?: string | null;
  items?: DetallePedidoInput[];
  // 🔥 NUEVO: Agregamos los tipos para el fin de semana
  esFinDeSemana?: boolean;
  tipoFinde?: string;
};

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function normalizeEntradasIds(entradasIds: unknown, entradaId: unknown) {
  const normalized: number[] = [];
  const seen = new Set<number>();
  let hasInvalidValue = false;

  const addEntrada = (value: unknown) => {
    const id = toPositiveInteger(value);

    if (!id) {
      hasInvalidValue = true;
      return;
    }

    if (!seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  };

  if (entradasIds !== undefined && entradasIds !== null) {
    if (!Array.isArray(entradasIds)) {
      hasInvalidValue = true;
    } else {
      entradasIds.forEach(addEntrada);
    }
  }

  if (entradaId !== undefined && entradaId !== null) {
    addEntrada(entradaId);
  }

  return { ids: normalized, hasInvalidValue };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuarioId');

  if (!usuarioId) {
    return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });
  }

  if (searchParams.get('historial') === 'true') {
    try {
      const pedidos = await db.pedido.findMany({
        where: { usuarioId },
        orderBy: { fecha: 'desc' },
        include: {
          detalles: {
            include: { plato: true, guarnicion: true }
          }
        }
      });

      return NextResponse.json(pedidos);
    } catch (error) {
      console.error('[API PEDIDOS] Error al obtener historial:', error);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  }

  try {
    const fechaParam = searchParams.get('fecha');
    const inicioDia = chileStartOfDay(fechaParam ?? undefined);
    const finDia = chileEndOfDay(fechaParam ?? undefined);

    const pedidoExistente = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      include: {
        detalles: {
          include: { plato: true, guarnicion: true }
        }
      }
    });

    if (!pedidoExistente) {
      return NextResponse.json({ existe: false });
    }

    const resumen = pedidoExistente.detalles.map(d => ({
      platoId: d.platoId,
      nombre: d.plato.nombre,
      categoria: d.plato.categoria,
      guarnicionId: d.guarnicionId ?? null,
      guarnicionNombre: d.guarnicion?.nombre ?? null,
    }));

    // 🔥 NUEVO: Inyectamos el tipoFinde si es que el pedido contiene un plato comodín
    let tipoFinde = null;
    const nombreFondo = resumen.find(r => r.categoria === 'FONDO')?.nombre;
    if (nombreFondo === 'Menú del Día (Fin de Semana)') tipoFinde = 'MENU_DIA';
    if (nombreFondo === 'Hipocalórico (Fin de Semana)') tipoFinde = 'HIPOCALORICO';
    if (nombreFondo === 'Vegetariano (Fin de Semana)') tipoFinde = 'VEGETARIANO';
    if (nombreFondo === 'Colación (Fin de Semana)') tipoFinde = 'COLACION';

    return NextResponse.json({
      existe: true,
      pedido: {
        id: pedidoExistente.id,
        fecha: pedidoExistente.fecha.toISOString(),
        resumen,
        tipoFinde // Esto le servirá a la app para saber qué botón marcar al "modificar"
      },
    });
  } catch (error) {
    console.error('[API PEDIDOS] Error al verificar pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as PedidoRequestBody;
    
    // 🔥 NUEVO: Extraemos esFinDeSemana y tipoFinde
    const { usuarioId, entradaId, entradasIds, fondoId, postreId, jugoId, guarnicionId, fecha, items, esFinDeSemana, tipoFinde } = body;

    if (!usuarioId) {
      return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });
    }

    const fondoIdNormalizado = toPositiveInteger(fondoId);
    const postreIdNormalizado = toPositiveInteger(postreId);
    const jugoIdNormalizado = toPositiveInteger(jugoId);
    const entradasNormalizadas = normalizeEntradasIds(entradasIds, entradaId);

    // 🔥 NUEVO: Definimos el tercer flujo
    const usingClassicFlow = Boolean(fondoIdNormalizado);
    const usingItemsFlow = Boolean(items && Array.isArray(items) && items.length > 0);
    const usingFindeFlow = Boolean(esFinDeSemana && tipoFinde);

    if (!usingClassicFlow && !usingItemsFlow && !usingFindeFlow) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, empresaId: true },
    });

    if (!usuario || !usuario.empresaId) {
      return NextResponse.json({ error: 'Usuario no válido o sin empresa' }, { status: 400 });
    }

    if (usingClassicFlow) {
      if (entradasNormalizadas.hasInvalidValue) {
        return NextResponse.json({ error: 'Una o mas entradas seleccionadas no son validas' }, { status: 400 });
      }

      if (postreId !== undefined && postreId !== null && !postreIdNormalizado) {
        return NextResponse.json({ error: 'El postre seleccionado no es valido' }, { status: 400 });
      }

      if (jugoId !== undefined && jugoId !== null && !jugoIdNormalizado) {
        return NextResponse.json({ error: 'El bebestible seleccionado no es valido' }, { status: 400 });
      }

      const idsAValidar = [
        ...entradasNormalizadas.ids,
        fondoIdNormalizado,
        postreIdNormalizado,
        jugoIdNormalizado,
      ].filter((id): id is number => Boolean(id));

      const platos = await db.plato.findMany({
        where: { id: { in: idsAValidar } },
        select: { id: true, categoria: true },
      });
      const categoriasPorId = new Map(platos.map((plato) => [plato.id, plato.categoria]));

      const entradaInvalida = entradasNormalizadas.ids.some((id) => categoriasPorId.get(id) !== 'ENTRADA');
      if (entradaInvalida) {
        return NextResponse.json({ error: 'Una o mas entradas seleccionadas no corresponden a la categoria ENTRADA' }, { status: 400 });
      }

      if (categoriasPorId.get(fondoIdNormalizado!) !== 'FONDO') {
        return NextResponse.json({ error: 'El fondo seleccionado no corresponde a la categoria FONDO' }, { status: 400 });
      }

      if (postreIdNormalizado && categoriasPorId.get(postreIdNormalizado) !== 'POSTRE') {
        return NextResponse.json({ error: 'El postre seleccionado no corresponde a la categoria POSTRE' }, { status: 400 });
      }

      if (jugoIdNormalizado) {
        const categoriaBebestible = categoriasPorId.get(jugoIdNormalizado);
        const categoriasBebestibleValidas = ['JUGO', 'BEBIDA', 'AGUA_SABORIZADA'];

        if (!categoriaBebestible || !categoriasBebestibleValidas.includes(categoriaBebestible)) {
          return NextResponse.json({ error: 'El bebestible seleccionado no corresponde a una categoria valida' }, { status: 400 });
        }
      }
    }

    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget = chileEndOfDay(targetIso);

    const pedidoExistente = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: {
          gte: inicioDiaTarget,
          lte: finDiaTarget,
        },
      },
    });

    // 🔥 ARMAMOS EL ARREGLO DE DETALLES DINÁMICAMENTE según el flujo usado
    let detallesData: DetallePedidoInput[] = [];

    // 🔥 NUEVO: Lógica interceptora para el fin de semana
    if (usingFindeFlow) {
      let nombreComodin = '';
      if (tipoFinde === 'MENU_DIA') nombreComodin = 'Menú del Día (Fin de Semana)';
      if (tipoFinde === 'HIPOCALORICO') nombreComodin = 'Hipocalórico (Fin de Semana)';
      if (tipoFinde === 'VEGETARIANO') nombreComodin = 'Vegetariano (Fin de Semana)';
      if (tipoFinde === 'COLACION') nombreComodin = 'Colación (Fin de Semana)';

      const platoComodin = await db.plato.findUnique({
        where: { nombre: nombreComodin }
      });

      if (!platoComodin) {
        return NextResponse.json({ error: `Falta crear el plato comodín en la base de datos: ${nombreComodin}` }, { status: 400 });
      }

      detallesData = [{ platoId: platoComodin.id, cantidad: 1 }];

    } else if (usingClassicFlow) {
      // 1. Agregamos las entradas SOLO si existen y no están vacías
      if (entradasNormalizadas.ids.length > 0) {
        detallesData.push(...entradasNormalizadas.ids.map((id) => ({ platoId: id })));
      }
      
      // 2. Siempre agregamos el fondo (ya validamos que existe)
      if (fondoIdNormalizado) {
        detallesData.push({ platoId: fondoIdNormalizado, guarnicionId: guarnicionId ?? null });
      }

      // 3. Agregamos el postre SOLO si existe
      if (postreIdNormalizado) {
        detallesData.push({ platoId: postreIdNormalizado });
      }

      // 4. Siempre agregamos el Jugo/Bebida
      if (jugoIdNormalizado) {
        detallesData.push({ platoId: jugoIdNormalizado });
      }
    } else if (usingItemsFlow && items) {
      detallesData = items.map(it => ({ platoId: it.platoId, guarnicionId: it.guarnicionId ?? null, cantidad: it.cantidad ?? 1 }));
    }

    if (pedidoExistente) {
      await db.$transaction(async (tx) => {
        // Borramos los detalles antiguos
        await tx.detallePedido.deleteMany({ where: { pedidoId: pedidoExistente.id } });
        
        // Creamos los nuevos detalles mapeando el id del pedido
        await tx.detallePedido.createMany({
          data: detallesData.map(detalle => ({
            pedidoId: pedidoExistente.id,
            ...detalle
          })),
        });
      });

      return NextResponse.json({ mensaje: 'Pedido actualizado', pedidoId: pedidoExistente.id });
    }

    const nuevoPedido = await db.pedido.create({
      data: {
        fecha: inicioDiaTarget,
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        estado: 'PENDIENTE',
        detalles: {
          // Prisma usa 'create' con un arreglo directamente
          create: detallesData,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ mensaje: 'Creado exitosamente', pedidoId: nuevoPedido.id }, { status: 201 });
  } catch (error) {
    console.error('[API PEDIDOS] Error al crear/actualizar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');
    const fecha = searchParams.get('fecha');

    if (!usuarioId) {
      return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });
    }

    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget = chileEndOfDay(targetIso);

    const pedidoParaEliminar = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: {
          gte: inicioDiaTarget,
          lte: finDiaTarget,
        },
      },
    });

    if (!pedidoParaEliminar) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.detallePedido.deleteMany({ where: { pedidoId: pedidoParaEliminar.id } });
      await tx.pedido.delete({ where: { id: pedidoParaEliminar.id } });
    });

    return NextResponse.json({ mensaje: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('[API PEDIDOS] Error al eliminar pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}