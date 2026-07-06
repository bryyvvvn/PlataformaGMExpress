import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import db from '../../../../lib/db';
import { chileStartOfDay, chileEndOfDay, nowChile } from '../../../../lib/chile-time';
import { esPlatoUnicoPorLegumbre } from '../../../../lib/menu/es-plato-unico';

export const dynamic = 'force-dynamic';

const HORA_LIMITE_DEFAULT = '10:00';
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const CRON_LOG_PREFIX = '[CRON AUTO-ASIGNAR-GLOBAL]';

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
  motivo: string;
};

function validarHoraLimite(horaLimite: string | null | undefined) {
  if (horaLimite && HORA_REGEX.test(horaLimite)) return horaLimite;
  console.warn(
    `${CRON_LOG_PREFIX} horaLimite invalida o no configurada; usando ${HORA_LIMITE_DEFAULT}.`,
    { horaLimite }
  );
  return HORA_LIMITE_DEFAULT;
}

function horaAMinutos(hora: string) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function formatearHora(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
  const permiteEntrada = convenio.permiteEntrada;
  const permitePlato = convenio.permitePlato;
  const permitePostre = convenio.permitePostre;

  if (permiteEntrada) {
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

  if (permitePlato) {
    detalles.push({
      platoId: menuHoy.fondoDetalle.platoId,
      guarnicionId: platoOmiteGuarnicion(menuHoy.fondoDetalle.plato) ? null : menuHoy.guarnicionId ?? null,
      cantidad: 1,
    });
  }

  if (permitePostre) {
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
  horaLimiteUsada: string;
  trabajadoresEvaluados?: number;
  pedidosAutoasignados?: number;
  omitidosYaTenianPedido?: number;
  omitidosNoCorresponden?: number;
  errores?: ErrorAutoAsignacion[];
}) {
  return {
    ok: params.ok,
    success: params.ok,
    mensaje: params.mensaje,
    fechaProcesada: params.fechaProcesada,
    horaLimiteUsada: params.horaLimiteUsada,
    trabajadoresEvaluados: params.trabajadoresEvaluados ?? 0,
    pedidosAutoasignados: params.pedidosAutoasignados ?? 0,
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
  let horaLimiteUsada = HORA_LIMITE_DEFAULT;

  try {
    const configuracion = await db.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { horaLimite: true },
    });

    horaLimiteUsada = validarHoraLimite(configuracion?.horaLimite);
    const horaActual = formatearHora(contextoChile.hour, contextoChile.minute);
    const limiteAlcanzado = horaAMinutos(horaActual) >= horaAMinutos(horaLimiteUsada);

    console.log(`${CRON_LOG_PREFIX} Inicio`, {
      fechaProcesada,
      horaActual,
      horaLimiteUsada,
      limiteAlcanzado,
    });

    if (!limiteAlcanzado) {
      return NextResponse.json(
        respuestaBase({
          ok: true,
          mensaje: 'La hora limite global aun no se cumple. No se autoasignaron pedidos.',
          fechaProcesada,
          horaLimiteUsada,
        })
      );
    }

    const inicioDia = chileStartOfDay(fechaProcesada);
    const finDia = chileEndOfDay(fechaProcesada);

    const lockKey = `cron:auto-asignar-global:${fechaProcesada}`;

    const resultado = await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;

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
            menuEncontrado: false,
            trabajadoresEvaluados: 0,
            pedidosAutoasignados: 0,
            omitidosYaTenianPedido: 0,
            omitidosNoCorresponden: 0,
            errores: [],
          };
        }

        const trabajadores = await tx.usuario.findMany({
          where: {
            rol: 'TRABAJADOR',
            empresaId: { not: null },
            empresa: { is: { estado: 'ACTIVA' } },
          },
          select: {
            id: true,
            empresaId: true,
            diasBloqueados: true,
            empresa: {
              select: {
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
            },
          },
        });

        let pedidosAutoasignados = 0;
        let omitidosYaTenianPedido = 0;
        let omitidosNoCorresponden = 0;
        const errores: ErrorAutoAsignacion[] = [];

        for (const trabajador of trabajadores) {
          const convenio = trabajador.empresa?.ConvenioEmpresa;

          if (!trabajador.empresaId) {
            omitidosNoCorresponden += 1;
            errores.push({ usuarioId: trabajador.id, motivo: 'Trabajador sin empresa asignada.' });
            continue;
          }

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

          const pedidoExistente = await tx.pedido.findFirst({
            where: {
              usuarioId: trabajador.id,
              fecha: { gte: inicioDia, lte: finDia },
              esCena: false,
            },
            select: { id: true },
          });

          if (pedidoExistente) {
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

          await tx.pedido.create({
            data: {
              fecha: inicioDia,
              usuarioId: trabajador.id,
              empresaId: trabajador.empresaId,
              estado: 'CONFIRMADO',
              esCena: false,
              detalles: { create: detallesData },
            },
          });

          pedidosAutoasignados += 1;
        }

        return {
          menuEncontrado: true,
          trabajadoresEvaluados: trabajadores.length,
          pedidosAutoasignados,
          omitidosYaTenianPedido,
          omitidosNoCorresponden,
          errores,
        };
      },
      { maxWait: 10000, timeout: 120000 }
    );

    if (!resultado.menuEncontrado) {
      return NextResponse.json(
        respuestaBase({
          ok: true,
          mensaje: 'No hay menu del dia configurado. No se autoasignaron pedidos.',
          fechaProcesada,
          horaLimiteUsada,
        })
      );
    }

    console.log(`${CRON_LOG_PREFIX} Fin`, {
      fechaProcesada,
      horaLimiteUsada,
      trabajadoresEvaluados: resultado.trabajadoresEvaluados,
      pedidosAutoasignados: resultado.pedidosAutoasignados,
      omitidosYaTenianPedido: resultado.omitidosYaTenianPedido,
      omitidosNoCorresponden: resultado.omitidosNoCorresponden,
      errores: resultado.errores.length,
    });

    return NextResponse.json(
      respuestaBase({
        ok: true,
        mensaje: `Autoasignacion global completada. Se asignaron ${resultado.pedidosAutoasignados} pedidos.`,
        fechaProcesada,
        horaLimiteUsada,
        ...resultado,
      })
    );
  } catch (error) {
    console.error(`${CRON_LOG_PREFIX} Error critico:`, error);
    const motivo = error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      respuestaBase({
        ok: false,
        mensaje: 'Error interno del servidor al ejecutar la autoasignacion global.',
        fechaProcesada,
        horaLimiteUsada,
        errores: [{ motivo }],
      }),
      { status: 500 }
    );
  }
}
