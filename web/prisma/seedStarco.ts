import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const db = new PrismaClient();

const nombres = ['Carlos', 'Andrés', 'Matias', 'Nicolás', 'Javier', 'Diego', 'Cristóbal', 'Benjamín', 'Sebastián', 'Gabriel', 'Tomás', 'Joaquín', 'Martín', 'Ignacio', 'Felipe', 'Luis', 'Pedro', 'Juan', 'Miguel'];
const apellidos = ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza'];

function generarNombreRandom() {
  const nombre = nombres[Math.floor(Math.random() * nombres.length)];
  const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
  return `${nombre} ${apellido}`;
}

async function main() {
  console.log('Iniciando la súper carga masiva (Semana Completa sin duplicar usuarios)...');
  
  try {
    const EMPRESA_ID = 3;

    // --- LUNES ---
    const pedidosLunes = [
      { cantidad: 1, nombre: 'DANIEL ESPINOSA', fondo: 'FRICASE DE VACUNO', guarnicion: 'DOBLE PROTEINA', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON JHON NUÑEZ', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'CAMPESINA DE VERDURAS', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON MANUEL CASTILLO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON FELIPE', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON JORGE', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON MAURICIO BUGUEÑO', fondo: 'VEGETARIANA', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'JUGO POSTRE', cantBebida: 2 },
      { cantidad: 1, nombre: 'DON ROBERTO FLORES', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'DON LEONARDO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON OMAR BODEGA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NORMA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'SPRITE ZERO' },
      { cantidad: 1, nombre: 'BRAULIO LAVADOR', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'MARCO MECANICOS', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 10, nombre: 'MECANICOS', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS MECANICOS', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'CAMPESINA DE VERDURAS', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON RODRIGO SANTANDER', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: 'LECHUGA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'HELEN', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'NELSON DELGADO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CRISTIAN LILLO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON YULIANO', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'SRTA JEDIXA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'SOLEDAD MORALES', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'CAMPESINA DE VERDURAS', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CARMEN ARANCIBIA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'LUIS VASQUEZ', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'PABLO BODEGA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'FELIPE BODEGA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'SRTA FANNY', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JUAN TRIGO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ALEX COMERCIAL', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CHILENA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'ROSITA ORREGO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NAYADETH', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: 'CHILENA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'FRANCO TAPIA BODEGA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'MARIO BODEGA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON MARCELO SUPERVISOR', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'CAMPESINA DE VERDURAS', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'CLAUDIO TAPIA', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ESTEBAN SUPERVISOR', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 3, nombre: 'COMERCIAL', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'GIORDANNO LAVADOR', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS TORO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 2, nombre: 'APOYO FERIA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SEBASTIAN CASTRO PREVENCION', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CREMA DE ESPARRAGOS', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON CESAR', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'CAMPESINA DE VERDURAS', bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 16, nombre: 'CAMIONES', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'JOSE ARRIAGADA MECANICO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'CAMPESINA DE VERDURAS', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JOVANY', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 14, nombre: 'TURNO DE NOCHE', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'APOYO VOLUMINOSO', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'FANTA NORMAL' },
      { cantidad: 3, nombre: 'SUMIDEROS', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'FANTA NORMAL' },
      { cantidad: 2, nombre: 'PAOLA PINCETTI', fondo: 'LENTEJAS CON SOFRITO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 5, nombre: 'ALMUERZOS JUAN LEIVA', fondo: 'FRICASE DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' }
    ];

    // --- MARTES ---
    const pedidosMartes = [
      { cantidad: 1, nombre: 'DANIEL ESPINOSA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'DOBLE PROTEINA', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON JHON NUÑEZ', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO MEDITERRANEO', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON MANUEL CASTILLO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON FELIPE', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON JORGE', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA MINERAL' },
      { cantidad: 1, nombre: 'DON MAURICIO BUGUEÑO', fondo: 'VEGETARIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'JUGO POSTRE', cantBebida: 2 },
      { cantidad: 1, nombre: 'DON ROBERTO FLORES', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'DON LEONARDO', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: 'ZANAHORIA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON OMAR BODEGA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NORMA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'SPRITE ZERO' },
      { cantidad: 1, nombre: 'BRAULIO LAVADOR', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'QUIFAROS AL OREGANO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'MARCO MECANICOS', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 10, nombre: 'MECANICOS', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS MECANICOS', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON RODRIGO SANTANDER', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: 'ZANAHORIA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'HELEN', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'NELSON DELGADO', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CRISTIAN LILLO', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON YULIANO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'SRTA JEDIXA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO MEDITERRANEO', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'SOLEDAD MORALES', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO MEDITERRANEO', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CARMEN ARANCIBIA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'LUIS VASQUEZ', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'PABLO BODEGA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'FELIPE BODEGA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA MINERAL' },
      { cantidad: 1, nombre: 'SRTA FANNY', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO MEDITERRANEO', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JUAN TRIGO', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ALEX COMERCIAL', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: 'AJIACO DE AVE', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'ROSITA ORREGO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NAYADETH', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'QUIFAROS AL OREGANO', entrada: 'ZANAHORIA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'FRANCO TAPIA BODEGA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'MARIO BODEGA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'AGUA MINERAL' },
      { cantidad: 1, nombre: 'DON MARCELO SUPERVISOR', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO MEDITERRANEO', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'CLAUDIO TAPIA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ESTEBAN SUPERVISOR', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA MINERAL' },
      { cantidad: 1, nombre: 'GIORDANNO LAVADOR', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS TORO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 2, nombre: 'APOYO FERIA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'FANTA' },
      { cantidad: 1, nombre: 'SEBASTIAN CASTRO PREVENCION', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO MEDITERRANEO', bebida: 'AJIACO JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON CESAR', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'AGUA MINERAL' },
      { cantidad: 16, nombre: 'CAMIONES', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'JOSE ARRIAGADA MECANICO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'ENSALADA DEL DIA', entrada: 'GRANDE SURTIDA', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JOVANY', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 14, nombre: 'TURNO DE NOCHE', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'APOYO VOLUMINOSO', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'SUMIDEROS', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 2, nombre: 'PAOLA PINCETTI', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RUSTICAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 5, nombre: 'APOYO JUAN LEIVA', fondo: 'CROQUETAS DE ATUN ATOMATADAS', guarnicion: 'QUIFAROS AL OREGANO', entrada: null, bebida: 'COCA COLA' }
    ];

    // --- MIÉRCOLES ---
    const pedidosMiercoles = [
      { cantidad: 1, nombre: 'DANIEL ESPINOSA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'DOBLE PROTEINA', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON JHON NUÑEZ', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON MANUEL CASTILLO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON FELIPE', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON JORGE', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON MAURICIO BUGUEÑO', fondo: 'HUEVO FRITO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'JUGO POSTRE', cantBebida: 2 },
      { cantidad: 1, nombre: 'DON ROBERTO FLORES', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'DON LEONARDO', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'MIX DE LECHUGA Y ENSALADA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON OMAR BODEGA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NORMA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'FANTA NORMAL' },
      { cantidad: 1, nombre: 'BRAULIO LAVADOR', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'MARCO MECANICOS', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 10, nombre: 'MECANICOS', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS MECANICOS', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON RODRIGO SANTANDER', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'BETARRAGA RALLADA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'HELEN', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'NELSON DELGADO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CRISTIAN LILLO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON YULIANO', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'SRTA JEDIXA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'SOLEDAD MORALES', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CARMEN ARANCIBIA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'LUIS VASQUEZ', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'PABLO BODEGA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'FELIPE BODEGA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA FANNY', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JUAN TRIGO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ALEX COMERCIAL', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE', cantBebida: 2 },
      { cantidad: 1, nombre: 'ROSITA ORREGO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NAYADETH', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'ARVEJITAS PALMITO', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'FRANCO TAPIA BODEGA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'MARIO BODEGA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON MARCELO SUPERVISOR', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'CLAUDIO TAPIA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ESTEBAN SUPERVISOR', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SPRITE ZERO' },
      { cantidad: 1, nombre: 'GIORDANNO LAVADOR', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS TORO', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 2, nombre: 'APOYO FERIA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SPRITE NORMAL' },
      { cantidad: 1, nombre: 'SEBASTIAN CASTRO PREVENCION', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'CAZUELA SECA + ENSALADA', bebida: 'SOPA DE CARNE' },
      { cantidad: 1, nombre: 'DON CESAR', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 12, nombre: 'CAMIONES', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'JOSE ARRIAGADA MECANICO', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JOVANY', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'APOYO VOLUMINOSO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'SUMIDEROS', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 2, nombre: 'PAOLA PINCETTI', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SPRITE NORMAL' },
      { cantidad: 5, nombre: 'APOYO DON JUAN LEIVA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'VISITA SANTIAGO', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' }
    ];

    // --- JUEVES ---
    const pedidosJueves = [
      { cantidad: 1, nombre: 'DANIEL ESPINOSA', fondo: 'POLLO BROASTER', guarnicion: 'DOBLE PROTEINA', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON JHON NUÑEZ', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON MANUEL CASTILLO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'DON FELIPE', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON JORGE', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON MAURICIO BUGUEÑO', fondo: 'VEGETARIANO', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'JUGO POSTRE', cantBebida: 2 },
      { cantidad: 1, nombre: 'DON ROBERTO FLORES', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'DON LEONARDO', fondo: 'POLLO BROASTER', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE MIX REPOLLO', bebida: 'JUGO POSTRE', cantBebida: 2 },
      { cantidad: 1, nombre: 'DON OMAR BODEGA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NORMA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'PEPINO', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'BRAULIO LAVADOR', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'MARCO MECANICOS', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 10, nombre: 'MECANICOS', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS MECANICOS', fondo: 'POLLO BROASTER', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON RODRIGO SANTANDER', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: 'PEPINO', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'HELEN', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'NELSON DELGADO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CRISTIAN LILLO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'FANTA' },
      { cantidad: 1, nombre: 'DON YULIANO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA JEDIXA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'SOLEDAD MORALES', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CARMEN ARANCIBIA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'LUIS VASQUEZ', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'PABLO BODEGA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'FELIPE BODEGA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'SRTA FANNY', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: '2 FAJITAS DE POLLO', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JUAN TRIGO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ALEX COMERCIAL', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'SPRITE NORMAL' },
      { cantidad: 1, nombre: 'ROSITA ORREGO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'SRTA NAYADETH', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'FRANCO TAPIA BODEGA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'MARIO BODEGA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON MARCELO SUPERVISOR', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CLAUDIO TAPIA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ESTEBAN SUPERVISOR', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: '2 FAJITAS DE POLLO', bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'GIORDANNO LAVADOR', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON LUIS TORO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 2, nombre: 'APOYO FERIA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'SPRITE NORMAL' },
      { cantidad: 1, nombre: 'SEBASTIAN CASTRO PREVENCION', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'PEPINO', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'DON CESAR', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 12, nombre: 'CAMIONES', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'JOSE ARRIAGADA MECANICO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'JOVANY', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'APOYO VOLUMINOSO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'SUMIDEROS', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 2, nombre: 'PAOLA PINCETTI', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 5, nombre: 'APOYO JUAN LEIVA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' }
    ];

    // --- VIERNES ---
    const pedidosViernes = [
      { cantidad: 10, nombre: 'MECANICOS', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 2, nombre: 'APOYO FERIA', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'APOYO VOLUMINOSOS', fondo: 'LASAÑA', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 3, nombre: 'SUMIDEROS', fondo: 'LASAÑA', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON MARCELO SUPERVISOR', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO CON SALSA BLANCA', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'JOSE ARRIAGADA MECANICO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO CON SALSA BLANCA', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'SEBASTIAN CASTRO PREVENCION', fondo: 'HIPOCALORICO DEL DIA', guarnicion: 'NO APLICA', entrada: 'POLLO CON SALSA BLANCA', bebida: 'SOPA DE POLLO' },
      { cantidad: 1, nombre: 'ROBERTO FLORES', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'DON FELIPE', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON JORGE', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON LEONARDO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'JUGO POSTRE', cantBebida: 2 },
      { cantidad: 1, nombre: 'BRAULIO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'MARCO MECANICOS', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: 'SURTIDA', bebida: 'JUGO POSTRE' },
      { cantidad: 1, nombre: 'NELSON DELGADO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON YULIANO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'SRTA FANNY', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'SOLEDAD MORALES', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CARMEN ARANCIBIA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'LUIS VASQUEZ', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA ZERO' },
      { cantidad: 1, nombre: 'PABLO BODEGA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON ALEX COMERCIAL', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'ROSITA ORREGO', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'FRANCO TAPIA BODEGA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'MARIO BODEGA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CLAUDIO TAPIA', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'JORDANO LAVADOR', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'HELLEN', fondo: 'LASAÑA JAMON QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON JHON NUÑEZ', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'AGUA CON SABOR' },
      { cantidad: 1, nombre: 'DON OMAR', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'SPRITE NORMAL' },
      { cantidad: 1, nombre: 'DON LUIS MECANICO', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE SURTIDA', bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'CRISTIAN LILLO', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'FELIPE BODEGA', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'JUAN TRIGO', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'ESTEBAN PERALTA SUPERVISOR', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE LECHUGA', bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'DON CESAR', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'AGUA MINERAL SIN GAS' },
      { cantidad: 1, nombre: 'JOVANY', fondo: 'POLLO CON SALSA BLANCA', guarnicion: 'PURE DE PAPAS', entrada: null, bebida: 'COCA COLA' },
      { cantidad: 1, nombre: 'DON MAURICIO BUGUEÑO', fondo: 'VEGETARIANO', guarnicion: null, entrada: null, bebida: 'JUGO POSTRE', cantBebida: 2 }
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

    // 🔥 MEMORIA PARA NOMBRES RANDOM: Para que el camión del martes se llame igual que el del lunes
    const nombresAleatoriosAsignados = new Map<string, string>();

    for (const dia of diasData) {
      console.log(`⏳ Insertando pedidos del día: ${dia.nombreDia}...`);

      for (const grupo of dia.pedidos) {
        for (let i = 0; i < grupo.cantidad; i++) {
          
          let nombreFinal = grupo.nombre;
          
          if (grupo.cantidad > 1) {
            const clave = `${grupo.nombre}_${i}`; 
            if (!nombresAleatoriosAsignados.has(clave)) {
              nombresAleatoriosAsignados.set(clave, generarNombreRandom());
            }
            nombreFinal = nombresAleatoriosAsignados.get(clave)!;
          }

          // 🔥 BUSCADOR: Evita clonar a los usuarios si ya existen
          let usuario = await db.usuario.findFirst({
            where: {
              nombreUsuario: nombreFinal,
              empresaId: EMPRESA_ID
            }
          });

          if (!usuario) {
            const mockClerkId = `user_mock_${crypto.randomUUID().split('-')[0]}`;
            usuario = await db.usuario.create({
              data: {
                id: mockClerkId,
                nombreUsuario: nombreFinal,
                nombre: nombreFinal,
                rol: 'TRABAJADOR',
                empresaId: EMPRESA_ID
              }
            });
          }

          const detallesACrear = [];
          const tipoFondo = grupo.fondo.includes('HIPOCALORICO') ? 'HIPOCALORICO' : (grupo.fondo.includes('VEGETARIANA') ? 'VEGETARIANO' : 'NORMAL');
          const fondoId = await getPlato(grupo.fondo, 'FONDO', tipoFondo);
          const guarnicionId = grupo.guarnicion ? await getGuarnicion(grupo.guarnicion) : null;
          
          detallesACrear.push({ platoId: fondoId, guarnicionId, cantidad: 1 });

          if (grupo.entrada) {
            const entradaId = await getPlato(grupo.entrada, 'ENTRADA');
            detallesACrear.push({ platoId: entradaId, cantidad: 1 });
          }

          if (grupo.bebida) {
            const categoriaBebida = grupo.bebida.includes('JUGO') ? 'POSTRE' : 'BEBIDA';
            const bebidaId = await getPlato(grupo.bebida, categoriaBebida);
            const cantidadBebida = grupo.cantBebida || 1;
            detallesACrear.push({ platoId: bebidaId, cantidad: cantidadBebida });
          }

          await db.pedido.create({
            data: {
              usuarioId: usuario.id,
              empresaId: EMPRESA_ID,
              estado: 'PENDIENTE',
              fecha: dia.fechaObj, 
              detalles: {
                create: detallesACrear
              }
            }
          });

          totalInsertados++;
        }
      }
    }

    console.log(`✅ ¡Éxito rotundo! Se insertaron ${totalInsertados} pedidos y ningún usuario fue clonado.`);

  } catch (error) {
    console.error('❌ Error insertando la data:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });