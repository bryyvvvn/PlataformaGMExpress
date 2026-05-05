import { PrismaClient, CategoriaPlato, VarianteMenu } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INICIANDO SEED: Limpiando datos previos ---');
  // Borramos en orden para evitar errores de llaves foráneas
  await prisma.menuDetalle.deleteMany({});
  await prisma.menuSemanal.deleteMany({});
  await prisma.plato.deleteMany({});

  // 1. Catálogo de Platos con Imágenes Variadas
  const platosVeganos = [
    { 
      nombre: "FALAFEL", 
      cat: CategoriaPlato.ALMUERZO, 
      img: "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?q=80&w=400" 
    },
    { 
      nombre: "HUMMUS CON PITA", 
      cat: CategoriaPlato.ENSALADA, 
      img: "https://images.unsplash.com/photo-1577906036458-04c84f2229c5?q=80&w=400" 
    },
    { 
      nombre: "LASAÑA DE VERDURAS", 
      cat: CategoriaPlato.ALMUERZO, 
      img: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?q=80&w=400" 
    },
    { 
      nombre: "POROTOS CON RIENDAS", 
      cat: CategoriaPlato.ALMUERZO, 
      img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=400" 
    },
    { 
      nombre: "ZAPALLO ITALIANO RELLENO", 
      cat: CategoriaPlato.ALMUERZO, 
      img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=400" 
    }
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