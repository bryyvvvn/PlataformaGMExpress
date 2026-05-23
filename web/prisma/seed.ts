import { PrismaClient, CategoriaPlato, VarianteMenu } from '@prisma/client';

const prisma = new PrismaClient();

const PLATOS_EXCEL = [
  // --- ENTRADAS (ENSALADAS Y SOPAS) ---
  { nombre: 'Salad Bar: Chilena', categoria: CategoriaPlato.ENTRADA, tipo: VarianteMenu.VEGETARIANO, url_imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200' },
  { nombre: 'Salad Bar: Lechuga Escarola', categoria: CategoriaPlato.ENTRADA, tipo: VarianteMenu.VEGANO, url_imagen: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200' },
  { nombre: 'Acelga', categoria: CategoriaPlato.ENTRADA, tipo: VarianteMenu.VEGETARIANO },
  { nombre: 'Arroz Con Espinacas', categoria: CategoriaPlato.ENTRADA, tipo: VarianteMenu.VEGANO },
  { nombre: 'Crema de Zapallo', categoria: CategoriaPlato.ENTRADA, tipo: VarianteMenu.VEGETARIANO },
  { nombre: 'Sopa de Pollo con Verduras', categoria: CategoriaPlato.ENTRADA, tipo: VarianteMenu.NORMAL, url_imagen: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200' },
  { nombre: 'Ceviche de Lentejas', categoria: CategoriaPlato.ENTRADA, tipo: VarianteMenu.VEGANO },

  // --- FONDOS NORMALES ---
  { nombre: 'Acelga A La Crema', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL, guarnicion: 'Arroz' },
  { nombre: 'Ajiaco De Cerdo', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL },
  { nombre: 'Ajiaco De Vacuno', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL, guarnicion: 'Arroz graneado' },
  { nombre: 'Pollo al Coñac', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL, guarnicion: 'Papas doradas', url_imagen: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200' },
  { nombre: 'Garbanzos con Sofrito de Chorizo', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL },
  { nombre: 'Merluza Frita', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL, guarnicion: 'Papas Mayo' },
  { nombre: 'Cerdo Al Horno A La Naranja', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL, guarnicion: 'Puré de papas' },
  { nombre: 'Lomo de Cerdo al Jugo', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.NORMAL, guarnicion: 'Pastelera de Choclo', url_imagen: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=200' },

  // --- FONDOS VEGANOS Y VEGETARIANOS ---
  { nombre: 'Berenjenas Rebozadas', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.VEGANO, guarnicion: 'Quinoa' },
  { nombre: 'Bocados De Arvejas Con Cebolla Caramelizada', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.VEGANO },
  { nombre: 'Budines de Verduras', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.VEGETARIANO },
  { nombre: 'Boloñesa de Lentejas', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.VEGANO, guarnicion: 'Tallarines' },
  { nombre: 'Estofado de Proteína de Soya', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.VEGANO },
  
  // --- FONDOS HIPOCALÓRICOS ---
  { nombre: 'Pollo Asado (Hipocalórico)', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.HIPOCALORICO, guarnicion: 'Ensalada del Día', url_imagen: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=200' },
  { nombre: 'Merluza Al Horno', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.HIPOCALORICO, guarnicion: 'Ensalada del Día', url_imagen: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=200' },
  { nombre: 'Bistec De Vacuno', categoria: CategoriaPlato.FONDO, tipo: VarianteMenu.HIPOCALORICO, guarnicion: 'Ensalada del Día' },

  // --- POSTRES ---
  { nombre: 'Jalea del Día', categoria: CategoriaPlato.POSTRE, tipo: VarianteMenu.NORMAL, url_imagen: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200' },
  { nombre: 'Fruta en Conserva', categoria: CategoriaPlato.POSTRE, tipo: VarianteMenu.NORMAL, url_imagen: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200' },
  { nombre: 'Sémola con Leche y Caramelo', categoria: CategoriaPlato.POSTRE, tipo: VarianteMenu.NORMAL },
  { nombre: 'Mix Fruta de la Estación', categoria: CategoriaPlato.POSTRE, tipo: VarianteMenu.VEGANO },
  { nombre: 'Flan de Chocolate (Chocolatozo)', categoria: CategoriaPlato.POSTRE, tipo: VarianteMenu.NORMAL },
];

async function main() {
  console.log('🌱 Iniciando el seeder masivo (Solo Platos y Menú)...');

  await prisma.empresa.upsert({
    where: { nombre: 'GM Express' },
    update: {},
    create: { nombre: 'GM Express', correo_contacto: 'contacto@gmexpress.cl' },
  });

  console.log(`Cargando ${PLATOS_EXCEL.length} platos en la base de datos...`);
  const platosCreados = [];
  
  for (const plato of PLATOS_EXCEL) {
    const imagenFinal = plato.url_imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';

    const nuevoPlato = await prisma.plato.upsert({
      where: { nombre: plato.nombre },
      update: {
        url_imagen: imagenFinal
      },
      create: {
        nombre: plato.nombre,
        categoria: plato.categoria,
        tipo: plato.tipo,
        url_imagen: imagenFinal
      }
    });
    platosCreados.push(nuevoPlato);
  }

  await prisma.menuSemanal.create({
    data: {
      fecha_inicio: new Date('2026-04-06T00:00:00Z'),
      fecha_fin: new Date('2026-04-10T23:59:59Z'),
      detalles: {
        create: [
          // LUNES
          { dia_semana: 'Lunes', platoId: platosCreados.find(p => p.nombre === 'Salad Bar: Chilena')?.id || 1 },
          { dia_semana: 'Lunes', platoId: platosCreados.find(p => p.nombre === 'Sopa de Pollo con Verduras')?.id || 2 },
          { dia_semana: 'Lunes', platoId: platosCreados.find(p => p.nombre === 'Pollo al Coñac')?.id || 3 },
          { dia_semana: 'Lunes', platoId: platosCreados.find(p => p.nombre === 'Pollo Asado (Hipocalórico)')?.id || 4 },
          { dia_semana: 'Lunes', platoId: platosCreados.find(p => p.nombre === 'Jalea del Día')?.id || 5 },

          // MARTES
          { dia_semana: 'Martes', platoId: platosCreados.find(p => p.nombre === 'Salad Bar: Lechuga Escarola')?.id || 1 },
          { dia_semana: 'Martes', platoId: platosCreados.find(p => p.nombre === 'Lomo de Cerdo al Jugo')?.id || 6 },
          { dia_semana: 'Martes', platoId: platosCreados.find(p => p.nombre === 'Merluza Al Horno')?.id || 7 },
          { dia_semana: 'Martes', platoId: platosCreados.find(p => p.nombre === 'Fruta en Conserva')?.id || 8 },
        ]
      }
    }
  });

  console.log('✅ ¡Base de datos poblada masivamente con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });