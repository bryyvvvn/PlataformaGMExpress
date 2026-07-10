import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay, nowChile } from '../../../../lib/chile-time';
import { esPlatoUnicoPorLegumbre } from '../../../../lib/menu/es-plato-unico';

export const dynamic = 'force-dynamic';

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const HORAS_ANTES_DESPACHO = 3;
const MINUTOS_ANTES_DESPACHO = HORAS_ANTES_DESPACHO * 60;
const MINUTOS_DIA = 24 * 60;
const CRON_LOG_PREFIX = '[CRON AUTO-ASIGNAR]';

type MenuDiaSeleccionConDetalles = Prisma.MenuDiaSeleccionGetPayload<{
  include: {
    entradaDetalle: { include: { plato: true } };
    fondoDetalle: { include: { plato: true } };
    postreDetalle: { include: { plato: true } };
    bebidaPlato: true;
    entradasSeleccionadas: {
      include: {
        menuDetalle: { include: { plato: true } };
      };
    };
  };
}>;

type ConvenioAsignacion = {
  permitePlato: boolean;
  permiteEntrada: boolean;
  permitePostre: boolean;
  permiteJugo: boolean;
  permiteBebida: boolean;
  permiteAguaSaborizada: boolean;
  trabajaFinDeSemana: boolean;
};

type DetallePedidoData = {
  platoId: number;
  guarnicionId?: number | null;
  cantidad: number;
};

type ErrorAutoAsignacion = {
  usuarioId?: string;
  empresaId?: number;
  motivo: string;
};

type LockResult = {
  locked: boolean;
};

function normalizarHoraDespacho(horaDespacho: string | null | undefined) {
  const hora = horaDespacho?.trim();
  if (!hora || !HORA_REGEX.test(hora)) return null;
  return hora;
}

