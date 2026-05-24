import { PrismaClient } from '@prisma/client';
import { deleteMenuWeeksByRange } from '../lib/menu-week';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: ts-node delete-week.ts <fecha_iso_1> [fecha_iso_2]');
    process.exit(1);
  }

  const fecha1 = args[0];
  const fecha2 = args[1] ?? args[0];

  const inicio = new Date(`${fecha1}T00:00:00Z`);
  const fin = new Date(`${fecha2}T23:59:59Z`);

  console.log(`Deleting MenuSemanal overlapping ${inicio.toISOString()} - ${fin.toISOString()}`);

  const res = await deleteMenuWeeksByRange(inicio, fin, prisma);

  console.log(`Deleted ${res.deleted} MenuSemanal records.`);
  if (res.blocked > 0) {
    console.log(`Blocked ${res.blocked} week(s) because ${res.pedidos} pedido(s) exist in the selected range.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
