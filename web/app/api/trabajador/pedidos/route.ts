import { NextResponse } from 'next/server';
import { CategoriaPlato, EstadoPedido, Prisma, Rol, VarianteMenu } from '@prisma/client';
import db from '../../../../lib/db';
import { chileEndOfDay, chileStartOfDay, nowChile } from '../../../../lib/chile-time';
import { getHorarioEmpresa } from '../../../../lib/horario-pedidos-server';
import { verificarTokenTrabajador } from '../../../../lib/trabajador/verificar-token';

export const dynamic = 'force-dynamic';

const NOMBRE_POR_TIPO: Record<string, string> = {
  MENU_DIA: 'Menú del Día',
  HIPOCALORICO: 'Hipocalórico',
  VEGETARIANO: 'Vegetariano',
  COLACION: 'Colación',
};

const TIPO_POR_NOMBRE: Record<string, string> = Object.fromEntries(
  Object.entries(NOMBRE_POR_TIPO).map(([tipo, nombre]) => [nombre, tipo]),
);

const CATEGORIAS_BEBESTIBLE = new Set<CategoriaPlato>([
  CategoriaPlato.JUGO,
  CategoriaPlato.BEBIDA,
  CategoriaPlato.AGUA_SABORIZADA,
]);

const pedidoConDetalles = {
  detalles: { include: { plato: true, guarnicion: true } },
} satisfies Prisma.PedidoInclude;

type PedidoConDetalles = Prisma.PedidoGetPayload<{ include: typeof pedidoConDetalles }>;

type DetallePedidoInput = {
  platoId: number;
  guarnicionId?: number | null;
  cantidad?: number;
};

type PedidoRequestBody = {
  usuarioId?: string;
  entradaId?: number | string;
  entradasIds?: Array<number | string>;
  fondoId?: number | string;
  postreId?: number | string;
  postreCantidad?: number | string | null;
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

type CantidadPostre = { cantidad: number; hasInvalidValue: boolean };
type EntradasNormalizadas = { ids: number[]; hasInvalidValue: boolean };

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
}

function toPositiveInteger(value: unknown): number | null {
  const parsed = toInteger(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function normalizePostreCantidad(value: unknown): CantidadPostre {
  if (value === undefined) return { cantidad: 1, hasInvalidValue: false };
  const parsed = toInteger(value);
  if (parsed === 1 || parsed === 2) return { cantidad: parsed, hasInvalidValue: false };
  return { cantidad: 1, hasInvalidValue: true };
}

function normalizeEntradasIds(entradasIds: unknown, entradaId: unknown): EntradasNormalizadas {
  const ids: number[] = [];
  const seen = new Set<number>();
  let hasInvalidValue = false;

  const addEntrada = (value: unknown) => {
    const id = toPositiveInteger(value);
    if (!id) {
      hasInvalidValue = true;
      return;
    }
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };

  if (entradasIds !== undefined && entradasIds !== null) {
    if (!Array.isArray(entradasIds)) hasInvalidValue = true;
    else entradasIds.forEach(addEntrada);
  }

  if (entradaId !== undefined && entradaId !== null) addEntrada(entradaId);

  return { ids, hasInvalidValue };
}

function normalizeFechaPedido(fecha: string | null | undefined, fallbackIso: string): string {
  const trimmed = typeof fecha === 'string' ? fecha.trim() : '';
  if (!trimmed) return fallbackIso;
  const isoDate = trimmed.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : trimmed;
}

function rangoDia(fecha?: string) {
  return {
    inicio: chileStartOfDay(fecha),
    fin: chileEndOfDay(fecha),
  };
}

function whereDelDia(usuarioId: string, fecha: string | undefined, esCena: boolean) {
  const { inicio, fin } = rangoDia(fecha);
  return {
    usuarioId,
    fecha: { gte: inicio, lte: fin },
    esCena,
  };
}

function nombreComodin(tipo: string | undefined) {
  return (tipo && NOMBRE_POR_TIPO[tipo]) || '';
}

async function autorizar(request: Request, usuarioId: string | null) {
  if (!usuarioId) return { response: jsonError('Falta usuarioId', 400) };

  const verificacion = await verificarTokenTrabajador(request, usuarioId);
  if ('error' in verificacion) {
    return { response: jsonError(verificacion.error, verificacion.status) };
  }

  return { usuarioId };
}

async function obtenerPermiteCenaUsuario(usuarioId: string) {
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      empresa: {
        select: {
          ConvenioEmpresa: { select: { permiteCena: true } },
        },
      },
    },
  });

  return Boolean(usuario?.empresa?.ConvenioEmpresa?.permiteCena);
}