function horaAMinutos(hora: string) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function minutosAHora(minutos: number) {
  const minutosNormalizados = ((minutos % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  const horas = Math.floor(minutosNormalizados / 60);
  const mins = minutosNormalizados % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatearHora(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function horaCierrePorDespacho(horaDespacho: string) {
  return minutosAHora(horaAMinutos(horaDespacho) - MINUTOS_ANTES_DESPACHO);
}

function estaDentroDeVentanaAutoasignacion(horaActual: string, horaDespacho: string) {
  const minutosActual = horaAMinutos(horaActual);
  const minutosDespacho = horaAMinutos(horaDespacho);
  const minutosCierre = horaAMinutos(horaCierrePorDespacho(horaDespacho));

  if (minutosCierre <= minutosDespacho) {
    return minutosActual >= minutosCierre && minutosActual < minutosDespacho;
  }

  return minutosActual >= minutosCierre || minutosActual < minutosDespacho;
}

function bebidaPermitida(
  bebida: MenuDiaSeleccionConDetalles['bebidaPlato'],
  convenio: ConvenioAsignacion
) {
  if (!bebida) return false;
  if (bebida.categoria === 'JUGO') return convenio.permiteJugo;
  if (bebida.categoria === 'BEBIDA') return convenio.permiteBebida;
  if (bebida.categoria === 'AGUA_SABORIZADA') return convenio.permiteAguaSaborizada;
  return false;
}

function platoOmiteGuarnicion(plato: { nombre: string; tipo: string }) {
  return plato.tipo === 'PLATO_UNICO' || plato.tipo === 'HIPOCALORICO' || esPlatoUnicoPorLegumbre(plato.nombre);
}

function construirDetallesPedido(
  menuHoy: MenuDiaSeleccionConDetalles,
  convenio: ConvenioAsignacion
): DetallePedidoData[] {
  const detalles: DetallePedidoData[] = [];

  if (convenio.permiteEntrada) {
    if (menuHoy.entradasSeleccionadas.length > 0) {
      detalles.push(
        ...menuHoy.entradasSeleccionadas.map((entrada) => ({
          platoId: entrada.menuDetalle.platoId,
          cantidad: 1,
        }))
      );
    } else {
      detalles.push({ platoId: menuHoy.entradaDetalle.platoId, cantidad: 1 });
    }
  }

  if (convenio.permitePlato) {
    detalles.push({
      platoId: menuHoy.fondoDetalle.platoId,
      guarnicionId: platoOmiteGuarnicion(menuHoy.fondoDetalle.plato) ? null : menuHoy.guarnicionId ?? null,
      cantidad: 1,
    });
  }

  if (convenio.permitePostre) {
    detalles.push({ platoId: menuHoy.postreDetalle.platoId, cantidad: 1 });
  }

  if (bebidaPermitida(menuHoy.bebidaPlato, convenio) && menuHoy.bebidaPlatoId) {
    detalles.push({ platoId: menuHoy.bebidaPlatoId, cantidad: 1 });
  }

  return detalles;
}

const DIAS_CHILE: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sabado: 6,
  Domingo: 7,
};

function normalizarDiaSemana(dayName: string) {
  return dayName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function obtenerDiaSemanaChile(dayName: string) {
  return DIAS_CHILE[normalizarDiaSemana(dayName)] ?? 1;
}

function esFinDeSemanaNoHabilitado(dayName: string, convenio: ConvenioAsignacion) {
  const diaSemana = obtenerDiaSemanaChile(dayName);
  return diaSemana >= 6 && !convenio.trabajaFinDeSemana;
}

function respuestaBase(params: {
  ok: boolean;
  mensaje: string;
  fechaProcesada: string;
  horaActual: string;
  empresasEvaluadas?: number;
  empresasConHoraDespachoValida?: number;
  empresasProcesables?: number;
  empresasOmitidas?: number;
  trabajadoresEvaluados?: number;
  pedidosAutoasignados?: number;
  pedidosFallidos?: number;
  omitidosYaTenianPedido?: number;
  omitidosNoCorresponden?: number;
  errores?: ErrorAutoAsignacion[];
}) {
  return {
    ok: params.ok,
    success: params.ok,
    mensaje: params.mensaje,
    fechaProcesada: params.fechaProcesada,
    horaActual: params.horaActual,
    empresasEvaluadas: params.empresasEvaluadas ?? 0,
    empresasConHoraDespachoValida: params.empresasConHoraDespachoValida ?? 0,
    empresasProcesables: params.empresasProcesables ?? 0,
    empresasOmitidas: params.empresasOmitidas ?? 0,
    trabajadoresEvaluados: params.trabajadoresEvaluados ?? 0,
    pedidosAutoasignados: params.pedidosAutoasignados ?? 0,
    pedidosFallidos: params.pedidosFallidos ?? 0,
    omitidosYaTenianPedido: params.omitidosYaTenianPedido ?? 0,
    omitidosNoCorresponden: params.omitidosNoCorresponden ?? 0,
    errores: params.errores ?? [],
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret)) {
    return new NextResponse('Acceso denegado', { status: 401 });
  }

  const contextoChile = nowChile();
  const fechaProcesada = contextoChile.iso;
  const horaActual = formatearHora(contextoChile.hour, contextoChile.minute);

  try {
    const inicioDia = chileStartOfDay(fechaProcesada);
    const finDia = chileEndOfDay(fechaProcesada);
    const lockKey = `cron:auto-asignar:${fechaProcesada}`;

    console.log(`${CRON_LOG_PREFIX} Inicio`, {
      fechaProcesada,
      horaActual,
    });

    const resultado = await db.$transaction(
      async (tx) => {
        const [lock] = await tx.$queryRaw<LockResult[]>`
          SELECT pg_try_advisory_xact_lock(hashtext(${lockKey})::bigint) AS locked
        `;

        if (!lock?.locked) {
          console.log(`${CRON_LOG_PREFIX} Otra ejecucion ya esta en curso`, { fechaProcesada });
          return {
            lockAdquirido: false,
            menuEncontrado: true,
            empresasEvaluadas: 0,
            empresasConHoraDespachoValida: 0,
            empresasProcesables: 0,
            empresasOmitidas: 0,
            trabajadoresEvaluados: 0,
            pedidosAutoasignados: 0,
            pedidosFallidos: 0,
            omitidosYaTenianPedido: 0,
            omitidosNoCorresponden: 0,
            errores: [],
          };
        }

        const empresas = await tx.empresa.findMany({
          where: { estado: 'ACTIVA' },
          select: {
            id: true,
            nombre: true,
            horaDespacho: true,
            ConvenioEmpresa: {
              select: {
                permitePlato: true,
                permiteEntrada: true,
                permitePostre: true,
                permiteJugo: true,
                permiteBebida: true,
                permiteAguaSaborizada: true,
                trabajaFinDeSemana: true,
              },
            },
          },
        });

        const empresasConHoraDespachoValida = empresas
          .map((empresa) => ({
            ...empresa,
            horaDespachoNormalizada: normalizarHoraDespacho(empresa.horaDespacho),
          }))
          .filter((empresa) => empresa.horaDespachoNormalizada !== null);

        const empresasEnVentanaAutoasignacion = empresasConHoraDespachoValida.filter((empresa) =>
          estaDentroDeVentanaAutoasignacion(horaActual, empresa.horaDespachoNormalizada!)
        );
        const errores: ErrorAutoAsignacion[] = [];
        const empresasProcesables = empresasEnVentanaAutoasignacion.filter((empresa) => {
          if (empresa.ConvenioEmpresa) return true;
          errores.push({ empresaId: empresa.id, motivo: 'Empresa sin convenio configurado.' });
          return false;
        });
        const empresasOmitidas = empresas.length - empresasProcesables.length;
        const omitidosEmpresaNoCorresponde = empresasOmitidas;

        if (empresasProcesables.length === 0) {
          return {
            lockAdquirido: true,
            menuEncontrado: true,
            empresasEvaluadas: empresas.length,
            empresasConHoraDespachoValida: empresasConHoraDespachoValida.length,
            empresasProcesables: 0,
            empresasOmitidas,
            trabajadoresEvaluados: 0,
            pedidosAutoasignados: 0,
            pedidosFallidos: 0,
            omitidosYaTenianPedido: 0,
            omitidosNoCorresponden: omitidosEmpresaNoCorresponde,
            errores,
          };
        }

        const menuHoy = await tx.menuDiaSeleccion.findFirst({
          where: {
            fecha_dia: {
              gte: inicioDia,
              lte: finDia,
            },
          },
          orderBy: { actualizado_en: 'desc' },
          include: {
            entradaDetalle: { include: { plato: true } },
            fondoDetalle: { include: { plato: true } },
            postreDetalle: { include: { plato: true } },
            bebidaPlato: true,
            entradasSeleccionadas: {
              orderBy: [{ orden: 'asc' }, { id: 'asc' }],
              include: {
                menuDetalle: { include: { plato: true } },
              },
            },
          },
        });

        if (!menuHoy) {
          console.warn(`${CRON_LOG_PREFIX} Sin menu del dia configurado`, { fechaProcesada });
          return {
            lockAdquirido: true,
            menuEncontrado: false,
            empresasEvaluadas: empresas.length,
            empresasConHoraDespachoValida: empresasConHoraDespachoValida.length,
            empresasProcesables: empresasProcesables.length,
            empresasOmitidas,
            trabajadoresEvaluados: 0,
            pedidosAutoasignados: 0,
            pedidosFallidos: 0,
            omitidosYaTenianPedido: 0,
            omitidosNoCorresponden: omitidosEmpresaNoCorresponde,
            errores,
          };
        }

        const empresaIdsProcesables = empresasProcesables.map((empresa) => empresa.id);
        const convenioPorEmpresaId = new Map(
          empresasProcesables.map((empresa) => [empresa.id, empresa.ConvenioEmpresa])
        );
        const trabajadores = await tx.usuario.findMany({
          where: {
            rol: 'TRABAJADOR',
            empresaId: { in: empresaIdsProcesables },
          },
          select: {
            id: true,
            empresaId: true,
            diasBloqueados: true,
          },
        });

        let omitidosYaTenianPedido = 0;
        let omitidosNoCorresponden = omitidosEmpresaNoCorresponde;
        const trabajadoresIds = trabajadores.map((trabajador) => trabajador.id);
        const pedidosExistentes = trabajadoresIds.length > 0
          ? await tx.pedido.findMany({
              where: {
                usuarioId: { in: trabajadoresIds },
                fecha: { gte: inicioDia, lte: finDia },
                esCena: false,
              },
              select: { usuarioId: true },
            })
          : [];
        const usuariosConPedido = new Set(pedidosExistentes.map((pedido) => pedido.usuarioId));
        const asignaciones: Array<{
          usuarioId: string;
          empresaId: number;
          detallesData: DetallePedidoData[];
        }> = [];

        for (const trabajador of trabajadores) {
          if (!trabajador.empresaId) {
            omitidosNoCorresponden += 1;
            errores.push({ usuarioId: trabajador.id, motivo: 'Trabajador sin empresa asignada.' });
            continue;
          }

          const convenio = convenioPorEmpresaId.get(trabajador.empresaId);

          if (!convenio) {
            omitidosNoCorresponden += 1;
            errores.push({ usuarioId: trabajador.id, motivo: 'Empresa sin convenio configurado.' });
            continue;
          }

          if (esFinDeSemanaNoHabilitado(contextoChile.dayName, convenio)) {
            omitidosNoCorresponden += 1;
            continue;
          }

          const diaSemana = obtenerDiaSemanaChile(contextoChile.dayName);
          if (trabajador.diasBloqueados.includes(diaSemana)) {
            omitidosNoCorresponden += 1;
            continue;
          }

          if (usuariosConPedido.has(trabajador.id)) {
            omitidosYaTenianPedido += 1;
            continue;
          }

          const detallesData = construirDetallesPedido(menuHoy, convenio);

          if (detallesData.length === 0) {
            omitidosNoCorresponden += 1;
            errores.push({
              usuarioId: trabajador.id,
              motivo: 'El convenio no permite ningun item del menu del dia.',
            });
            continue;
          }

          asignaciones.push({
            usuarioId: trabajador.id,
            empresaId: trabajador.empresaId,
            detallesData,
          });
        }

        const pedidosCreados: Array<{ id: number; usuarioId: string }> = [];
        let pedidosFallidos = 0;

        for (const asignacion of asignaciones) {
          await tx.$executeRaw`SAVEPOINT sp_pedido`;
          try {
            const pedido = await tx.pedido.create({
              data: {
                fecha: inicioDia,
                usuarioId: asignacion.usuarioId,
                empresaId: asignacion.empresaId,
                estado: 'CONFIRMADO',
                esCena: false,
                detalles: {
                  create: asignacion.detallesData.map((detalle) => ({
                    platoId: detalle.platoId,
                    guarnicionId: detalle.guarnicionId ?? null,
                    cantidad: detalle.cantidad,
                  })),
                },
              },
              select: { id: true, usuarioId: true },
            });
            await tx.$executeRaw`RELEASE SAVEPOINT sp_pedido`;
            pedidosCreados.push(pedido);
          } catch (error) {
            await tx.$executeRaw`ROLLBACK TO SAVEPOINT sp_pedido`;
            pedidosFallidos += 1;
            errores.push({ usuarioId: asignacion.usuarioId, motivo: 'Error al crear el pedido.' });
            console.error(
              `${CRON_LOG_PREFIX} Fallo create pedido usuario=${asignacion.usuarioId} empresa=${asignacion.empresaId}:`,
              error instanceof Error ? error.message : error
            );
          }
        }

        return {
          lockAdquirido: true,
          menuEncontrado: true,
          empresasEvaluadas: empresas.length,
          empresasConHoraDespachoValida: empresasConHoraDespachoValida.length,
          empresasProcesables: empresasProcesables.length,
          empresasOmitidas,
          trabajadoresEvaluados: trabajadores.length,
          pedidosAutoasignados: pedidosCreados.length,
          pedidosFallidos,
          omitidosYaTenianPedido,
          omitidosNoCorresponden,
          errores,
        };
      },
      { maxWait: 5000, timeout: 30000 }
    );

    if (!resultado.lockAdquirido) {
      return NextResponse.json(
        respuestaBase({
          ok: true,
          mensaje: 'Otra ejecucion ya esta en curso.',
          fechaProcesada,
          horaActual,
        })
      );
    }

    if (!resultado.menuEncontrado) {
      return NextResponse.json(
        respuestaBase({
          ok: true,
          mensaje: 'No hay menu del dia configurado. No se autoasignaron pedidos.',
          fechaProcesada,
          horaActual,
          ...resultado,
        })
      );
    }

    console.log(`${CRON_LOG_PREFIX} Fin`, {
      fechaProcesada,
      horaActual,
      empresasEvaluadas: resultado.empresasEvaluadas,
      empresasConHoraDespachoValida: resultado.empresasConHoraDespachoValida,
      empresasProcesables: resultado.empresasProcesables,
      empresasOmitidas: resultado.empresasOmitidas,
      trabajadoresEvaluados: resultado.trabajadoresEvaluados,
      pedidosAutoasignados: resultado.pedidosAutoasignados,
      pedidosFallidos: resultado.pedidosFallidos,
      omitidosYaTenianPedido: resultado.omitidosYaTenianPedido,
      omitidosNoCorresponden: resultado.omitidosNoCorresponden,
      errores: resultado.errores.length,
    });

    return NextResponse.json(
      respuestaBase({
        ok: true,
        mensaje: `Autoasignacion por hora de despacho completada. Se asignaron ${resultado.pedidosAutoasignados} pedidos${resultado.pedidosFallidos > 0 ? `, ${resultado.pedidosFallidos} fallaron` : ''}.`,
        fechaProcesada,
        horaActual,
        ...resultado,
      })
    );
  } catch (error) {
    console.error(`${CRON_LOG_PREFIX} Error critico:`, error);
    const motivo = error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      respuestaBase({
        ok: false,
        mensaje: 'Error interno del servidor al ejecutar la autoasignacion por hora de despacho.',
        fechaProcesada,
        horaActual,
        errores: [{ motivo }],
      }),
      { status: 500 }
    );
  }
}
