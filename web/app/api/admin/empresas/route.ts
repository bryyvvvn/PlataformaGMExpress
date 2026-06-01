import { NextRequest, NextResponse } from "next/server"
import { EstadoEmpresa, Prisma, Rol, TipoContactoEmpresa } from "@prisma/client"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

const CONVENIO_DEFAULTS = {
  permitePlato: true,
  permiteEntrada: true,
  permitePostre: true,
  permitePan: true,
  permiteJugo: true,
  permiteBebida: false,
  permiteAguaSaborizada: false,
}

const CAMPOS_CONVENIO = [
  "permitePlato",
  "permiteEntrada",
  "permitePostre",
  "permitePan",
  "permiteJugo",
  "permiteBebida",
  "permiteAguaSaborizada",
] as const

type CampoConvenio = (typeof CAMPOS_CONVENIO)[number]
type ConvenioData = Record<CampoConvenio, boolean>

type ValidationResult<T> = { data: T } | { error: string }

type EmpresaCreateData = {
  nombre: string
  razonSocial: string | null
  rut: string | null
  nombreComercial: string | null
  correo_contacto: string | null
  telefono: string | null
  direccion: string | null
  comuna: string | null
  region: string | null
  sector: string | null
  nombreFaena: string | null
  direccionFaena: string | null
  representanteLegal: string | null
  rutRepresentanteLegal: string | null
  estado: EstadoEmpresa
}

type ContactoCreateData = {
  tipo: TipoContactoEmpresa
  nombresApellidos: string | null
  rut: string | null
  rolCargo: string | null
  telefono: string | null
  email: string | null
  fechaNacimiento: Date | null
}

type CrearEmpresaData = {
  empresa: EmpresaCreateData
  convenio: ConvenioData
  contactos: ContactoCreateData[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizarStringOpcional(
  value: unknown,
  campo: string,
  maxLength: number
): ValidationResult<string | null> {
  if (value === undefined || value === null) {
    return { data: null }
  }

  if (typeof value !== "string") {
    return { error: `El campo ${campo} debe ser texto` }
  }

  const normalized = value.trim()

  if (normalized.length === 0) {
    return { data: null }
  }

  if (normalized.length > maxLength) {
    return { error: `El campo ${campo} no puede superar ${maxLength} caracteres` }
  }

  return { data: normalized }
}

function validarEmail(value: string, campo: string): ValidationResult<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(value)) {
    return { error: `El campo ${campo} debe ser un email valido` }
  }

  return { data: value }
}

function validarEstadoEmpresa(value: unknown): ValidationResult<EstadoEmpresa> {
  if (value === undefined || value === null || value === "") {
    return { data: EstadoEmpresa.ACTIVA }
  }

  if (value !== EstadoEmpresa.ACTIVA && value !== EstadoEmpresa.INACTIVA) {
    return { error: "El estado debe ser ACTIVA o INACTIVA" }
  }

  return { data: value }
}

function validarConvenio(value: unknown): ValidationResult<ConvenioData> {
  if (value === undefined || value === null) {
    return { data: CONVENIO_DEFAULTS }
  }

  if (!isRecord(value)) {
    return { error: "El convenio debe ser un objeto JSON" }
  }

  const camposPermitidos = new Set<string>(CAMPOS_CONVENIO)
  const camposExtra = Object.keys(value).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos de convenio no permitidos: ${camposExtra.join(", ")}` }
  }

  for (const campo of CAMPOS_CONVENIO) {
    if (!(campo in value)) {
      return { error: `Falta el campo de convenio ${campo}` }
    }

    if (typeof value[campo] !== "boolean") {
      return { error: `El campo de convenio ${campo} debe ser booleano` }
    }
  }

  return {
    data: CAMPOS_CONVENIO.reduce(
      (acc, campo) => ({
        ...acc,
        [campo]: value[campo],
      }),
      {} as ConvenioData
    ),
  }
}

function validarFechaNacimiento(value: unknown): ValidationResult<Date | null> {
  if (value === undefined || value === null || value === "") {
    return { data: null }
  }

  if (typeof value !== "string") {
    return { error: "fechaNacimiento debe ser una fecha valida o null" }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { error: "fechaNacimiento debe ser una fecha valida o null" }
  }

  return { data: date }
}

function contactoEstaVacio(value: Record<string, unknown>) {
  return [
    "nombresApellidos",
    "rut",
    "rolCargo",
    "telefono",
    "email",
    "fechaNacimiento",
  ].every((campo) => {
    const item = value[campo]
    return item === undefined || item === null || item === ""
  })
}

function validarContacto(
  value: unknown,
  tipo: TipoContactoEmpresa,
  nombreCampo: string
): ValidationResult<ContactoCreateData | null> {
  if (value === undefined || value === null) {
    return { data: null }
  }

  if (!isRecord(value)) {
    return { error: `${nombreCampo} debe ser un objeto JSON` }
  }

  const camposPermitidos = new Set([
    "nombresApellidos",
    "rut",
    "rolCargo",
    "telefono",
    "email",
    "fechaNacimiento",
  ])
  const camposExtra = Object.keys(value).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos no permitidos en ${nombreCampo}: ${camposExtra.join(", ")}` }
  }

  if (contactoEstaVacio(value)) {
    return { data: null }
  }

  const nombresApellidos = normalizarStringOpcional(
    value.nombresApellidos,
    `${nombreCampo}.nombresApellidos`,
    150
  )
  if ("error" in nombresApellidos) return nombresApellidos

  const rut = normalizarStringOpcional(value.rut, `${nombreCampo}.rut`, 20)
  if ("error" in rut) return rut

  const rolCargo = normalizarStringOpcional(value.rolCargo, `${nombreCampo}.rolCargo`, 100)
  if ("error" in rolCargo) return rolCargo

  const telefono = normalizarStringOpcional(value.telefono, `${nombreCampo}.telefono`, 30)
  if ("error" in telefono) return telefono

  const email = normalizarStringOpcional(value.email, `${nombreCampo}.email`, 100)
  if ("error" in email) return email

  if (email.data) {
    const emailValidado = validarEmail(email.data, `${nombreCampo}.email`)
    if ("error" in emailValidado) return emailValidado
  }

  const fechaNacimiento = validarFechaNacimiento(value.fechaNacimiento)
  if ("error" in fechaNacimiento) return fechaNacimiento

  return {
    data: {
      tipo,
      nombresApellidos: nombresApellidos.data,
      rut: rut.data,
      rolCargo: rolCargo.data,
      telefono: telefono.data,
      email: email.data,
      fechaNacimiento: fechaNacimiento.data,
    },
  }
}

