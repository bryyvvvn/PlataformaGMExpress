import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const db = new PrismaClient();

async function main() {
  console.log('Iniciando carga de semana completa para MERKEN (1 al 5 de Junio)...');
  
  try {
    const EMPRESA_ID = 11;

    // --- LUNES (1 DE JUNIO) ---
    const pedidosLunes = [
      { nombre: 'JOEL', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'IAN CORTES', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MAURICIO YAÑEZ', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'SPRITE' },
      { nombre: 'ALEXANDER', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'SPRITE' },
      { nombre: 'HANS CASTRO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'COCA COLA ZERO' },
      { nombre: 'MAURICIO JARA', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: null, bebida: 'COCA COLA ZERO' },
      { nombre: 'ADRIANA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'WALTER LEDEZMA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'JUGO' },
      { nombre: 'ESTEBAN ARAYA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'JORGE ARAYA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'KEM PIÑA' },
      { nombre: 'VANESSITA GODOY', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'ELIANA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MIRLA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA CON SABOR' },
      { nombre: 'SONIA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'ROBERTO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'LUIS', fondo: 'VEGETARIANO/VEGANO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'VANESSA PASTEN', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' }
    ];

    // --- MARTES (2 DE JUNIO) ---
    const pedidosMartes = [
      { nombre: 'JOEL', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'IAN CORTES', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MAURICIO YAÑEZ', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'SPRITE' },
      { nombre: 'ALEXANDER', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'HANS CASTRO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: 'CEVICHE DE ZAPALLO ITALIANO', bebida: null },
      { nombre: 'MAURICIO JARA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'ADRIANA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'ENSALADA GRANDE', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'WALTER LEDEZMA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'JUGO' },
      { nombre: 'ESTEBAN ARAYA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'JORGE ARAYA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'KEM PIÑA' },
      { nombre: 'VANESSITA GODOY', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'ELIANA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MIRLA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA CON SABOR' },
      { nombre: 'SONIA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'ROBERTO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' }
    ];

    // --- MIÉRCOLES (3 DE JUNIO) ---
    const pedidosMiercoles = [
      { nombre: 'JOEL', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'IAN CORTES', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MAURICIO YAÑEZ', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SPRITE' },
      { nombre: 'ALEXANDER', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'KEM PIÑA' },
      { nombre: 'HANS CASTRO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'MAURICIO JARA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'KEM PIÑA' },
      { nombre: 'ADRIANA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'WALTER LEDEZMA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'JUGO' },
      { nombre: 'ESTEBAN ARAYA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'JORGE ARAYA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'KEM PIÑA' },
      { nombre: 'VANESSITA GODOY', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'ELIANA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MIRLA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'AGUA CON SABOR' },
      { nombre: 'SONIA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'ROBERTO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'LUIS', fondo: 'VEGETARIANO/VEGANO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'VANESSA PASTEN', fondo: 'HUEVO FRITO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'PEPSI CERO' }
    ];

    // --- JUEVES (4 DE JUNIO) ---
    const pedidosJueves = [
      { nombre: 'JOEL', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'IAN CORTES', fondo: 'POLLO BROASTER', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MAURICIO YAÑEZ', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'SPRITE' },
      { nombre: 'ALEXANDER', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'HANS CASTRO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'MAURICIO JARA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'ADRIANA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'AGUA MINERAL CON GAS' },
      { nombre: 'WALTER LEDEZMA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'JUGO' },
      { nombre: 'ESTEBAN ARAYA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'JORGE ARAYA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'KEM PIÑA' },
      { nombre: 'VANESSITA GODOY', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'KEM PIÑA' },
      { nombre: 'ELIANA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MIRLA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'SONIA', fondo: 'VEGETARIANO/VEGANO', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'ROBERTO', fondo: 'POLLO BROASTER', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'LUIS', fondo: 'VEGETARIANO/VEGANO', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'VANESSA PASTEN', fondo: 'POLLO BROASTER', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'PEPSI CERO' }
    ];

    // --- VIERNES (5 DE JUNIO) ---
    const pedidosViernes = [
      { nombre: 'ROBERTO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'FELIPE', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'JORGE', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'LEONARDO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'JUGO POSTRE' },
      { nombre: 'BRAULIO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { nombre: 'MARCO MECANICOS', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { nombre: 'NELSON DELGADO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'YULIANO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { nombre: 'FANNY', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { nombre: 'SOLEDAD MORALES', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'CARMEN ARANCIBIA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'LUIS VASQUEZ', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA ZERO' },
      { nombre: 'PABLO BODEGA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'ALEX COMERCIAL', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'ROSITA ORREGO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'FRANCO TAPIA BODEGA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MARIO BODEGA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'CLAUDIO TAPIA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'JORDANO LAVADOR', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'HELLEN', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { nombre: 'JHON NUÑEZ', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'AGUA CON SABOR' },
      { nombre: 'OMAR', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'SPRITE NORMAL' },
      { nombre: 'LUIS MECANICO', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'COCA COLA' },
      { nombre: 'CRISTIAN LILLO', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'FELIPE BODEGA', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'JUAN TRIGO', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'ESTEBAN PERALTA SUPERVISOR', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE LECHUGA', bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'CESAR', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { nombre: 'JOVANY', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { nombre: 'MAURICIO BUGUEÑO', fondo: 'VEGETARIANO', guarnicion: null, entrada: null, bebida: 'JUGO POSTRE' }
    ];

    const diasData = [
      { fechaObj: new Date('2026-06-01T12:00:00Z'), pedidos: pedidosLunes, nombreDia: 'Lunes' },
      { fechaObj: new Date('2026-06-02T12:00:00Z'), pedidos: pedidosMartes, nombreDia: 'Martes' },
      { fechaObj: new Date('2026-06-03T12:00:00Z'), pedidos: pedidosMiercoles, nombreDia: 'Miércoles' },
      { fechaObj: new Date('2026-06-04T12:00:00Z'), pedidos: pedidosJueves, nombreDia: 'Jueves' },
      { fechaObj: new Date('2026-06-05T12:00:00Z'), pedidos: pedidosViernes, nombreDia: 'Viernes' }
    ];

    const getPlato = async (nombre: string, categoria: any, tipo: any = 'NORMAL') => {
      let plato = await db.plato.findUnique({ where: { nombre } });
      if (!plato) {
        plato = await db.plato.create({ data: { nombre, categoria, tipo } });
      }
      return plato.id;
    };

    const getGuarnicion = async (nombre: string) => {
      let guarnicion = await db.guarnicion.findUnique({ where: { nombre } });
      if (!guarnicion) {
        guarnicion = await db.guarnicion.create({ data: { nombre } });
      }
      return guarnicion.id;
    };

    let totalInsertados = 0;

    for (const dia of diasData) {
      console.log(`⏳ Insertando pedidos de MERKEN para el día: ${dia.nombreDia}...`);
      for (const pedido of dia.pedidos) {
        
        let usuario = await db.usuario.findFirst({
          where: { nombreUsuario: pedido.nombre, empresaId: EMPRESA_ID }
        });

        if (!usuario) {
          const mockClerkId = `user_mock_${crypto.randomUUID().split('-')[0]}`;
          usuario = await db.usuario.create({
            data: {
              id: mockClerkId,
              nombreUsuario: pedido.nombre,
              nombre: pedido.nombre,
              rol: 'TRABAJADOR',
              empresaId: EMPRESA_ID
            }
          });
        }

        const detallesACrear = [];
        let tipoFondo = 'NORMAL';
        if (pedido.fondo.includes('HIPOCALORICO')) tipoFondo = 'HIPOCALORICO';
        if (pedido.fondo.includes('VEGETARIANO') || pedido.fondo.includes('VEGANO')) tipoFondo = 'VEGETARIANO';
        
        const fondoId = await getPlato(pedido.fondo, 'FONDO', tipoFondo);
        const guarnicionId = pedido.guarnicion ? await getGuarnicion(pedido.guarnicion) : null;
        detallesACrear.push({ platoId: fondoId, guarnicionId, cantidad: 1 });

        if (pedido.entrada) {
          const entradaId = await getPlato(pedido.entrada, 'ENTRADA');
          detallesACrear.push({ platoId: entradaId, cantidad: 1 });
        }

        if (pedido.bebida) {
          const categoriaBebida = pedido.bebida.includes('JUGO') ? 'POSTRE' : 'BEBIDA';
          const bebidaId = await getPlato(pedido.bebida, categoriaBebida);
          const cantidadBebida = (pedido as any).cantBebida || 1;
          detallesACrear.push({ platoId: bebidaId, cantidad: cantidadBebida });
        }

        await db.pedido.create({
          data: {
            usuarioId: usuario.id,
            empresaId: EMPRESA_ID,
            estado: 'PENDIENTE',
            fecha: dia.fechaObj, 
            detalles: { create: detallesACrear }
          }
        });
        totalInsertados++;
      }
    }
    console.log(`✅ ¡Éxito! Se insertaron ${totalInsertados} pedidos para MERKEN.`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });