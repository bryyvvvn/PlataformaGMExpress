import db from "./db";
import { chileEndOfDay, chileStartOfDay } from "./chile-time";
import { Prisma, type PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | typeof db;

function formatIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function toChileRange(fechaInicio: Date, fechaFin: Date) {
  return {
    inicio: chileStartOfDay(formatIsoDate(fechaInicio)),
    fin: chileEndOfDay(formatIsoDate(fechaFin)),
  };
}

export async function listMenuWeeks(client: DbClient = db) {
  const semanas = await client.menuSemanal.findMany({
    orderBy: { fecha_inicio: "desc" },
    include: {
      _count: {
        select: {
          detalles: true,
          menuDiaSelecciones: true,
        },
      },
    },
  });

  const rangos = semanas.map((semana) => ({
    id: semana.id,
    ...toChileRange(semana.fecha_inicio, semana.fecha_fin),
  }));
  const pedidosMap = new Map(semanas.map((semana) => [semana.id, 0]));

  if (rangos.length > 0) {
    const pedidosPorSemana = await client.$queryRaw<
      Array<{ id: number; pedidos: number }>
    >(Prisma.sql`
      SELECT semana.id::integer AS id, COUNT(p.id)::integer AS pedidos
      FROM (
        VALUES ${Prisma.join(
          rangos.map((rango) =>
            Prisma.sql`(${rango.id}, ${rango.inicio}, ${rango.fin})`
          )
        )}
      ) AS semana(id, inicio, fin)
      LEFT JOIN "Pedido" p
        ON p.fecha >= semana.inicio
        AND p.fecha <= semana.fin
      GROUP BY semana.id
    `);

    for (const { id, pedidos } of pedidosPorSemana) {
      pedidosMap.set(id, pedidos);
    }
  }

  return semanas.map((semana) => ({
    id: semana.id,
    fecha_inicio: formatIsoDate(semana.fecha_inicio),
    fecha_fin: formatIsoDate(semana.fecha_fin),
    creado_en: semana.creado_en.toISOString(),
    detalles: semana._count.detalles,
    seleccionesMenuDia: semana._count.menuDiaSelecciones,
    pedidos: pedidosMap.get(semana.id) ?? 0,
  }));
}

export async function deleteMenuWeek(menuSemanalId: number, client: DbClient = db) {
  const semana = await client.menuSemanal.findUnique({
    where: { id: menuSemanalId },
    select: {
      id: true,
      fecha_inicio: true,
      fecha_fin: true,
    },
  });

  if (!semana) {
    return { deleted: 0, blocked: false, pedidos: 0 };
  }

  const { inicio, fin } = toChileRange(semana.fecha_inicio, semana.fecha_fin);
  const pedidos = await client.pedido.count({
    where: {
      fecha: {
        gte: inicio,
        lte: fin,
      },
    },
  });

  if (pedidos > 0) {
    return { deleted: 0, blocked: true, pedidos };
  }

  await client.$transaction(async (tx) => {
    await tx.menuDiaSeleccion.deleteMany({ where: { menuSemanalId } });
    await tx.menuSemanal.delete({ where: { id: menuSemanalId } });
  });

  return { deleted: 1, blocked: false, pedidos: 0 };
}

export async function deleteMenuWeeksByRange(inicio: Date, fin: Date, client: DbClient = db) {
  const semanas = await client.menuSemanal.findMany({
    where: {
      AND: [
        { fecha_inicio: { lte: fin } },
        { fecha_fin: { gte: inicio } },
      ],
    },
    select: { id: true },
  });

  let deleted = 0;
  let blocked = 0;
  let pedidos = 0;

  for (const semana of semanas) {
    const result = await deleteMenuWeek(semana.id, client);
    deleted += result.deleted;
    blocked += result.blocked ? 1 : 0;
    pedidos += result.pedidos;
  }

  return { deleted, blocked, pedidos };
}