function validarCrearEmpresaPayload(body: unknown): ValidationResult<CrearEmpresaData> {
  if (!isRecord(body)) {
    return { error: "El body debe ser un objeto JSON" }
  }

  const camposPermitidos = new Set([
    "nombre",
    "razonSocial",
    "rut",
    "nombreComercial",
    "correo_contacto",
    "telefono",
    "direccion",
    "comuna",
    "region",
    "sector",
    "nombreFaena",
    "direccionFaena",
    "representanteLegal",
    "rutRepresentanteLegal",
    "estado",
    "convenio",
    "contactoTitular",
    "contactoSuplente",
  ])
  const camposExtra = Object.keys(body).filter((key) => !camposPermitidos.has(key))

  if (camposExtra.length > 0) {
    return { error: `Campos no permitidos: ${camposExtra.join(", ")}` }
  }

  if (typeof body.nombre !== "string") {
    return { error: "El nombre es obligatorio" }
  }

  const nombre = body.nombre.trim()

  if (nombre.length === 0) {
    return { error: "El nombre es obligatorio" }
  }

  if (nombre.length > 100) {
    return { error: "El nombre no puede superar 100 caracteres" }
  }

  const razonSocial = normalizarStringOpcional(body.razonSocial, "razonSocial", 150)
  if ("error" in razonSocial) return razonSocial

  const rut = normalizarStringOpcional(body.rut, "rut", 20)
  if ("error" in rut) return rut

  const nombreComercial = normalizarStringOpcional(body.nombreComercial, "nombreComercial", 100)
  if ("error" in nombreComercial) return nombreComercial

  const correoContacto = normalizarStringOpcional(body.correo_contacto, "correo_contacto", 100)
  if ("error" in correoContacto) return correoContacto

  if (correoContacto.data) {
    const emailValidado = validarEmail(correoContacto.data, "correo_contacto")
    if ("error" in emailValidado) return emailValidado
  }

  const telefono = normalizarStringOpcional(body.telefono, "telefono", 30)
  if ("error" in telefono) return telefono

  const direccion = normalizarStringOpcional(body.direccion, "direccion", 150)
  if ("error" in direccion) return direccion

  const comuna = normalizarStringOpcional(body.comuna, "comuna", 80)
  if ("error" in comuna) return comuna

  const region = normalizarStringOpcional(body.region, "region", 80)
  if ("error" in region) return region

  const sector = normalizarStringOpcional(body.sector, "sector", 80)
  if ("error" in sector) return sector

  const nombreFaena = normalizarStringOpcional(body.nombreFaena, "nombreFaena", 100)
  if ("error" in nombreFaena) return nombreFaena

  const direccionFaena = normalizarStringOpcional(body.direccionFaena, "direccionFaena", 150)
  if ("error" in direccionFaena) return direccionFaena

  const representanteLegal = normalizarStringOpcional(
    body.representanteLegal,
    "representanteLegal",
    150
  )
  if ("error" in representanteLegal) return representanteLegal

  const rutRepresentanteLegal = normalizarStringOpcional(
    body.rutRepresentanteLegal,
    "rutRepresentanteLegal",
    20
  )
  if ("error" in rutRepresentanteLegal) return rutRepresentanteLegal

  const estado = validarEstadoEmpresa(body.estado)
  if ("error" in estado) return estado

  const convenio = validarConvenio(body.convenio)
  if ("error" in convenio) return convenio

  const contactoTitular = validarContacto(
    body.contactoTitular,
    TipoContactoEmpresa.TITULAR,
    "contactoTitular"
  )
  if ("error" in contactoTitular) return contactoTitular

  const contactoSuplente = validarContacto(
    body.contactoSuplente,
    TipoContactoEmpresa.SUPLENTE,
    "contactoSuplente"
  )
  if ("error" in contactoSuplente) return contactoSuplente

  return {
    data: {
      empresa: {
        nombre,
        razonSocial: razonSocial.data,
        rut: rut.data,
        nombreComercial: nombreComercial.data,
        correo_contacto: correoContacto.data,
        telefono: telefono.data,
        direccion: direccion.data,
        comuna: comuna.data,
        region: region.data,
        sector: sector.data,
        nombreFaena: nombreFaena.data,
        direccionFaena: direccionFaena.data,
        representanteLegal: representanteLegal.data,
        rutRepresentanteLegal: rutRepresentanteLegal.data,
        estado: estado.data,
      },
      convenio: convenio.data,
      contactos: [contactoTitular.data, contactoSuplente.data].filter(
        (contacto): contacto is ContactoCreateData => contacto !== null
      ),
    },
  }
}

export async function GET() {
  try {
    const [empresas, usuariosPorRol, pedidosPorEmpresa] = await Promise.all([
      db.empresa.findMany({
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          rut: true,
          nombreComercial: true,
          correo_contacto: true,
          telefono: true,
          direccion: true,
          comuna: true,
          region: true,
          sector: true,
          estado: true,
          ConvenioEmpresa: {
            select: {
              id: true,
              permitePlato: true,
              permiteEntrada: true,
              permitePostre: true,
              permitePan: true,
              permiteJugo: true,
              permiteBebida: true,
              permiteAguaSaborizada: true,
            },
          },
        },
      }),
      db.usuario.groupBy({
        by: ["empresaId", "rol"],
        where: {
          empresaId: { not: null },
          rol: { in: [Rol.TRABAJADOR, Rol.REPRESENTANTE] },
        },
        _count: { _all: true },
      }),
      db.pedido.groupBy({
        by: ["empresaId"],
        _count: { _all: true },
      }),
    ])

    const usuariosCount = new Map<string, number>()
    for (const item of usuariosPorRol) {
      if (item.empresaId === null) continue
      usuariosCount.set(`${item.empresaId}:${item.rol}`, item._count._all)
    }

    const pedidosCount = new Map<number, number>()
    for (const item of pedidosPorEmpresa) {
      pedidosCount.set(item.empresaId, item._count._all)
    }

    const data = empresas.map((empresa) => ({
      ...empresa,
      trabajadores: usuariosCount.get(`${empresa.id}:${Rol.TRABAJADOR}`) ?? 0,
      representantes: usuariosCount.get(`${empresa.id}:${Rol.REPRESENTANTE}`) ?? 0,
      pedidos: pedidosCount.get(empresa.id) ?? 0,
    }))

    return NextResponse.json({ empresas: data })
  } catch (error) {
    console.error("[admin/empresas] Error:", error)
    return NextResponse.json(
      { error: "No se pudieron cargar las empresas" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 })
    }

    const payload = validarCrearEmpresaPayload(body)

    if ("error" in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const empresaExistente = await db.empresa.findUnique({
      where: { nombre: payload.data.empresa.nombre },
      select: { id: true },
    })

    if (empresaExistente) {
      return NextResponse.json(
        { error: "Ya existe una empresa con ese nombre" },
        { status: 409 }
      )
    }

    const empresa = await db.$transaction(async (tx) => {
      const nuevaEmpresa = await tx.empresa.create({
        data: payload.data.empresa,
        select: { id: true },
      })

      await tx.convenioEmpresa.create({
        data: {
          empresaId: nuevaEmpresa.id,
          ...payload.data.convenio,
        },
      })

      if (payload.data.contactos.length > 0) {
        await tx.contactoEmpresa.createMany({
          data: payload.data.contactos.map((contacto) => ({
            empresaId: nuevaEmpresa.id,
            ...contacto,
          })),
        })
      }

      return tx.empresa.findUniqueOrThrow({
        where: { id: nuevaEmpresa.id },
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          rut: true,
          nombreComercial: true,
          correo_contacto: true,
          telefono: true,
          direccion: true,
          comuna: true,
          region: true,
          sector: true,
          nombreFaena: true,
          direccionFaena: true,
          representanteLegal: true,
          rutRepresentanteLegal: true,
          estado: true,
          convenio: {
            select: {
              id: true,
              permitePlato: true,
              permiteEntrada: true,
              permitePostre: true,
              permitePan: true,
              permiteJugo: true,
              permiteBebida: true,
              permiteAguaSaborizada: true,
            },
          },
          contactos: {
            select: {
              id: true,
              tipo: true,
              nombresApellidos: true,
              rut: true,
              rolCargo: true,
              telefono: true,
              email: true,
              fechaNacimiento: true,
            },
            orderBy: { id: "asc" },
          },
        },
      })
    })

    return NextResponse.json({ empresa }, { status: 201 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una empresa con ese nombre" },
        { status: 409 }
      )
    }

    console.error("[admin/empresas] Error creando:", error)
    return NextResponse.json(
      { error: "No se pudo crear la empresa" },
      { status: 500 }
    )
  }
}
