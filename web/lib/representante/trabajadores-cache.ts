import type { EstadoPedido } from '@prisma/client';
import db from '@/lib/db';

const CHILE_TIMEZONE = 'America/Santiago';
const CACHE_TTL_MS = 1000 * 60 * 60 * 4;
const MAX_CACHE_ENTRIES = 100;

export type EmpleadosCacheStatus = 'HIT' | 'MISS' | 'REFRESH';

export type PedidoEmpleadoRepresentante = {
  id: number;
  fecha: string;
  estado: EstadoPedido;
  esCena: boolean;
  listaPlatos: string[];
};

export type EmpleadoRepresentante = {
  id: string;
  nombre: string | null;
  rut: string | null;
  diasBloqueados: number[];
  pedidos: PedidoEmpleadoRepresentante[];
};

type EmpleadosCacheEntry = {
  data: EmpleadoRepresentante[];
  timestamp: number;
};

const empleadosCache = new Map<string, EmpleadosCacheEntry>();
const empleadosRequestsInFlight = new Map<string, Promise<EmpleadoRepresentante[]>>();

function getChileDateString() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHILE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function normalizarFechaEmpleados(fecha?: string | null) {
  if (!fecha) return getChileDateString();

  const fechaNormalizada = fecha.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {
    return fechaNormalizada;
  }

  return getChileDateString();
}

function getCacheKey(empresaId: number, fechaISO: string) {
  return `empleados:${empresaId}:${fechaISO}`;
}

function limpiarCacheViejo() {
  if (empleadosCache.size <= MAX_CACHE_ENTRIES) return;

  const expiracion = Date.now() - CACHE_TTL_MS;
  for (const [cacheKey, value] of empleadosCache.entries()) {
    if (value.timestamp < expiracion) {
      empleadosCache.delete(cacheKey);
    }
  }

  if (empleadosCache.size > MAX_CACHE_ENTRIES) {
    const sobrantes = empleadosCache.size - MAX_CACHE_ENTRIES;
    Array.from(empleadosCache.keys()).slice(0, sobrantes).forEach((cacheKey) => {
      empleadosCache.delete(cacheKey);
    });
  }
}

async function cargarEmpleadosDesdeDb(empresaId: number, fechaISO: string) {
  const fechaBase = new Date(`${fechaISO}T12:00:00`);
  const diaSemana = fechaBase.getDay() || 7;
  const inicioSemana = new Date(fechaBase);
  inicioSemana.setDate(fechaBase.getDate() - diaSemana + 1);
  inicioSemana.setHours(0, 0, 0, 0);

  const empresa = await db.empresa.findUnique({
    where: { id: empresaId },
    select: {
      ConvenioEmpresa: {
        select: {
          trabajaFinDeSemana: true,
          permiteCena: true,
        },
      },
    },
  });
  const convenio = {
    trabajaFinDeSemana: Boolean(empresa?.ConvenioEmpresa?.trabajaFinDeSemana),
    permiteCena: Boolean(empresa?.ConvenioEmpresa?.permiteCena),
  };

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + (convenio.trabajaFinDeSemana ? 6 : 4));
  finSemana.setHours(23, 59, 59, 999);

  const usuarios = await db.usuario.findMany({
    where: { empresaId, rol: 'TRABAJADOR' },
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      nombre: true,
      rut: true,
      diasBloqueados: true,
      pedidos: {
        where: {
          fecha: { gte: inicioSemana, lte: finSemana },
          ...(convenio.permiteCena ? {} : { esCena: false }),
        },
        orderBy: { fecha: 'asc' },
        select: {
          id: true,
          fecha: true,
          estado: true,
          esCena: true,
          detalles: {
            select: {
              plato: { select: { nombre: true } },
              guarnicion: { select: { nombre: true } },
            },
          },
        },
      },
    },
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    rut: usuario.rut,
    diasBloqueados: usuario.diasBloqueados,
    pedidos: usuario.pedidos.map((pedido) => {
      const listaPlatos = pedido.detalles.map((detalle) => {
        if (detalle.guarnicion) return `${detalle.plato.nombre} + ${detalle.guarnicion.nombre}`;
        return detalle.plato.nombre;
      });

      return {
        id: pedido.id,
        fecha: pedido.fecha.toISOString(),
        estado: pedido.estado,
        esCena: pedido.esCena,
        listaPlatos: listaPlatos.length > 0 ? listaPlatos : ['Menu Seleccionado'],
      };
    }),
  }));
}

export async function obtenerEmpleadosRepresentante(params: {
  empresaId: number;
  fecha?: string | null;
  forceRefresh?: boolean;
}) {
  limpiarCacheViejo();

  const fechaISO = normalizarFechaEmpleados(params.fecha);
  const cacheKey = getCacheKey(params.empresaId, fechaISO);
  const now = Date.now();
  const cached = empleadosCache.get(cacheKey);

  if (!params.forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[EMPLEADOS cache HIT] empresa=${params.empresaId} fecha=${fechaISO}`);
    return { data: cached.data, cacheStatus: 'HIT' as const, fechaISO, cacheKey };
  }

  const status: EmpleadosCacheStatus = params.forceRefresh || cached ? 'REFRESH' : 'MISS';
  console.log(`[EMPLEADOS cache ${status}] empresa=${params.empresaId} fecha=${fechaISO}`);

  let request = empleadosRequestsInFlight.get(cacheKey);
  if (!request || params.forceRefresh) {
    request = cargarEmpleadosDesdeDb(params.empresaId, fechaISO).then((data) => {
      empleadosCache.set(cacheKey, { data, timestamp: Date.now() });
      console.log(`[EMPLEADOS cache SET] empresa=${params.empresaId} fecha=${fechaISO} usuarios=${data.length}`);
      return data;
    });

    empleadosRequestsInFlight.set(cacheKey, request);
  }

  try {
    const data = await request;
    return { data, cacheStatus: status, fechaISO, cacheKey };
  } finally {
    if (empleadosRequestsInFlight.get(cacheKey) === request) {
      empleadosRequestsInFlight.delete(cacheKey);
    }
  }
}

export function obtenerEmpleadosCacheStats() {
  return {
    entries: empleadosCache.size,
    inFlight: empleadosRequestsInFlight.size,
    ttlMs: CACHE_TTL_MS,
  };
}