function responderPedido(pedido: PedidoConDetalles) {
  const resumen = pedido.detalles.map((detalle) => ({
    platoId: detalle.platoId,
    nombre: detalle.plato.nombre,
    categoria: detalle.plato.categoria,
    cantidad: detalle.cantidad,
    guarnicionId: detalle.guarnicionId ?? null,
    guarnicionNombre: detalle.guarnicion?.nombre ?? null,
  }));
  const nombreFondo = resumen.find((item) => item.categoria === CategoriaPlato.FONDO)?.nombre;

  return NextResponse.json({
    existe: true,
    pedido: {
      id: pedido.id,
      fecha: pedido.fecha.toISOString(),
      estado: pedido.estado,
      resumen,
      tipoFinde: nombreFondo ? TIPO_POR_NOMBRE[nombreFondo] ?? null : null,
      esCena: pedido.esCena,
      tipoCena: pedido.tipoCena,
      observacion: pedido.observacion ?? null,
    },
  });
}

async function listarHistorial(usuarioId: string) {
  try {
    const permiteCena = await obtenerPermiteCenaUsuario(usuarioId);
    const pedidos = await db.pedido.findMany({
      where: {
        usuarioId,
        ...(permiteCena ? {} : { esCena: false }),
      },
      orderBy: { fecha: 'desc' },
      include: pedidoConDetalles,
    });
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('[API PEDIDOS] Error al obtener historial:', error);
    return jsonError('Error interno del servidor', 500);
  }
}

async function consultarPedidoDelDia(usuarioId: string, fecha: string | null, esCena: boolean) {
  try {
    const permiteCena = await obtenerPermiteCenaUsuario(usuarioId);
    if (esCena && !permiteCena) {
      return NextResponse.json({ existe: false, permiteCena: false });
    }

    const pedido = await db.pedido.findFirst({
      where: whereDelDia(usuarioId, fecha ?? undefined, esCena),
      include: pedidoConDetalles,
    });

    if (!pedido) return NextResponse.json({ existe: false });
    return responderPedido(pedido);
  } catch (error) {
    console.error('[API PEDIDOS] Error al verificar pedido:', error);
    return jsonError('Error interno del servidor', 500);
  }
}

async function validarFlujoClasico(input: {
  entradas: EntradasNormalizadas;
  fondoId: number;
  postreIdRaw: PedidoRequestBody['postreId'];
  postreId: number | null;
  postreCantidad: CantidadPostre;
  permitePostre: boolean;
  jugoIdRaw: PedidoRequestBody['jugoId'];
  jugoId: number | null;
}) {
  if (input.entradas.hasInvalidValue) return jsonError('Entradas seleccionadas no validas', 400);
  if (
    input.permitePostre &&
    input.postreIdRaw !== undefined &&
    input.postreIdRaw !== null &&
    !input.postreId
  ) {
    return jsonError('Postre seleccionado no valido', 400);
  }
  if (input.postreCantidad.hasInvalidValue) return jsonError('Cantidad de postre no valida', 400);
  if (input.jugoIdRaw !== undefined && input.jugoIdRaw !== null && !input.jugoId) {
    return jsonError('Bebestible seleccionado no valido', 400);
  }

  const ids = [...input.entradas.ids, input.fondoId, input.postreId, input.jugoId].filter(
    (id): id is number => Boolean(id),
  );
  const platos = await db.plato.findMany({
    where: { id: { in: ids } },
    select: { id: true, categoria: true, tipo: true },
  });
  const categoriasPorId = new Map(platos.map((plato) => [plato.id, plato.categoria]));
  const tiposPorId = new Map(platos.map((plato) => [plato.id, plato.tipo]));

  if (input.entradas.ids.some((id) => categoriasPorId.get(id) !== CategoriaPlato.ENTRADA)) {
    return jsonError('Entrada invalida', 400);
  }
  if (categoriasPorId.get(input.fondoId) !== CategoriaPlato.FONDO) return jsonError('Fondo invalido', 400);
  if (input.postreId && categoriasPorId.get(input.postreId) !== CategoriaPlato.POSTRE) {
    return jsonError('Postre invalido', 400);
  }
  if (input.jugoId) {
    const categoria = categoriasPorId.get(input.jugoId);
    if (!categoria || !CATEGORIAS_BEBESTIBLE.has(categoria)) return jsonError('Bebestible invalido', 400);
  }
  if (input.postreCantidad.cantidad === 2) {
    if (!input.postreId) return jsonError('Doble postre requiere postre seleccionado', 400);
    if (tiposPorId.get(input.fondoId) !== VarianteMenu.HIPOCALORICO) {
      return jsonError('Doble postre solo esta permitido para menu hipocalorico', 400);
    }
    if (input.entradas.ids.length > 0) return jsonError('Doble postre hipocalorico no permite entrada', 400);
  }

  return null;
}

