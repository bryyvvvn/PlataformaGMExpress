import { PrismaClient, CategoriaPlato, VarianteMenu } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INICIANDO SEED: Limpiando datos previos ---');
  // Borramos en orden para evitar errores de llaves foráneas
  await prisma.menuDetalle.deleteMany({});
  await prisma.menuSemanal.deleteMany({});
  await prisma.plato.deleteMany({});

  const defaultImg = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400"; //Imagen genérica 

  // 1. Catálogo de Platos con Imágenes Variadas
  const platosVeganos = [
    { nombre: "BERENJENAS ROBOZADAS", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "BOCADOS DE ARVEJAS CON CEBOLLA CARAMELIZADA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "BUDINES", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "CEVICHE DE POROTOS", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "CHAPSUI DE VERDURAS CON PROTEÍNA DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "CHARQUICÁN CON PROTEÍNA DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "CHORILLANA VEGANA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "CHORILLANA VEGETARIANA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "ENSALADA DE LEGUMBRES", cat: CategoriaPlato.ENSALADA, img: defaultImg },
    { nombre: "ESTOFADO CON CARNE DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "FALAFEL", cat: CategoriaPlato.ALMUERZO, img: "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?q=80&w=400" },
    { nombre: "FEIJOADA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "GARBANZOS A LA PARMESANA O LENTEJAS CON QUESO RALLADO", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "GUISO DE REPOLLO CON PROTEINA DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "GUISO REPOLLO SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "GUISO REPOLLO SOYA Y HUEVO", cat: CategoriaPlato.ALMUERZO, img: defaultImg }, // Nota: El huevo lo hace vegetariano, no vegano estricto
    { nombre: "HAMBURGUESA DE LEGUMBRES", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "HAMBURGUESA DE LEGUMBRES ATOMATADA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "HAMBURGUESA DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "HAMBURGUESAS DE LEGUMBRES EN SALSA BBQ", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "HUMMUS", cat: CategoriaPlato.ENSALADA, img: "https://images.unsplash.com/photo-1577906036458-04c84f2229c5?q=80&w=400" },
    { nombre: "JULIANAS DE CHORIZO VEGANO CON CEBOLLA CARAMELIZADA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "LASAÑA CON PROTEÍNA DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "LASAÑA DE VERDURAS", cat: CategoriaPlato.ALMUERZO, img: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?q=80&w=400" },
    { nombre: "LEGUMBRES A LA JARDINERA (LENTEJAS, POROTOS O GARBANZOS)", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "LEGUMBRES GUISADAS (GARBANZOS, LENTEJAS O ARVEJAS)", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "NUGGETS DE VERDURAS", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "OMELETTE CHOCLO/QUESO", cat: CategoriaPlato.ALMUERZO, img: defaultImg }, // Nota: Queso/Huevo es vegetariano
    { nombre: "OMELETTE TOMATE/ACEITUNA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "PASTEL DE ACELGA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "PASTEL DE ZAPALLO ITALIANO", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "PASTEL DE ZAPALLO ITALIANO VEGANO", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "POROTOS CON MOTE", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "POROTOS CON RIENDAS", cat: CategoriaPlato.ALMUERZO, img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=400" },
    { nombre: "PROTEÍNA DE SOYA GUISADA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "SALSA BOLOÑESA DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "SALSA PUTANESCA CON PROTEÍNA DE SOYA", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "SALTEADO DE VERDURAS CON POROTOS NEGROS", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "TORTILLA DE VERDURAS", cat: CategoriaPlato.ALMUERZO, img: defaultImg },
    { nombre: "ZAPALLO ITALIANO RELLENO", cat: CategoriaPlato.ALMUERZO, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=400" }
  ];

  console.log('--- PASO 1: Creando platos en Neon ---');
  const platosCreados = [];
  for (const p of platosVeganos) {
    const nuevoPlato = await prisma.plato.create({
      data: {
        nombre: p.nombre,
        categoria: p.cat,
        url_imagen: p.img
      },
    });
    platosCreados.push(nuevoPlato);
  }

  console.log('--- PASO 2: Creando la semana actual (Mayo 2026) ---');
  const semana = await prisma.menuSemanal.create({
    data: {
      fecha_inicio: new Date('2026-05-04'), // Hoy Lunes
      fecha_fin: new Date('2026-05-10'),    // Domingo
    }
  });

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  console.log('--- PASO 3: Vinculando platos a los días ---');
  for (let i = 0; i < dias.length; i++) {
    await prisma.menuDetalle.create({
      data: {
        dia_semana: dias[i],
        variante: VarianteMenu.VEGANO,
        menuSemanalId: semana.id,
        platoId: platosCreados[i].id
      }
    });
  }

  console.log('¡SEED COMPLETADO! Platos cargados y planificación lista.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });