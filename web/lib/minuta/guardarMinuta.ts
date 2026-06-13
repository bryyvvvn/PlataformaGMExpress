import type { CategoriaPlato, Prisma, VarianteMenu } from "@prisma/client";
import db from "@/lib/db";
import type { MinutaExcelParseada } from "./tipos";

async function upsertPlatoSeguro(
  tx: Prisma.TransactionClient,
  nombre: string,
  categoria: CategoriaPlato,
  variante: VarianteMenu
) {
  const existenteExacto = await tx.plato.findFirst({
    where: { nombre, tipo: variante },
  });

  if (existenteExacto) {
    return tx.plato.update({
      where: { id: existenteExacto.id },
      data: { categoria, tipo: variante },
    });
  }

  const colision = await tx.plato.findUnique({ where: { nombre } });
  const nombreFinal = colision ? `${nombre} [${variante}]` : nombre;

  return tx.plato.upsert({
    where: { nombre: nombreFinal },
    update: { categoria, tipo: variante },
    create: { nombre: nombreFinal, categoria, tipo: variante },
  });
}

export function buscarMenuSemanalExistente(fechaInicio: Date, fechaFin: Date) {
  return db.menuSemanal.findFirst({
    where: {
      fecha_inicio: { gte: new Date(fechaInicio.getTime() - 60000) },
      fecha_fin: { lte: new Date(fechaFin.getTime() + 60000) },
    },
  });
}

export async function guardarMinuta(minuta: MinutaExcelParseada) {
  await db.$transaction(
    async (tx) => {
      const menuSemanal = await tx.menuSemanal.create({
        data: { fecha_inicio: minuta.fechaInicio, fecha_fin: minuta.fechaFin },
      });

      for (const dia of minuta.dias) {
        const guarnicionesDelDiaIds: number[] = [];

        for (const nombreGuarnicion of dia.guarniciones) {
          const guarnicion = await tx.guarnicion.upsert({
            where: { nombre: nombreGuarnicion },
            update: {},
            create: { nombre: nombreGuarnicion },
          });
          guarnicionesDelDiaIds.push(guarnicion.id);
        }

        for (const platoMinuta of dia.platos) {
          const plato = await upsertPlatoSeguro(
            tx,
            platoMinuta.nombre,
            platoMinuta.categoria,
            platoMinuta.variante
          );

          await tx.menuDetalle.create({
            data: {
              dia_semana: dia.diaNombre,
              fecha_dia: dia.fecha,
              menuSemanalId: menuSemanal.id,
              platoId: plato.id,
              guarniciones:
                platoMinuta.categoria === "FONDO" && guarnicionesDelDiaIds.length > 0
                  ? { connect: guarnicionesDelDiaIds.map((id) => ({ id })) }
                  : undefined,
            },
          });
        }
      }
    },
    { maxWait: 15000, timeout: 60000 }
  );
}
