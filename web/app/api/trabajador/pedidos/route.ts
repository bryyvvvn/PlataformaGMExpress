import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay } from '../../../../lib/chile-time';
import { getHorarioEmpresa } from '../../../../lib/horario-pedidos-server';

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
  esFinDeSemana?: boolean;
  tipoFinde?: string;
  esCena?: boolean;
  tipoCena?: string;
  observacion?: string | null;
};

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
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
    if (!id) { hasInvalidValue = true; return; }
    if (!seen.has(id)) { seen.add(id); normalized.push(id); }
  };

  if (entradasIds !== undefined && entradasIds !== null) {
    if (!Array.isArray(entradasIds)) hasInvalidValue = true;
    else entradasIds.forEach(addEntrada);
  }

  if (entradaId !== undefined && entradaId !== null) addEntrada(entradaId);

  return { ids: normalized, hasInvalidValue };
}

async function obtenerPermiteCenaUsuario(usuarioId: string) {
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      empresa: {
        select: {
          ConvenioEmpresa: {
            select: { permiteCena: true },
          },
        },
      },
    },
  });

  return Boolean(usuario?.empresa?.ConvenioEmpresa?.permiteCena);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuarioId');

  if (!usuarioId) return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });

  if (searchParams.get('historial') === 'true') {
    try {
      const permiteCena = await obtenerPermiteCenaUsuario(usuarioId);
      const pedidos = await db.pedido.findMany({
        where: {
          usuarioId,
          ...(permiteCena ? {} : { esCena: false }),
        },
        orderBy: { fecha: 'desc' },
        include: { detalles: { include: { plato: true, guarnicion: true } } }
      });
      return NextResponse.json(pedidos);
    } catch (error) {
      console.error('[API PEDIDOS] Error al obtener historial:', error);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  }

  try {
    const fechaParam = searchParams.get('fecha');
    const esCenaQuery = searchParams.get('esCena') === 'true'; // 🔥 Permitimos consultar específicamente por cena o almuerzo
    
    const permiteCena = await obtenerPermiteCenaUsuario(usuarioId);

    if (esCenaQuery && !permiteCena) {
      return NextResponse.json({ existe: false, permiteCena: false });
    }

    const inicioDia = chileStartOfDay(fechaParam ?? undefined);
    const finDia = chileEndOfDay(fechaParam ?? undefined);

    // 🔥 MODIFICADO: Buscamos un pedido en ese rango de fecha, pero que coincida con el tipo (Almuerzo o Cena)
    const pedidoExistente = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: { gte: inicioDia, lte: finDia },
        esCena: esCenaQuery // Buscamos almuerzo (false) o cena (true)
      },
      include: {
        detalles: { include: { plato: true, guarnicion: true } }
      }
    });

    if (!pedidoExistente) return NextResponse.json({ existe: false });

    const resumen = pedidoExistente.detalles.map(d => ({
      platoId: d.platoId,
      nombre: d.plato.nombre,
      categoria: d.plato.categoria,
      guarnicionId: d.guarnicionId ?? null,
      guarnicionNombre: d.guarnicion?.nombre ?? null,
    }));

    let tipoFinde = null;
    const nombreFondo = resumen.find(r => r.categoria === 'FONDO')?.nombre;
    if (nombreFondo === 'Menú del Día') tipoFinde = 'MENU_DIA';
    if (nombreFondo === 'Hipocalórico') tipoFinde = 'HIPOCALORICO';
    if (nombreFondo === 'Vegetariano') tipoFinde = 'VEGETARIANO';
    if (nombreFondo === 'Colación') tipoFinde = 'COLACION';

    return NextResponse.json({
      existe: true,
      pedido: {
        id: pedidoExistente.id,
        fecha: pedidoExistente.fecha.toISOString(),
        resumen,
        tipoFinde,
        esCena: pedidoExistente.esCena,     // 🔥 Devuelve si es cena
        tipoCena: pedidoExistente.tipoCena, // 🔥 Devuelve qué tipo de cena es
        observacion: pedidoExistente.observacion ?? null
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
    const { usuarioId, entradaId, entradasIds, fondoId, postreId, jugoId, guarnicionId, fecha, items, esFinDeSemana, tipoFinde, esCena, tipoCena, observacion } = body;

    if (!usuarioId) return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });

    const isCenaFlow = Boolean(esCena === true); // 🔥 Determinamos si estamos guardando una cena

    const fondoIdNormalizado = toPositiveInteger(fondoId);
    const postreIdNormalizado = toPositiveInteger(postreId);
    const jugoIdNormalizado = toPositiveInteger(jugoId);
    const entradasNormalizadas = normalizeEntradasIds(entradasIds, entradaId);

    const usingClassicFlow = Boolean(fondoIdNormalizado);
    const usingItemsFlow = Boolean(items && Array.isArray(items) && items.length > 0);
    const usingFindeFlow = Boolean(esFinDeSemana && tipoFinde);

    // Permitimos que pase si es flujo clásico, items, finde, o CENA
    if (!usingClassicFlow && !usingItemsFlow && !usingFindeFlow && !isCenaFlow) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        empresaId: true,
        rol: true,
        empresa: {
          select: {
            ConvenioEmpresa: {
              select: { permiteCena: true },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.empresaId) return NextResponse.json({ error: 'Usuario no válido o sin empresa' }, { status: 400 });

    if (isCenaFlow && !Boolean(usuario.empresa?.ConvenioEmpresa?.permiteCena)) {
      return NextResponse.json(
        { error: 'La empresa no tiene habilitados pedidos de cena.' },
        { status: 403 }
      );
    }

    if (usuario.rol === 'TRABAJADOR') {
      const estadoHorario = await getHorarioEmpresa(usuario.empresaId);
      if (!estadoHorario.permitido) {
        return NextResponse.json({
          error: 'PEDIDO_FUERA_DE_HORARIO',
          horaLimite: estadoHorario.horaLimite,
          mensaje: estadoHorario.mensaje,
          horaReapertura: estadoHorario.horaReapertura,
        }, { status: 403 });
      }
    }

    if (usingClassicFlow && !isCenaFlow) {
      if (entradasNormalizadas.hasInvalidValue) return NextResponse.json({ error: 'Entradas seleccionadas no validas' }, { status: 400 });
      if (postreId !== undefined && postreId !== null && !postreIdNormalizado) return NextResponse.json({ error: 'Postre seleccionado no valido' }, { status: 400 });
      if (jugoId !== undefined && jugoId !== null && !jugoIdNormalizado) return NextResponse.json({ error: 'Bebestible seleccionado no valido' }, { status: 400 });

      const idsAValidar = [...entradasNormalizadas.ids, fondoIdNormalizado, postreIdNormalizado, jugoIdNormalizado].filter((id): id is number => Boolean(id));
      const platos = await db.plato.findMany({ where: { id: { in: idsAValidar } }, select: { id: true, categoria: true } });
      const categoriasPorId = new Map(platos.map((plato) => [plato.id, plato.categoria]));

      if (entradasNormalizadas.ids.some((id) => categoriasPorId.get(id) !== 'ENTRADA')) return NextResponse.json({ error: 'Entrada invalida' }, { status: 400 });
      if (categoriasPorId.get(fondoIdNormalizado!) !== 'FONDO') return NextResponse.json({ error: 'Fondo invalido' }, { status: 400 });
      if (postreIdNormalizado && categoriasPorId.get(postreIdNormalizado) !== 'POSTRE') return NextResponse.json({ error: 'Postre invalido' }, { status: 400 });
      if (jugoIdNormalizado && !['JUGO', 'BEBIDA', 'AGUA_SABORIZADA'].includes(categoriasPorId.get(jugoIdNormalizado) || '')) return NextResponse.json({ error: 'Bebestible invalido' }, { status: 400 });
    }

    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget = chileEndOfDay(targetIso);

    // 🔥 BUSCAMOS EL PEDIDO EXISTENTE, PERO SEPARANDO ALMUERZO DE CENA
    const pedidoExistente = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: { gte: inicioDiaTarget, lte: finDiaTarget },
        esCena: isCenaFlow // Si guardo cena, busco si ya tiene cena. Si guardo almuerzo, busco almuerzo.
      },
    });

    let detallesData: DetallePedidoInput[] = [];

    // 🔥 LÓGICA DE DETALLES PARA CENA Y FINDE (Usan los mismos platos comodín)
    if (usingFindeFlow || isCenaFlow) {
      let nombreComodin = '';
      const tipo = isCenaFlow ? tipoCena : tipoFinde; // Usamos el tipo que corresponda
      
      if (tipo === 'MENU_DIA') nombreComodin = 'Menú del Día';
      if (tipo === 'HIPOCALORICO') nombreComodin = 'Hipocalórico';
      if (tipo === 'VEGETARIANO') nombreComodin = 'Vegetariano';
      if (tipo === 'COLACION') nombreComodin = 'Colación';

      const platoComodin = await db.plato.findUnique({ where: { nombre: nombreComodin } });
      if (!platoComodin) return NextResponse.json({ error: `Falta crear plato comodín: ${nombreComodin}` }, { status: 400 });
      
      detallesData = [{ platoId: platoComodin.id, cantidad: 1 }];

    } else if (usingClassicFlow) {
      if (entradasNormalizadas.ids.length > 0) detallesData.push(...entradasNormalizadas.ids.map((id) => ({ platoId: id })));
      if (fondoIdNormalizado) detallesData.push({ platoId: fondoIdNormalizado, guarnicionId: guarnicionId ?? null });
      if (postreIdNormalizado) detallesData.push({ platoId: postreIdNormalizado });
      if (jugoIdNormalizado) detallesData.push({ platoId: jugoIdNormalizado });
    } else if (usingItemsFlow && items) {
      detallesData = items.map(it => ({ platoId: it.platoId, guarnicionId: it.guarnicionId ?? null, cantidad: it.cantidad ?? 1 }));
    }

    // SI YA EXISTE, LO ACTUALIZAMOS
    if (pedidoExistente) {
      await db.$transaction(async (tx) => {
        await tx.detallePedido.deleteMany({ where: { pedidoId: pedidoExistente.id } });
        await tx.detallePedido.createMany({
          data: detallesData.map(detalle => ({ pedidoId: pedidoExistente.id, ...detalle })),
        });
        await tx.pedido.update({
          where: { id: pedidoExistente.id },
          data: { 
            observacion: observacion?.trim() || null,
            tipoCena: isCenaFlow ? tipoCena : null // Si actualizamos, guardamos el tipo
          }
        });
      });
      return NextResponse.json({ mensaje: 'Pedido actualizado', pedidoId: pedidoExistente.id });
    }

    // SI NO EXISTE, LO CREAMOS
    const nuevoPedido = await db.pedido.create({
      data: {
        fecha: inicioDiaTarget,
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        estado: 'PENDIENTE',
        observacion: observacion?.trim() || null,
        esCena: isCenaFlow, // 🔥 Guardamos el estado
        tipoCena: isCenaFlow ? tipoCena : null, // 🔥 Guardamos el tipo de cena
        detalles: { create: detallesData },
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
    const esCenaQuery = searchParams.get('esCena') === 'true'; // 🔥 Sabemos qué borrar

    if (!usuarioId) return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });

    const targetIso = fecha && typeof fecha === 'string' ? fecha : undefined;
    const inicioDiaTarget = chileStartOfDay(targetIso);
    const finDiaTarget = chileEndOfDay(targetIso);

    // 🔥 MODIFICADO: Borramos estrictamente el almuerzo O la cena
    const pedidoParaEliminar = await db.pedido.findFirst({
      where: {
        usuarioId,
        fecha: { gte: inicioDiaTarget, lte: finDiaTarget },
        esCena: esCenaQuery // Buscamos con precisión
      },
    });

    if (!pedidoParaEliminar) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

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