async function armarDetalles(input: {
  usarFinde: boolean;
  esCena: boolean;
  tipoFinde?: string;
  tipoCena?: string;
  usarClasico: boolean;
  fondoId: number | null;
  entradasIds: number[];
  guarnicionId?: number | null;
  postreId: number | null;
  postreCantidad: number;
  jugoId: number | null;
  items?: DetallePedidoInput[];
}): Promise<{ detalles: DetallePedidoInput[] } | { response: NextResponse }> {
  if (input.usarFinde || input.esCena) {
    const nombre = nombreComodin(input.esCena ? input.tipoCena : input.tipoFinde);
    const plato = await db.plato.findUnique({ where: { nombre } });
    if (!plato) return { response: jsonError(`Falta crear plato comodín: ${nombre}`, 400) };
    return { detalles: [{ platoId: plato.id, cantidad: 1 }] };
  }

  if (input.usarClasico) {
    const detalles: DetallePedidoInput[] = input.entradasIds.map((platoId) => ({ platoId }));
    if (input.fondoId) {
      detalles.push({ platoId: input.fondoId, guarnicionId: input.guarnicionId ?? null });
    }
    if (input.postreId) detalles.push({ platoId: input.postreId, cantidad: input.postreCantidad });
    if (input.jugoId) detalles.push({ platoId: input.jugoId });
    return { detalles };
  }

  if (input.items?.length) {
    return {
      detalles: input.items.map((item) => ({
        platoId: item.platoId,
        guarnicionId: item.guarnicionId ?? null,
        cantidad: item.cantidad ?? 1,
      })),
    };
  }

  return { detalles: [] };
}

