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

const EMPRESA_ID = 10;
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
  { cantidad: 1, nombre: 'MOISES THOMPSON', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'ALVARO BAYARDO', fondo: 'LENTEJAS CON SOFRITO DE VIENESAS', guarnicion: null, entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'NELSON TAPIA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'OMAR MARQUEZ', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'CRISTIAN VELIZ', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'MILTON MONROY', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA ZERO' },
];

const pedidosMartes: PedidoSeed[] = [
  { cantidad: 1, nombre: 'MOISES THOMPSON', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'ALVARO BAYARDO', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'NELSON TAPIA', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'OMAR MARQUEZ', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'CRISTIAN VELIZ', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'MILTON MONROY', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'COCA COLA ZERO' },
  { cantidad: 1, nombre: 'MARCOS GARRIDO', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'MATIAS ZEPEDA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'COCA COLA' },
];

const pedidosMiercoles: PedidoSeed[] = [
  { cantidad: 1, nombre: 'MOISES THOMPSON', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'ALVARO BAYARDO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'NELSON TAPIA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'OMAR MARQUEZ', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'CRISTIAN VELIZ', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'MILTON MONROY', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE ARVEJITA-PALMITO', bebida: 'COCA COLA ZERO' },
  { cantidad: 1, nombre: 'LUIS HELGUERA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'MARCOS GARRIDO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'MATIAS ZEPEDA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
];

const pedidosJueves: PedidoSeed[] = [
  { cantidad: 1, nombre: 'MOISES THOMPSON', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'ALVARO BAYARDO', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'NELSON TAPIA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'OMAR MARQUEZ', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'CRISTIAN VELIZ', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'MILTON MONROY', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: 'GRANDE ARVEJITA-PALMITO', bebida: 'COCA COLA ZERO' },
  { cantidad: 1, nombre: 'LUIS HELGUERA', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'MARCOS GARRIDO', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'MATIAS ZEPEDA', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
];

const pedidosViernes: PedidoSeed[] = [
  { cantidad: 1, nombre: 'MOISES THOMPSON', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'ALVARO BAYARDO', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'NELSON TAPIA', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'OMAR MARQUEZ', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'CRISTIAN VELIZ', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'MARCOS GARRIDO', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'SURTIDA', bebida: null },
  { cantidad: 1, nombre: 'MATIAS ZEPEDA', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'BEBIDA CCU DEL DÍA' },
  { cantidad: 1, nombre: 'MILTON MONROY', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA ZERO' },
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

  if (
    !texto ||
    texto === 'NO' ||
    texto === 'NO APLICA' ||
    texto === 'N/A'
  ) {
    return null;
  }

  const normalizado = quitarTildes(texto);

  if (
    normalizado.includes('BOX GM') ||
    normalizado.includes('SANDWICH HAMBURGUES') ||
    normalizado.includes('SANDWICH HAME')
  ) {
    return 'BOX GM SANDWICH';
  }

  const alias: Record<string, string> = {
    'FRICASE DE VACUNO': 'FRICASÉ DE VACUNO',
    'LENTEJAS CON SOFRITO DE VIENESA': 'LENTEJAS CON SOFRITO DE VIENESAS',
    'LENTEJAS CON SOFRITO DE VIENESAS': 'LENTEJAS CON SOFRITO DE VIENESAS',
    'CROQUETAS DE ATUN ATOMATADA': 'CROQUETAS DE ATÚN ATOMATADAS',
    'CROQUETAS DE ATUN ATOMATADAS': 'CROQUETAS DE ATÚN ATOMATADAS',
    'PAPAS RUSTICAS AL OREGANO': 'PAPAS RÚSTICAS AL ORÉGANO',
    'QUIFAROS AL OREGANO': 'QUÍFAROS AL ORÉGANO',
    'PURE DE PAPAS': 'PURÉ DE PAPAS',
    'LASANA JAMON QUESO': 'LASAÑA JAMÓN QUESO',
    'COCA COLA ZERO': 'COCA COLA ZERO',
    'BEBIDA CCU DEL DIA': 'BEBIDA CCU DEL DÍA',
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
      correo: `${slugCorreo(nombreUsuario)}@ifco.local`,
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

  if (existente) {
    if (existente.categoria !== categoria || existente.tipo !== tipo) {
      return db.plato.update({
        where: { id: existente.id },
        data: {
          categoria,
          tipo,
        },
      });
    }

    return existente;
  }

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

  console.log('Carga masiva IFCO finalizada');
  console.table({
    empresaId: EMPRESA_ID,
    pedidosCreados,
    pedidosOmitidos,
  });
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed IFCO:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });