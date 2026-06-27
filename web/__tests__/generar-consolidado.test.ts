import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CategoriaPlato, EstadoEmpresa, VarianteMenu } from '@prisma/client'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/chile-time', () => ({
  CHILE_TZ: 'America/Santiago',
  chileStartOfDay: vi.fn().mockReturnValue(new Date('2026-06-16T04:00:00Z')),
  chileEndOfDay: vi.fn().mockReturnValue(new Date('2026-06-17T03:59:59Z')),
}))

vi.mock('@/lib/db', () => ({
  default: {
    pedido: { findMany: vi.fn() },
    pedidoManual: { findMany: vi.fn() },
  },
}))

import { getConsolidadoDia } from '../lib/admin/generar-consolidado'
import db from '../lib/db'

type PedidoConDetalles = Prisma.PedidoGetPayload<{
  include: {
    detalles: { include: { plato: true; guarnicion: true } }
    empresa: { include: { ConvenioEmpresa: { select: { tipoEmpaquetado: true } } } }
  }
}>

type PedidoManualConEmpresa = Prisma.PedidoManualGetPayload<{
  include: { empresa: true }
}>

type EmpresaScalars = PedidoManualConEmpresa['empresa']
type EmpresaConConvenio = PedidoConDetalles['empresa']
type DetalleConPlato = PedidoConDetalles['detalles'][number]

let proximoId = 1
function siguienteId(): number {
  return proximoId++
}

function crearEmpresaScalars(id: number, nombre: string): EmpresaScalars {
  return {
    id,
    nombre,
    correo_contacto: null,
    razonSocial: null,
    rut: null,
    nombreComercial: null,
    telefono: null,
    direccion: null,
    comuna: null,
    region: null,
    sector: null,
    nombreFaena: null,
    direccionFaena: null,
    representanteLegal: null,
    rutRepresentanteLegal: null,
    fechaNacimientoRepresentanteLegal: null,
    estado: 'ACTIVA' as EstadoEmpresa,
    horaDespacho: null,
    esSucursal: false,
    casaMatrizId: null,
    creado_en: new Date('2026-01-01T00:00:00Z'),
    actualizado_en: new Date('2026-01-01T00:00:00Z'),
  }
}

function crearEmpresaConConvenio(id: number, nombre: string): EmpresaConConvenio {
  return {
    ...crearEmpresaScalars(id, nombre),
    ConvenioEmpresa: null,
  }
}

type DetalleOverride = {
  platoNombre: string
  categoria: CategoriaPlato
  tipo?: VarianteMenu
  cantidad?: number
  guarnicion?: string | null
}

function crearDetalle(pedidoId: number, override: DetalleOverride): DetalleConPlato {
  const platoId = siguienteId()
  return {
    id: siguienteId(),
    pedidoId,
    platoId,
    cantidad: override.cantidad ?? 1,
    guarnicionId: override.guarnicion ? siguienteId() : null,
    plato: {
      id: platoId,
      nombre: override.platoNombre,
      url_imagen: null,
      categoria: override.categoria,
      tipo: override.tipo ?? ('NORMAL' as VarianteMenu),
      calorias: null,
      proteinas: null,
      carbohidratos: null,
      grasas: null,
    },
    guarnicion: override.guarnicion
      ? { id: siguienteId(), nombre: override.guarnicion }
      : null,
  }
}

function crearPedido(overrides: {
  empresaId?: number
  empresaNombre?: string
  detalles?: DetalleOverride[]
}): PedidoConDetalles {
  const empresaId = overrides.empresaId ?? 1
  const pedidoId = siguienteId()

  return {
    id: pedidoId,
    fecha: new Date('2026-06-16T15:00:00Z'),
    estado: 'CONFIRMADO',
    empresaId,
    usuarioId: 'usuario-test',
    observacion: null,
    detalles: (overrides.detalles ?? []).map((d) => crearDetalle(pedidoId, d)),
    empresa: crearEmpresaConConvenio(empresaId, overrides.empresaNombre ?? 'Empresa Test'),
  }
}

function crearPedidoManual(overrides: {
  empresaId?: number
  empresaNombre?: string
  cantidad: number
}): PedidoManualConEmpresa {
  const empresaId = overrides.empresaId ?? 1

  return {
    id: siguienteId(),
    empresaId,
    fecha: new Date('2026-06-16T15:00:00Z'),
    cantidad: overrides.cantidad,
    observacion: null,
    creado_por: null,
    creado_en: new Date('2026-01-01T00:00:00Z'),
    actualizado_en: new Date('2026-01-01T00:00:00Z'),
    empresa: crearEmpresaScalars(empresaId, overrides.empresaNombre ?? 'Empresa Test'),
  }
}

beforeEach(() => {
  vi.mocked(db.pedidoManual.findMany).mockResolvedValue([])
})

describe('zonaFria — clasificación correcta', () => {
  it('clasifica POSTRE en zona fría', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({ detalles: [{ platoNombre: 'Fruta del tiempo', categoria: 'POSTRE' }] }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.zonaFria).toHaveLength(1)
    expect(result.zonaFria[0].nombre).toBe('Fruta del tiempo')
  })

  it('clasifica ENTRADA sin sopa en zona fría', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({ detalles: [{ platoNombre: 'Ensalada mixta', categoria: 'ENTRADA' }] }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.zonaFria.some((i) => i.nombre === 'Ensalada mixta')).toBe(true)
    expect(result.zonaCaliente.some((i) => i.nombre === 'Ensalada mixta')).toBe(false)
  })

  it('clasifica ENTRADA con "sopa" en zona caliente', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({ detalles: [{ platoNombre: 'Sopa de verduras', categoria: 'ENTRADA' }] }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.zonaCaliente.some((i) => i.nombre === 'Sopa de verduras')).toBe(true)
    expect(result.zonaFria.some((i) => i.nombre === 'Sopa de verduras')).toBe(false)
  })

  it('es case-insensitive para "sopa"', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({ detalles: [{ platoNombre: 'SOPA DE POLLO', categoria: 'ENTRADA' }] }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.zonaCaliente.some((i) => i.nombre === 'SOPA DE POLLO')).toBe(true)
  })
})

describe('zonaCaliente — clasificación correcta', () => {
  it('clasifica FONDO en zona caliente', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({ detalles: [{ platoNombre: 'Pollo al horno', categoria: 'FONDO' }] }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.zonaCaliente.some((i) => i.nombre === 'Pollo al horno')).toBe(true)
  })

  it('agrega guarniciones como items separados en zona caliente', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({
        detalles: [
          { platoNombre: 'Pollo al horno', categoria: 'FONDO', guarnicion: 'Arroz blanco' },
        ],
      }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.zonaCaliente.some((i) => i.nombre === 'Arroz blanco')).toBe(true)
  })
})

describe('packing — agrupación por empresa', () => {
  it('agrupa raciones por empresa correctamente', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({
        empresaId: 1,
        empresaNombre: 'Minera A',
        detalles: [{ platoNombre: 'Pollo', categoria: 'FONDO', cantidad: 2 }],
      }),
      crearPedido({
        empresaId: 1,
        empresaNombre: 'Minera A',
        detalles: [{ platoNombre: 'Pollo', categoria: 'FONDO', cantidad: 1 }],
      }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    const empresa = result.packing.find((p) => p.empresa === 'Minera A')
    expect(empresa?.totalRaciones).toBe(3)
  })

  it('suma raciones manuales al packing', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({
        empresaId: 1,
        empresaNombre: 'Empresa X',
        detalles: [{ platoNombre: 'Pollo', categoria: 'FONDO', cantidad: 5 }],
      }),
    ])
    vi.mocked(db.pedidoManual.findMany).mockResolvedValue([
      crearPedidoManual({ empresaId: 1, empresaNombre: 'Empresa X', cantidad: 10 }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    const empresa = result.packing.find((p) => p.empresa === 'Empresa X')
    expect(empresa?.totalRaciones).toBe(15)
  })
})

describe('resumenGeneral', () => {
  it('identifica empresa con más pedidos', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({
        empresaId: 1,
        empresaNombre: 'Empresa Grande',
        detalles: [{ platoNombre: 'Pollo', categoria: 'FONDO', cantidad: 10 }],
      }),
      crearPedido({
        empresaId: 2,
        empresaNombre: 'Empresa Chica',
        detalles: [{ platoNombre: 'Pollo', categoria: 'FONDO', cantidad: 2 }],
      }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.resumenGeneral.empresaTopNombre).toBe('Empresa Grande')
    expect(result.resumenGeneral.empresaTopCantidad).toBe(10)
  })

  it('cuenta pedidos correctamente', async () => {
    vi.mocked(db.pedido.findMany).mockResolvedValue([
      crearPedido({ detalles: [{ platoNombre: 'A', categoria: 'FONDO' }] }),
      crearPedido({ detalles: [{ platoNombre: 'B', categoria: 'FONDO' }] }),
    ])
    const result = await getConsolidadoDia(new Date('2026-06-16'))
    expect(result.resumenGeneral.totalPedidos).toBe(2)
  })
})