async function persistirPedido(input: {
  existente: { id: number; estado: EstadoPedido } | null;
  detalles: DetallePedidoInput[];
  observacion?: string | null;
  esCena: boolean;
  tipoCena?: string;
  usuarioId: string;
  empresaId: number;
  fecha: Date;
}) {
  const observacion = input.observacion?.trim() || null;
  const tipoCena = input.esCena ? input.tipoCena : null;

  if (input.existente) {
    if (input.existente.estado === EstadoPedido.EN_PRODUCCION) {
      return jsonError('El pedido ya está en producción y no puede modificarse.', 403);
    }

    const pedidoId = input.existente.id;
    await db.$transaction(async (tx) => {
      await tx.detallePedido.deleteMany({ where: { pedidoId } });
      await tx.detallePedido.createMany({
        data: input.detalles.map((detalle) => ({ pedidoId, ...detalle })),
      });
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { observacion, tipoCena },
      });
    });

    return NextResponse.json({ mensaje: 'Pedido actualizado', pedidoId });
  }

  const nuevoPedido = await db.pedido.create({
    data: {
      fecha: input.fecha,
      usuarioId: input.usuarioId,
      empresaId: input.empresaId,
      estado: EstadoPedido.PENDIENTE,
      observacion,
      esCena: input.esCena,
      tipoCena,
      detalles: { create: input.detalles },
    },
    select: { id: true },
  });

  return NextResponse.json(
    { mensaje: 'Creado exitosamente', pedidoId: nuevoPedido.id },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auth = await autorizar(request, searchParams.get('usuarioId'));
  if ('response' in auth) return auth.response;

  if (searchParams.get('historial') === 'true') return listarHistorial(auth.usuarioId);

  return consultarPedidoDelDia(
    auth.usuarioId,
    searchParams.get('fecha'),
    searchParams.get('esCena') === 'true',
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PedidoRequestBody;
    const auth = await autorizar(request, body.usuarioId ?? null);
    if ('response' in auth) return auth.response;

    const esCena = body.esCena === true;
    const fondoId = toPositiveInteger(body.fondoId);
    const postreId = toPositiveInteger(body.postreId);
    const postreCantidad = normalizePostreCantidad(body.postreCantidad);
    const jugoId = toPositiveInteger(body.jugoId);
    const entradas = normalizeEntradasIds(body.entradasIds, body.entradaId);
    const usarClasico = Boolean(fondoId);
    const usarItems = Array.isArray(body.items) && body.items.length > 0;
    const usarFinde = Boolean(body.esFinDeSemana && body.tipoFinde);

    if (!usarClasico && !usarItems && !usarFinde && !esCena) {
      return jsonError('Faltan datos obligatorios', 400);
    }

    const usuario = await db.usuario.findUnique({
      where: { id: auth.usuarioId },
      select: {
        id: true,
        empresaId: true,
        rol: true,
        empresa: {
          select: {
            ConvenioEmpresa: { select: { permiteCena: true, permitePostre: true } },
          },
        },
      },
    });

    if (!usuario?.empresaId) return jsonError('Usuario no válido o sin empresa', 400);

    const convenio = usuario.empresa?.ConvenioEmpresa;
    if (esCena && !convenio?.permiteCena) {
      return jsonError('La empresa no tiene habilitados pedidos de cena.', 403);
    }

    const permitePostre = convenio?.permitePostre ?? true;
    const postreIdEfectivo = permitePostre ? postreId : null;
    const postreCantidadEfectiva = permitePostre
      ? postreCantidad
      : { cantidad: 1, hasInvalidValue: false };
    const hoyChile = nowChile().iso;
    const targetIso = normalizeFechaPedido(body.fecha, hoyChile);

    if (targetIso < hoyChile) {
      return jsonError('FECHA_PASADA', 403, {
        mensaje: 'No puedes realizar pedidos para dias anteriores.',
      });
    }

    if (usuario.rol === Rol.TRABAJADOR && targetIso === hoyChile) {
      const horario = await getHorarioEmpresa(usuario.empresaId);
      if (!horario.permitido) {
        return jsonError('PEDIDO_FUERA_DE_HORARIO', 403, {
          horaLimite: horario.horaLimite,
          mensaje: horario.mensaje,
          horaReapertura: horario.horaReapertura,
        });
      }
    }

    if (usarClasico && !esCena && fondoId) {
      const invalido = await validarFlujoClasico({
        entradas,
        fondoId,
        postreIdRaw: body.postreId,
        postreId: postreIdEfectivo,
        postreCantidad: postreCantidadEfectiva,
        permitePostre,
        jugoIdRaw: body.jugoId,
        jugoId,
      });
      if (invalido) return invalido;
    }

    const { inicio, fin } = rangoDia(targetIso);
    const existente = await db.pedido.findFirst({
      where: {
        usuarioId: auth.usuarioId,
        fecha: { gte: inicio, lte: fin },
        esCena,
      },
    });

    const armado = await armarDetalles({
      usarFinde,
      esCena,
      tipoFinde: body.tipoFinde,
      tipoCena: body.tipoCena,
      usarClasico,
      fondoId,
      entradasIds: entradas.ids,
      guarnicionId: body.guarnicionId,
      postreId: postreIdEfectivo,
      postreCantidad: postreCantidadEfectiva.cantidad,
      jugoId,
      items: body.items,
    });
    if ('response' in armado) return armado.response;

    return persistirPedido({
      existente,
      detalles: armado.detalles,
      observacion: body.observacion,
      esCena,
      tipoCena: body.tipoCena,
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      fecha: inicio,
    });
  } catch (error) {
    console.error('[API PEDIDOS] Error al crear/actualizar:', error);
    return jsonError('Error interno del servidor', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const auth = await autorizar(request, searchParams.get('usuarioId'));
    if ('response' in auth) return auth.response;

    const pedido = await db.pedido.findFirst({
      where: whereDelDia(
        auth.usuarioId,
        searchParams.get('fecha') || undefined,
        searchParams.get('esCena') === 'true',
      ),
    });

    if (!pedido) return jsonError('Pedido no encontrado', 404);
    if (pedido.estado === EstadoPedido.EN_PRODUCCION) {
      return jsonError('El pedido ya está en producción y no puede eliminarse.', 403);
    }

    await db.$transaction(async (tx) => {
      await tx.detallePedido.deleteMany({ where: { pedidoId: pedido.id } });
      await tx.pedido.delete({ where: { id: pedido.id } });
    });

    return NextResponse.json({ mensaje: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('[API PEDIDOS] Error al eliminar pedido:', error);
    return jsonError('Error interno del servidor', 500);
  }
}
