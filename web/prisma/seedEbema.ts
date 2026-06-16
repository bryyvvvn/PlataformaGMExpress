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

const EMPRESA_ID = 13;
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
  { cantidad: 1, nombre: 'ALEJANDRO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'DANIEL', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'SOPA', bebida: null },
  { cantidad: 1, nombre: 'FRANCISCO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'CAMPESINA DE VACUNO', bebida: 'SPRITE' },
  { cantidad: 1, nombre: 'JONATHAN', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'JHONS', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PATRICIO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CHILENA', bebida: null },
  { cantidad: 1, nombre: 'RODRIGO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE LECHUGA MILANESA', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ROXANA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE LECHUGA MILANESA', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ASTUDILLO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA ZERO' },
  { cantidad: 1, nombre: 'VIVIANA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PEDRO', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'CHILENA', bebida: null },
  { cantidad: 1, nombre: 'ANITA', fondo: 'FRICASÉ DE VACUNO', guarnicion: 'ARROZ GRANEADO', entrada: 'LECHUGA MILANESA', bebida: null },
];

const pedidosMartes: PedidoSeed[] = [
  { cantidad: 1, nombre: 'ALEJANDRO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'POLLO MEDITERRÁNEO', bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'DANIEL', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'SOPA', bebida: null },
  { cantidad: 1, nombre: 'FRANCISCO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'POLLO MEDITERRÁNEO', bebida: 'SPRITE' },
  { cantidad: 1, nombre: 'JONATHAN', fondo: 'ATÚN EN LATA', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'JHONS', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'POLLO MEDITERRÁNEO', bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PATRICIO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'POLLO MEDITERRÁNEO', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'RODRIGO', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE CEVICHE DE ZAPALLO', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ROXANA', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'ZANAHORIA-COLIFLOR', bebida: null },
  { cantidad: 1, nombre: 'ASTUDILLO', fondo: 'CROQUETAS DE ATÚN ATOMATADAS', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: null, bebida: 'COCA COLA ZERO' },
  { cantidad: 1, nombre: 'VIVIANA', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'POLLO MEDITERRÁNEO', bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PEDRO', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'PAPAS RÚSTICAS AL ORÉGANO', entrada: 'SOPA', bebida: null },
  { cantidad: 1, nombre: 'ANITA', fondo: 'PASTEL DE ZAPALLO ITALIANO', guarnicion: 'QUÍFAROS AL ORÉGANO', entrada: 'ZANAHORIA', bebida: null },
];

const pedidosMiercoles: PedidoSeed[] = [
  { cantidad: 1, nombre: 'ALEJANDRO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'CAZUELA SECA + ENSALADA', bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'DANIEL', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'BETARRAGA RALLADA', bebida: null },
  { cantidad: 1, nombre: 'FRANCISCO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'CAZUELA SECA + ENSALADA', bebida: 'SPRITE' },
  { cantidad: 1, nombre: 'JONATHAN', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'JHONS', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PATRICIO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'CAZUELA SECA + ENSALADA', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'RODRIGO', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE MIX DE LECHUGA', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ROXANA', fondo: 'CERDO BRASEADO AL ROMERO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE MIX DE LECHUGA', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ASTUDILLO', fondo: 'ATÚN EN LATA', guarnicion: 'CORBATITAS AL POMODORO', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'VIVIANA', fondo: 'HAMBURGUESA LECHUGA TOMATE', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PEDRO', fondo: 'ATÚN EN LATA', guarnicion: 'CORBATITAS AL POMODORO', entrada: 'ARVEJITA-PALMITO', bebida: null },
  { cantidad: 1, nombre: 'ANITA', fondo: 'CAZUELA DE POLLO', guarnicion: null, entrada: 'BETARRAGA RALLADA', bebida: null },
];

const pedidosJueves: PedidoSeed[] = [
  { cantidad: 1, nombre: 'ALEJANDRO', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'DANIEL', fondo: 'POLLO BROASTER', guarnicion: 'PAPAS FRITAS', entrada: 'SOPA', bebida: null },
  { cantidad: 1, nombre: 'FRANCISCO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: '2 FAJITAS DE POLLO', bebida: 'SPRITE' },
  { cantidad: 1, nombre: 'JONATHAN', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'JHONS', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PATRICIO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: '2 FAJITAS DE POLLO', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'RODRIGO', fondo: 'POLLO BROASTER', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE MIX DE REPOLLO', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ROXANA', fondo: 'POLLO BROASTER', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'SPRITE ZERO' },
  { cantidad: 1, nombre: 'ASTUDILLO', fondo: 'POLLO BROASTER', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: null, bebida: 'COCA COLA ZERO' },
  { cantidad: 1, nombre: 'VIVIANA', fondo: 'POLLO BROASTER', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PEDRO', fondo: 'BOX GM SANDWICH', guarnicion: 'PAPAS FRITAS', entrada: null, bebida: 'SPRITE' },
  { cantidad: 1, nombre: 'ANITA', fondo: 'BOX GM SANDWICH', guarnicion: 'ARROZ Y PAPAS FRITAS', entrada: 'PEPINO', bebida: null },
];

const pedidosViernes: PedidoSeed[] = [
  { cantidad: 1, nombre: 'ALEJANDRO', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'DANIEL', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: 'BETARRAGA-ZANAHORIA', bebida: null },
  { cantidad: 1, nombre: 'FRANCISCO', fondo: 'HIPOCALORICO DEL DIA', guarnicion: null, entrada: 'POLLO CON SALSA BLANCA Y CHOCLO', bebida: 'SPRITE' },
  { cantidad: 1, nombre: 'JONATHAN', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'JHONS', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PATRICIO', fondo: 'ATÚN EN LATA', guarnicion: 'PURÉ DE PAPAS', entrada: 'SOPA', bebida: null },
  { cantidad: 1, nombre: 'RODRIGO', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE TOMATE', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ROXANA', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'ENSALADA GRANDE', entrada: 'GRANDE TOMATE', bebida: 'SOPA' },
  { cantidad: 1, nombre: 'ASTUDILLO', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: null, bebida: 'COCA COLA ZERO' },
  { cantidad: 1, nombre: 'VIVIANA', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: null, bebida: 'COCA COLA' },
  { cantidad: 1, nombre: 'PEDRO', fondo: 'LASAÑA JAMÓN QUESO', guarnicion: null, entrada: 'TOMATE', bebida: null },
  { cantidad: 1, nombre: 'ANITA', fondo: 'POLLO CON SALSA BLANCA Y CHOCLO', guarnicion: 'PURÉ DE PAPAS', entrada: 'BETARRAGA-ZANAHORIA', bebida: null },
];

const semana = [
  { fecha: new Date('2026-06-01T12:00:00Z'), pedidos: pedidosLunes },
  { fecha: new Date('2026-06-02T12:00:00Z'), pedidos: pedidosMartes },
  { fecha: new Date('2026-06-03T12:00:00Z'), pedidos: pedidosMiercoles },
  { fecha: new Date('2026-06-04T12:00:00Z'), pedidos: pedidosJueves },
  { fecha: new Date('2026-06-05T12:00:00Z'), pedidos: pedidosViernes },
];

const nombresChilenos = [
  'Matias Soto',
  'Felipe Rojas',
  'Diego Muñoz',
  'Cristobal Torres',
  'Javier Morales',
  'Ignacio Silva',
  'Sebastian Araya',
  'Nicolas Herrera',
  'Benjamin Castro',
  'Vicente Fuentes',
  'Rodrigo Salazar',
  'Pablo Medina',
  'Esteban Aguilera',
  'Camilo Vera',
  'Francisco Pizarro',
  'Martin Contreras',
  'Mauricio Figueroa',
  'Claudio Tapia',
  'Hector Gonzalez',
  'Eduardo Reyes',
  'Luis Ramirez',
  'Carlos Sepulveda',
  'Juan Espinoza',
  'Andres Valenzuela',
];

const gruposGenericos = new Set([
  'CAMIONES',
  'MECANICOS',
  'MECÁNICOS',
  'OPERARIOS',
  'TRABAJADORES',
  'INVITADOS',
  'PERSONAL',
]);

const nombresPersistentesPorGrupo = new Map<string, string>();
const nombresGeneradosUsados = new Set<string>();

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

  if (
    normalizado.includes('BOX GM') ||
    normalizado.includes('SANDWICH HAME') ||
    normalizado.includes('SANDWICH HAMBURGUES')
  ) {
    return 'BOX GM SANDWICH';
  }

  const alias: Record<string, string> = {
    'FRICASE DE VACUNO': 'FRICASÉ DE VACUNO',
    'HIPOCALORICO DEL DIA': 'HIPOCALORICO DEL DIA',
    'PURE DE PAPAS': 'PURÉ DE PAPAS',
    'PAPAS RUSTICAS AL OREGANO': 'PAPAS RÚSTICAS AL ORÉGANO',
    'QUIFAROS AL OREGANO': 'QUÍFAROS AL ORÉGANO',
    'ATUN EN LATA': 'ATÚN EN LATA',
    'CROQUETAS DE ATUN ATOMATADA': 'CROQUETAS DE ATÚN ATOMATADAS',
    'CROQUETAS DE ATUN ATOMATADAS': 'CROQUETAS DE ATÚN ATOMATADAS',
    'LASANA JAMON QUESO': 'LASAÑA JAMÓN QUESO',
    'COCA COLA ZERO': 'COCA COLA ZERO',
    'SPRITE ZERO': 'SPRITE ZERO',
    'SPRITE': 'SPRITE',
    'COCA COLA': 'COCA COLA',
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

function limpiarNombreGrupo(nombre: string): string {
  return quitarTildes(nombre.replace(/^\d+\s+/, '').trim().toUpperCase());
}

function esGrupoGenerico(pedido: PedidoSeed): boolean {
  const nombreGrupo = limpiarNombreGrupo(pedido.nombre);
  return pedido.cantidad > 1 || gruposGenericos.has(nombreGrupo);
}

function hashSimple(texto: string): number {
  return texto.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function obtenerNombrePersistenteGrupo(grupo: string, indice: number): string {
  const grupoLimpio = limpiarNombreGrupo(grupo);
  const key = `${grupoLimpio}:${indice}`;

  const existente = nombresPersistentesPorGrupo.get(key);
  if (existente) return existente;

  const baseIndex = Math.abs(hashSimple(key)) % nombresChilenos.length;
  let nombre = nombresChilenos[baseIndex];
  let intento = 0;

  while (nombresGeneradosUsados.has(nombre) && intento < nombresChilenos.length) {
    intento += 1;
    nombre = nombresChilenos[(baseIndex + intento) % nombresChilenos.length];
  }

  if (nombresGeneradosUsados.has(nombre)) {
    nombre = `${nombre} ${indice + 1}`;
  }

  nombresPersistentesPorGrupo.set(key, nombre);
  nombresGeneradosUsados.add(nombre);

  return nombre;
}

function expandirPedido(pedido: PedidoSeed): PedidoSeed[] {
  if (!esGrupoGenerico(pedido)) {
    return [
      {
        ...pedido,
        cantidad: 1,
        nombre: normalizarNombreUsuario(pedido.nombre),
      },
    ];
  }

  const grupo = limpiarNombreGrupo(pedido.nombre);

  return Array.from({ length: pedido.cantidad }, (_, index) => ({
    ...pedido,
    cantidad: 1,
    nombre: obtenerNombrePersistenteGrupo(grupo, index),
  }));
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
  if (texto.includes('PLATO UNICO')) return VarianteMenu.PLATO_UNICO;

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
      correo: `${slugCorreo(nombreUsuario)}@gmexpress.local`,
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
    for (const pedidoBase of dia.pedidos) {
      const pedidosExpandidos = expandirPedido(pedidoBase);

      for (const pedido of pedidosExpandidos) {
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
  }

  console.log('Carga masiva finalizada');
  console.table({
    empresaId: EMPRESA_ID,
    pedidosCreados,
    pedidosOmitidos,
  });
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });