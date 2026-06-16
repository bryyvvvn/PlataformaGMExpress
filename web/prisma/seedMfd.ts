import {
  Prisma,
  PrismaClient,
  Rol,
  EstadoPedido,
  CategoriaPlato,
  VarianteMenu,
} from '@prisma/client';
import * as crypto from 'node:crypto';

const db = new PrismaClient();

const EMPRESA_ID = 12;
const OMITIR_PEDIDO_SI_EXISTE = true;

interface PedidoSeed {
  cantidad: number;
  nombre: string;
  fondo: string;
  guarnicion: string | null;
  entrada: string | null;
  bebida: string | null;
  cantBebida?: number;
}

const pedidosLunes: PedidoSeed[] = [
  { cantidad: 1, nombre: 'BENJAMIN VERGARA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'LECHUGA MILANESA', bebida: null },
  { cantidad: 1, nombre: 'DIEGO BLANCO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'LECHUGA MILANESA', bebida: null },
  { cantidad: 1, nombre: 'CONSTANZA CASTILLO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'MARCO ROJAS', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CHILENA', bebida: null },
  { cantidad: 1, nombre: 'BRUNO ALVARADO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'PABLO ARAYA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CHILENA', bebida: null },
  { cantidad: 1, nombre: 'BERNABE PEREZ', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'NAHUN VERGARA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CHILENA', bebida: null },
  { cantidad: 1, nombre: 'BASTIAN AVILA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'ANDRES CORTES', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'SERGIO MARAMBIO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'BRIAN BARRAZA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'LECHUGA MILANESA', bebida: null },
  { cantidad: 1, nombre: 'LUIS ACEVEDO', fondo: 'LENTEJAS CON SOFRITO DE VIENESAS', guarnicion: null, entrada: 'CHILENA', bebida: null },
  { cantidad: 1, nombre: 'LUIS MERY', fondo: 'CAMPESINA DE VACUNO', guarnicion: null, entrada: null, bebida: 'BEBIDA ZERO' },
  { cantidad: 1, nombre: 'DANIEL AGUIRRE', fondo: 'CAMPESINA DE VACUNO', guarnicion: null, entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'JOSE ADASME', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'VALENTINA ROJAS', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'JOSEFA LOBOS', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CHILENA', bebida: null },
  { cantidad: 1, nombre: 'BRAYAN VELIZ', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'LECHUGA MILANESA', bebida: null },
];

const pedidosMartes: PedidoSeed[] = [
  { cantidad: 1, nombre: 'BENJAMIN VERGARA', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'DIEGO BLANCO', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'CEVICHE DE ZAPALLO ITALIANO', bebida: null },
  { cantidad: 1, nombre: 'CONSTANZA CASTILLO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'ZANAHORIA COLIFLOR', bebida: null },
  { cantidad: 1, nombre: 'MARCO ROJAS', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'ZANAHORIA', bebida: null },
  { cantidad: 1, nombre: 'BRUNO ALVARADO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'PABLO ARAYA', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'ZANAHORIA', bebida: null },
  { cantidad: 1, nombre: 'BERNABE PEREZ', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'NAHUN VERGARA', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'BASTIAN AVILA', fondo: 'CROQUETAS DE ATÚN SIN TOMATE', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'ANDRES CORTES', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'SERGIO MARAMBIO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'BRIAN BARRAZA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'ZANAHORIA', bebida: null },
  { cantidad: 1, nombre: 'LUIS ACEVEDO', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'LUIS MERY', fondo: 'POLLO MEDITERRÁNEO', guarnicion: null, entrada: null, bebida: 'BEBIDA ZERO' },
  { cantidad: 1, nombre: 'DANIEL AGUIRRE', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'COLIFLOR', bebida: null },
  { cantidad: 1, nombre: 'JOSE ADASME', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'VALENTINA ROJAS', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'JOSEFA LOBOS', fondo: 'ATÚN', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'ZANAHORIA', bebida: null },
  { cantidad: 1, nombre: 'BRAYAN VELIZ', fondo: 'HUEVO', guarnicion: 'PAPAS RÚSTICAS', entrada: 'COLIFLOR', bebida: null },
];

const pedidosMiercoles: PedidoSeed[] = [
  { cantidad: 1, nombre: 'BENJAMIN VERGARA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'MIX DE LECHUGAS', bebida: null },
  { cantidad: 1, nombre: 'DIEGO BLANCO', fondo: 'CAZUELA SECA + ENSALADA DEL DÍA', guarnicion: null, entrada: 'ARVEJITA PALMITO', bebida: null },
  { cantidad: 1, nombre: 'CONSTANZA CASTILLO', fondo: 'CAZUELA SECA + ENSALADA DEL DÍA', guarnicion: null, entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'MARCO ROJAS', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'BRUNO ALVARADO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'PABLO ARAYA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'BETARRAGA RALLADA', bebida: null },
  { cantidad: 1, nombre: 'BERNABE PEREZ', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'NAHUN VERGARA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'MIX DE LECHUGAS', bebida: null },
  { cantidad: 1, nombre: 'BASTIAN AVILA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS SIN SALSA', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'ANDRES CORTES', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'SERGIO MARAMBIO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'BRIAN BARRAZA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'MIX DE LECHUGAS-ARVEJITAS PALMITO', bebida: null },
  { cantidad: 1, nombre: 'LUIS ACEVEDO', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'ARVEJITA PALMITO', bebida: null },
  { cantidad: 1, nombre: 'LUIS MERY', fondo: 'CAZUELA SECA + ENSALADA DEL DÍA', guarnicion: null, entrada: null, bebida: 'BEBIDA ZERO' },
  { cantidad: 1, nombre: 'DANIEL AGUIRRE', fondo: 'CAZUELA SECA + ENSALADA DEL DÍA', guarnicion: null, entrada: 'ARVEJITA PALMITO', bebida: null },
  { cantidad: 1, nombre: 'JOSE ADASME', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'VALENTINA ROJAS', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'JOSEFA LOBOS', fondo: 'ATÚN', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'MIX DE LECHUGAS', bebida: null },
  { cantidad: 1, nombre: 'BRAYAN VELIZ', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'MIX DE LECHUGAS', bebida: null },
];

const pedidosJueves: PedidoSeed[] = [
  { cantidad: 1, nombre: 'BENJAMIN VERGARA', fondo: 'BOX GM', guarnicion: 'PAPAS FRITAS', entrada: 'PEPINO', bebida: null },
  { cantidad: 1, nombre: 'DIEGO BLANCO', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'PEPINO', bebida: null },
  { cantidad: 1, nombre: 'CONSTANZA CASTILLO', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'MARCO ROJAS', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'PEPINO', bebida: null },
  { cantidad: 1, nombre: 'PABLO ARAYA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'PRIMAVERA', bebida: null },
  { cantidad: 1, nombre: 'BERNABE PEREZ', fondo: 'BOX GM', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'NAHUN VERGARA', fondo: 'BOX GM', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'MIX DE REPOLLO', bebida: null },
  { cantidad: 1, nombre: 'BASTIAN AVILA', fondo: 'BOX GM', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'ANDRES CORTES', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'SERGIO MARAMBIO', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'BRIAN BARRAZA', fondo: 'BOX GM', guarnicion: 'PAPAS FRITAS', entrada: 'PRIMAVERA', bebida: null },
  { cantidad: 1, nombre: 'LUIS ACEVEDO', fondo: 'SANDWICH HAMBURGUESA DE LENTEJAS + TOMATE', guarnicion: null, entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'LUIS MERY', fondo: '2 FAJITAS DE POLLO EN CAMA DE LECHUGA', guarnicion: null, entrada: null, bebida: 'BEBIDA ZERO' },
  { cantidad: 1, nombre: 'DANIEL AGUIRRE', fondo: 'BOX GM', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'PEPINO', bebida: null },
  { cantidad: 1, nombre: 'JOSE ADASME', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'VALENTINA ROJAS', fondo: 'BOX GM', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'JOSEFA LOBOS', fondo: '2 FAJITAS DE POLLO EN CAMA DE LECHUGA', guarnicion: null, entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'BRAYAN VELIZ', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'MIX DE REPOLLO', bebida: null },
];

const pedidosViernes: PedidoSeed[] = [
  { cantidad: 1, nombre: 'BENJAMIN VERGARA', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: 'LECHUGA ESCAROLA-TOMATE', bebida: null },
  { cantidad: 1, nombre: 'DIEGO BLANCO', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'TOMATE', bebida: null },
  { cantidad: 1, nombre: 'CONSTANZA CASTILLO', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'MARCO ROJAS', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'TOMATE', bebida: null },
  { cantidad: 1, nombre: 'PABLO ARAYA', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'BETARRAGA-ZANAHORIA', bebida: null },
  { cantidad: 1, nombre: 'BERNABE PEREZ', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'NAHUN VERGARA', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: 'TOMATE', bebida: null },
  { cantidad: 1, nombre: 'BASTIAN AVILA', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: null, bebida: 'BEBIDA' },
  { cantidad: 1, nombre: 'ANDRES CORTES', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'SERGIO MARAMBIO', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'ENSALADA DEL DÍA', bebida: null },
  { cantidad: 1, nombre: 'BRIAN BARRAZA', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'LECHUGA ESCAROLA', bebida: null },
  { cantidad: 1, nombre: 'LUIS ACEVEDO', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'LUIS MERY', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO + ENSALADA DEL DÍA', guarnicion: null, entrada: null, bebida: 'BEBIDA ZERO' },
  { cantidad: 1, nombre: 'DANIEL AGUIRRE', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO + ENSALADA DEL DÍA', guarnicion: null, entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'JOSE ADASME', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'VALENTINA ROJAS', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'SOPA' },
  { cantidad: 1, nombre: 'JOSEFA LOBOS', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO + ENSALADA', guarnicion: null, entrada: 'LECHUGA ESCAROLA', bebida: null },
  { cantidad: 1, nombre: 'BRAYAN VELIZ', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'LECHUGA ESCAROLA', bebida: null },
];

const semana = [
  { fecha: new Date('2026-06-01T12:00:00Z'), pedidos: pedidosLunes },
  { fecha: new Date('2026-06-02T12:00:00Z'), pedidos: pedidosMartes },
  { fecha: new Date('2026-06-03T12:00:00Z'), pedidos: pedidosMiercoles },
  { fecha: new Date('2026-06-04T12:00:00Z'), pedidos: pedidosJueves },
  { fecha: new Date('2026-06-05T12:00:00Z'), pedidos: pedidosViernes },
];

function quitarTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function limpiarTexto(valor: string | null | undefined): string | null {
  if (!valor) return null;

  const texto = valor
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .toUpperCase();

  if (!texto || texto === 'NO' || texto === 'NO APLICA' || texto === 'N/A') {
    return null;
  }

  const normalizado = quitarTildes(texto);

  if (normalizado === 'BOX GM' || normalizado.includes('BOX GM')) {
    return 'BOX GM SANDWICH';
  }

  const alias: Record<string, string> = {
    'FRICASE DE VACUNO': 'FRICASÉ DE VACUNO',
    'ENSALADA DEL DIA': 'ENSALADA DEL DÍA',
    'CROQUETA DE ATUN ATOMATADA': 'CROQUETAS DE ATÚN ATOMATADAS',
    'CROQUETAS DE ATUN ATOMATADA': 'CROQUETAS DE ATÚN ATOMATADAS',
    'CROQUETAS DE ATUN ATOMATADAS': 'CROQUETAS DE ATÚN ATOMATADAS',
    'CROQUETAS DE ATUN SIN TOMATE': 'CROQUETAS DE ATÚN SIN TOMATE',
    'ATUN': 'ATÚN',
    'PAPAS RUSTICAS AL OREGANO': 'PAPAS RÚSTICAS AL ORÉGANO',
    'PAPAS RUSTICAS': 'PAPAS RÚSTICAS',
    'QUIFAROS AL OREGANO': 'QUÍFAROS AL ORÉGANO',
    'PURE DE PAPAS': 'PURÉ DE PAPAS',
    'LASANA JAMON QUESO': 'LASAÑA JAMÓN QUESO',
    'POLLO CON SALSA Y CHOCLO': 'POLLO CON SALSA BLANCA Y CHOCLO',
    'POLLO CON SALSA BLANCA Y CHOCLO+ENSALADA': 'POLLO CON SALSA BLANCA Y CHOCLO + ENSALADA',
    'POLLO CON SALSA BLANCA Y CHOCLO+ENSALADA DEL DIA': 'POLLO CON SALSA BLANCA Y CHOCLO + ENSALADA DEL DÍA',
    'CAZUELA SECA+ENSALADA DEL DIA': 'CAZUELA SECA + ENSALADA DEL DÍA',
    'CAZUELA SECA + ENSALADA DEL DIA': 'CAZUELA SECA + ENSALADA DEL DÍA',
    'BEBIDA ZERO': 'BEBIDA ZERO',
  };

  return alias[normalizado] ?? texto;
}

function capitalizar(texto: string): string {
  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

function normalizarNombreUsuario(nombre: string): string {
  return limpiarTexto(nombre) ?? nombre.trim().toUpperCase();
}

function slugCorreo(nombre: string): string {
  return quitarTildes(nombre.toLowerCase())
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function separarNombreApellido(nombreCompleto: string): {
  nombre: string;
  apellido: string | null;
} {
  const partes = capitalizar(nombreCompleto).split(' ').filter(Boolean);

  if (partes.length <= 1) {
    return {
      nombre: partes[0] ?? nombreCompleto,
      apellido: null,
    };
  }

  return {
    nombre: partes[0],
    apellido: partes.slice(1).join(' '),
  };
}

function inferirCategoriaFondo(nombre: string): CategoriaPlato {
  const texto = quitarTildes(nombre.toUpperCase());

  if (
    texto.includes('BOX GM') ||
    texto.includes('SANDWICH') ||
    texto.includes('HAMBURGUESA')
  ) {
    return CategoriaPlato.SANDWICH;
  }

  return CategoriaPlato.FONDO;
}

function inferirVariante(nombre: string): VarianteMenu {
  const texto = quitarTildes(nombre.toUpperCase());

  if (texto.includes('HIPOCALORICO')) return VarianteMenu.HIPOCALORICO;
  if (texto.includes('VEGANO')) return VarianteMenu.VEGANO;
  if (texto.includes('VEGETARIANO')) return VarianteMenu.VEGETARIANO;

  if (
    texto.includes('LENTEJA') ||
    texto.includes('POROTO') ||
    texto.includes('GARBANZO')
  ) {
    return VarianteMenu.PLATO_UNICO;
  }

  return VarianteMenu.NORMAL;
}

function prepararBebidaOBeneficioCanje(bebida: string): {
  nombre: string;
  categoria: CategoriaPlato;
} {
  const texto = limpiarTexto(bebida);

  if (!texto) {
    throw new Error(`Bebida inválida: ${bebida}`);
  }

  const normalizado = quitarTildes(texto.toUpperCase());

  if (normalizado === 'SOPA') {
    return {
      nombre: 'SOPA (CANJE)',
      categoria: CategoriaPlato.CANJE,
    };
  }

  if (normalizado.includes('POSTRE')) {
    return {
      nombre: texto,
      categoria: CategoriaPlato.POSTRE,
    };
  }

  if (normalizado.includes('JUGO')) {
    return {
      nombre: texto,
      categoria: CategoriaPlato.JUGO,
    };
  }

  if (normalizado.includes('AGUA')) {
    return {
      nombre: texto,
      categoria: CategoriaPlato.AGUA_SABORIZADA,
    };
  }

  return {
    nombre: texto,
    categoria: CategoriaPlato.BEBIDA,
  };
}

async function obtenerOCrearUsuario(nombreCrudo: string) {
  const nombreUsuario = normalizarNombreUsuario(nombreCrudo);
  const datosPersona = separarNombreApellido(nombreUsuario);

  const existente = await db.usuario.findFirst({
    where: {
      empresaId: EMPRESA_ID,
      nombreUsuario: {
        equals: nombreUsuario,
        mode: 'insensitive',
      },
    },
  });

  if (existente) return existente;

  return db.usuario.create({
    data: {
      id: `user_mock_${crypto.randomUUID().split('-')[0]}`,
      nombreUsuario,
      rol: Rol.TRABAJADOR,
      empresaId: EMPRESA_ID,
      nombre: datosPersona.nombre,
      apellido: datosPersona.apellido,
      correo: `${slugCorreo(nombreUsuario)}@mfd.local`,
      diasBloqueados: [],
    },
  });
}

async function obtenerOCrearPlato(
  nombreCrudo: string,
  categoria: CategoriaPlato,
  tipo: VarianteMenu = VarianteMenu.NORMAL,
) {
  const nombre = limpiarTexto(nombreCrudo);

  if (!nombre) {
    throw new Error(`Nombre de plato inválido: ${nombreCrudo}`);
  }

  const existente = await db.plato.findFirst({
    where: {
      nombre: {
        equals: nombre,
        mode: 'insensitive',
      },
    },
  });

  if (existente) return existente;

  return db.plato.create({
    data: {
      nombre,
      categoria,
      tipo,
    },
  });
}

async function obtenerOCrearGuarnicion(nombreCrudo: string | null) {
  const nombre = limpiarTexto(nombreCrudo);

  if (!nombre) return null;

  const existente = await db.guarnicion.findFirst({
    where: {
      nombre: {
        equals: nombre,
        mode: 'insensitive',
      },
    },
  });

  if (existente) return existente;

  return db.guarnicion.create({
    data: {
      nombre,
    },
  });
}

async function crearPedido(fecha: Date, pedidoSeed: PedidoSeed) {
  const usuario = await obtenerOCrearUsuario(pedidoSeed.nombre);

  if (OMITIR_PEDIDO_SI_EXISTE) {
    const pedidoExistente = await db.pedido.findFirst({
      where: {
        empresaId: EMPRESA_ID,
        usuarioId: usuario.id,
        fecha,
      },
    });

    if (pedidoExistente) {
      return {
        creado: false,
        motivo: 'Pedido ya existente',
        usuario: usuario.nombreUsuario,
      };
    }
  }

  const fondoTexto = limpiarTexto(pedidoSeed.fondo);

  if (!fondoTexto) {
    throw new Error(`Pedido sin fondo válido para usuario ${pedidoSeed.nombre}`);
  }

  const fondo = await obtenerOCrearPlato(
    fondoTexto,
    inferirCategoriaFondo(fondoTexto),
    inferirVariante(fondoTexto),
  );

  const guarnicion = await obtenerOCrearGuarnicion(pedidoSeed.guarnicion);

  const detallesCreate: Prisma.DetallePedidoCreateWithoutPedidoInput[] = [
    {
      cantidad: 1,
      plato: {
        connect: {
          id: fondo.id,
        },
      },
      ...(guarnicion
        ? {
            guarnicion: {
              connect: {
                id: guarnicion.id,
              },
            },
          }
        : {}),
    },
  ];

  const entradaTexto = limpiarTexto(pedidoSeed.entrada);

  if (entradaTexto) {
    const entrada = await obtenerOCrearPlato(
      entradaTexto,
      CategoriaPlato.ENTRADA,
      VarianteMenu.NORMAL,
    );

    detallesCreate.push({
      cantidad: 1,
      plato: {
        connect: {
          id: entrada.id,
        },
      },
    });
  }

  const bebidaTexto = limpiarTexto(pedidoSeed.bebida);

  if (bebidaTexto) {
    const bebidaPreparada = prepararBebidaOBeneficioCanje(bebidaTexto);

    const bebida = await obtenerOCrearPlato(
      bebidaPreparada.nombre,
      bebidaPreparada.categoria,
      VarianteMenu.NORMAL,
    );

    detallesCreate.push({
      cantidad: pedidoSeed.cantBebida ?? 1,
      plato: {
        connect: {
          id: bebida.id,
        },
      },
    });
  }

  await db.pedido.create({
    data: {
      fecha,
      estado: EstadoPedido.PENDIENTE,
      empresa: {
        connect: {
          id: EMPRESA_ID,
        },
      },
      usuario: {
        connect: {
          id: usuario.id,
        },
      },
      detalles: {
        create: detallesCreate,
      },
    },
  });

  return {
    creado: true,
    usuario: usuario.nombreUsuario,
  };
}

async function main() {
  const empresa = await db.empresa.findUnique({
    where: {
      id: EMPRESA_ID,
    },
  });

  if (!empresa) {
    throw new Error(`No existe la empresa con id ${EMPRESA_ID}`);
  }

  let pedidosCreados = 0;
  let pedidosOmitidos = 0;

  for (const dia of semana) {
    for (const pedido of dia.pedidos) {
      const resultado = await crearPedido(dia.fecha, pedido);

      if (resultado.creado) {
        pedidosCreados += 1;
        console.log(
          `Pedido creado: ${resultado.usuario} - ${dia.fecha.toISOString().slice(0, 10)}`,
        );
      } else {
        pedidosOmitidos += 1;
        console.log(
          `Pedido omitido: ${resultado.usuario} - ${dia.fecha.toISOString().slice(0, 10)} (${resultado.motivo})`,
        );
      }
    }
  }

  console.log('Carga masiva MFD finalizada');
  console.table({
    empresaId: EMPRESA_ID,
    pedidosCreados,
    pedidosOmitidos,
  });
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed MFD:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });