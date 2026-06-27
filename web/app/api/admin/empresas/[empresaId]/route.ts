import { NextRequest, NextResponse } from "next/server"
import { EstadoEmpresa, Prisma, Rol, TipoContactoEmpresa } from "@prisma/client"
import db from "@/lib/db"
import { validarAdministrador } from "@/lib/usuarios/admin"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ empresaId: string }>
}

type ValidationResult<T> = { data: T } | { error: string }

type EmpresaEditData = {
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
  fechaNacimientoRepresentanteLegal: Date | null
  estado: EstadoEmpresa
  horaDespacho: string | null
  esSucursal: boolean
  casaMatrizId: number | null
}

type ContactoEditData = {
  tipo: TipoContactoEmpresa
  nombresApellidos: string | null
  rut: string | null
  rolCargo: string | null
  telefono: string | null
  email: string | null
  fechaNacimiento: Date | null
}

type EditarEmpresaData = {
  empresa: EmpresaEditData
  contactoTitular: ContactoEditData
  contactoSuplente: ContactoEditData | null
  contactoCobranza: ContactoEditData
}

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const HORA_DESPACHO_MINIMA = "06:00"
const HORA_DESPACHO_MAXIMA = "23:00"

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

function normalizarStringObligatorio(
  value: unknown,
  campo: string,
  maxLength: number
): ValidationResult<string> {
  const normalized = normalizarStringOpcional(value, campo, maxLength)
  if ("error" in normalized) return normalized

  if (!normalized.data) {
    return { error: `El campo ${campo} es obligatorio` }
  }

  return { data: normalized.data }
}

function validarEmail(value: string, campo: string): ValidationResult<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(value)) {
    return { error: `El campo ${campo} debe ser un email valido` }
  }

  return { data: value }
}

function validarEstadoEmpresa(value: unknown): ValidationResult<EstadoEmpresa> {
  if (value !== EstadoEmpresa.ACTIVA && value !== EstadoEmpresa.INACTIVA) {
    return { error: "El estado debe ser ACTIVA o INACTIVA" }
  }

  return { data: value }
}

function validarHoraDespacho(value: unknown): ValidationResult<string | null> {
  if (value === undefined || value === null || value === "") {
    return { data: null }
  }

  if (typeof value !== "string" || !HORA_REGEX.test(value)) {
    return { error: "horaDespacho debe tener formato HH:MM valido" }
  }

  if (value < HORA_DESPACHO_MINIMA || value > HORA_DESPACHO_MAXIMA) {
    return {
      error: `horaDespacho debe estar entre las ${HORA_DESPACHO_MINIMA} y las ${HORA_DESPACHO_MAXIMA}`,
    }
  }

  return { data: value }
}

function validarFechaOpcional(
  value: unknown,
  campo = "fechaNacimiento"
): ValidationResult<Date | null> {
  if (value === undefined || value === null || value === "") {
    return { data: null }
  }

  if (typeof value !== "string") {
    return { error: `${campo} debe ser una fecha valida o null` }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { error: `${campo} debe ser una fecha valida o null` }
  }

  return { data: date }
}

function validarBooleanOpcional(value: unknown, campo: string): ValidationResult<boolean> {
  if (value === undefined || value === null || value === "") {
    return { data: false }
  }

  if (typeof value !== "boolean") {
    return { error: `${campo} debe ser booleano` }
  }

  return { data: value }
}

function validarIdOpcional(value: unknown, campo: string): ValidationResult<number | null> {
  if (value === undefined || value === null || value === "") {
    return { data: null }
  }

  const id = typeof value === "number" ? value : Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    return { error: `${campo} debe ser un ID valido` }
  }

  return { data: id }
}

function validarSucursalEmpresa(body: Record<string, unknown>) {
  const esSucursal = validarBooleanOpcional(body.esSucursal, "esSucursal")
  if ("error" in esSucursal) return esSucursal

  if (!esSucursal.data) {
    return {
      data: {
        esSucursal: false,
        casaMatrizId: null,
      },
    }
  }

  const casaMatrizId = validarIdOpcional(body.casaMatrizId, "casaMatrizId")
  if ("error" in casaMatrizId) return casaMatrizId

  if (!casaMatrizId.data) {
    return { error: "La casa matriz es obligatoria para una sucursal" }
  }

  return {
    data: {
      esSucursal: true,
      casaMatrizId: casaMatrizId.data,
    },
  }
}

function validarFechaNacimiento(value: unknown): ValidationResult<Date | null> {
  return validarFechaOpcional(value, "fechaNacimiento")
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

    if (item === undefined || item === null) {
      return true
    }

    if (typeof item === "string") {
      return item.trim().length === 0
    }

    return false
  })
}

function validarContactoBase(
  value: unknown,
  tipo: TipoContactoEmpresa,
  nombreCampo: string
): ValidationResult<ContactoEditData | null> {
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

function validarContactoTitular(value: unknown): ValidationResult<ContactoEditData> {
  const contacto = validarContactoBase(
    value,
    TipoContactoEmpresa.TITULAR,
    "contactoTitular"
  )

  if ("error" in contacto) return contacto

  if (!contacto.data) {
    return { error: "El contacto titular es obligatorio" }
  }

  if (
    !contacto.data.nombresApellidos ||
    !contacto.data.rolCargo ||
    !contacto.data.telefono ||
    !contacto.data.email ||
    !contacto.data.fechaNacimiento
  ) {
    return { error: "Completa los datos obligatorios del interlocutor titular" }
  }

  return { data: contacto.data }
}

function validarContactoCompleto(
  value: unknown,
  tipo: TipoContactoEmpresa,
  nombreCampo: string
): ValidationResult<ContactoEditData> {
  const contacto = validarContactoBase(value, tipo, nombreCampo)
  if ("error" in contacto) return contacto

  if (!contacto.data) {
    return { error: `${nombreCampo} es obligatorio` }
  }

  if (
    !contacto.data.nombresApellidos ||
    !contacto.data.rolCargo ||
    !contacto.data.telefono ||
    !contacto.data.email ||
    !contacto.data.fechaNacimiento
  ) {
    return { error: `Completa los datos obligatorios de ${nombreCampo}` }
  }

  return { data: contacto.data }
}

function validarContactoOpcional(value: unknown): ValidationResult<ContactoEditData | null> {
  const contacto = validarContactoBase(
    value,
    TipoContactoEmpresa.SUPLENTE,
    "contactoSuplente"
  )
  if ("error" in contacto) return contacto

  if (!contacto.data) {
    return { data: null }
  }

  if (
    !contacto.data.nombresApellidos ||
    !contacto.data.rolCargo ||
    !contacto.data.telefono ||
    !contacto.data.email ||
    !contacto.data.fechaNacimiento
  ) {
    return { error: "Completa los datos obligatorios de contactoSuplente" }
  }

  return { data: contacto.data }
}

function validarEditarEmpresaPayload(body: unknown): ValidationResult<EditarEmpresaData> {
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
    "fechaNacimientoRepresentanteLegal",
    "estado",
    "horaDespacho",
    "esSucursal",
    "casaMatrizId",
    "contactoTitular",
    "contactoSuplente",
    "contactoCobranza",
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

  const razonSocial = normalizarStringObligatorio(body.razonSocial, "razonSocial", 150)
  if ("error" in razonSocial) return razonSocial

  const rut = normalizarStringObligatorio(body.rut, "rut", 20)
  if ("error" in rut) return rut

  const nombreComercial = normalizarStringObligatorio(body.nombreComercial, "nombreComercial", 100)
  if ("error" in nombreComercial) return nombreComercial

  const correoContacto = normalizarStringObligatorio(body.correo_contacto, "correo_contacto", 100)
  if ("error" in correoContacto) return correoContacto

  const emailValidado = validarEmail(correoContacto.data, "correo_contacto")
  if ("error" in emailValidado) return emailValidado

  const telefono = normalizarStringObligatorio(body.telefono, "telefono", 30)
  if ("error" in telefono) return telefono

  const direccion = normalizarStringObligatorio(body.direccion, "direccion", 150)
  if ("error" in direccion) return direccion

  const comuna = normalizarStringObligatorio(body.comuna, "comuna", 80)
  if ("error" in comuna) return comuna

  const region = normalizarStringObligatorio(body.region, "region", 80)
  if ("error" in region) return region

  const sector = normalizarStringObligatorio(body.sector, "sector", 80)
  if ("error" in sector) return sector

  const nombreFaena = normalizarStringObligatorio(body.nombreFaena, "nombreFaena", 100)
  if ("error" in nombreFaena) return nombreFaena

  const direccionFaena = normalizarStringObligatorio(body.direccionFaena, "direccionFaena", 150)
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

  const fechaNacimientoRepresentanteLegal = validarFechaOpcional(
    body.fechaNacimientoRepresentanteLegal,
    "fechaNacimientoRepresentanteLegal"
  )
  if ("error" in fechaNacimientoRepresentanteLegal) {
    return fechaNacimientoRepresentanteLegal
  }

  const estado = validarEstadoEmpresa(body.estado)
  if ("error" in estado) return estado

  const horaDespacho = validarHoraDespacho(body.horaDespacho)
  if ("error" in horaDespacho) return horaDespacho

  const sucursal = validarSucursalEmpresa(body)
  if ("error" in sucursal) return sucursal

  const contactoTitular = validarContactoTitular(body.contactoTitular)
  if ("error" in contactoTitular) return contactoTitular

  const contactoSuplente = validarContactoOpcional(body.contactoSuplente)
  if ("error" in contactoSuplente) return contactoSuplente

  const contactoCobranza = validarContactoCompleto(
    body.contactoCobranza,
    TipoContactoEmpresa.COBRANZA,
    "contactoCobranza"
  )
  if ("error" in contactoCobranza) return contactoCobranza

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
        fechaNacimientoRepresentanteLegal:
          fechaNacimientoRepresentanteLegal.data,
        estado: estado.data,
        horaDespacho: horaDespacho.data,
        esSucursal: sucursal.data.esSucursal,
        casaMatrizId: sucursal.data.casaMatrizId,
      },
      contactoTitular: contactoTitular.data,
      contactoSuplente: contactoSuplente.data,
      contactoCobranza: contactoCobranza.data,
    },
  }
}

async function actualizarContactoActivo(
  tx: Prisma.TransactionClient,
  empresaId: number,
  contacto: ContactoEditData
) {
  const contactoActivo = await tx.contactoEmpresa.findFirst({
    where: {
      empresaId,
      tipo: contacto.tipo,
      activo: true,
    },
    orderBy: { id: "desc" },
    select: { id: true },
  })

  if (contactoActivo) {
    await tx.contactoEmpresa.updateMany({
      where: {
        empresaId,
        tipo: contacto.tipo,
        activo: true,
        id: { not: contactoActivo.id },
      },
      data: { activo: false },
    })

    return tx.contactoEmpresa.update({
      where: { id: contactoActivo.id },
      data: {
        nombresApellidos: contacto.nombresApellidos,
        rut: contacto.rut,
        rolCargo: contacto.rolCargo,
        telefono: contacto.telefono,
        email: contacto.email,
        fechaNacimiento: contacto.fechaNacimiento,
        activo: true,
      },
    })
  }

  return tx.contactoEmpresa.create({
    data: {
      empresaId,
      tipo: contacto.tipo,
      nombresApellidos: contacto.nombresApellidos,
      rut: contacto.rut,
      rolCargo: contacto.rolCargo,
      telefono: contacto.telefono,
      email: contacto.email,
      fechaNacimiento: contacto.fechaNacimiento,
      activo: true,
    },
  })
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

    const { empresaId: empresaIdParam } = await params
    const empresaId = Number(empresaIdParam)

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      return NextResponse.json({ error: "empresaId invalido" }, { status: 400 })
    }

    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
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
        fechaNacimientoRepresentanteLegal: true,
        estado: true,
        horaDespacho: true,
        esSucursal: true,
        casaMatrizId: true,
        casaMatriz: {
          select: {
            id: true,
            nombre: true,
          },
        },
        sucursales: {
          orderBy: { nombre: "asc" },
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
        creado_en: true,
        actualizado_en: true,
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
            trabajaFinDeSemana: true,
            tipoEmpaquetado: true,
          },
        },
        ContactoEmpresa: {
          orderBy: [{ activo: "desc" }, { tipo: "asc" }, { id: "asc" }],
          select: {
            id: true,
            tipo: true,
            nombresApellidos: true,
            rut: true,
            rolCargo: true,
            telefono: true,
            email: true,
            fechaNacimiento: true,
            activo: true,
          },
        },
      },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const [trabajadores, representantes, pedidos] = await Promise.all([
      db.usuario.count({
        where: {
          empresaId,
          rol: Rol.TRABAJADOR,
        },
      }),
      db.usuario.count({
        where: {
          empresaId,
          rol: Rol.REPRESENTANTE,
        },
      }),
      db.pedido.count({
        where: { empresaId },
      }),
    ])

    const {
      ConvenioEmpresa: convenio,
      ContactoEmpresa: contactos,
      ...empresaDetalle
    } = empresa

    return NextResponse.json({
      empresa: {
        ...empresaDetalle,
        convenio,
        contactos,
        metricas: {
          trabajadores,
          representantes,
          pedidos,
        },
      },
    })
  } catch (error) {
    console.error("[admin/empresas/detalle] Error:", error)
    return NextResponse.json(
      { error: "No se pudo obtener el detalle de la empresa" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await validarAdministrador()

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

    const { empresaId: empresaIdParam } = await params
    const empresaId = Number(empresaIdParam)

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      return NextResponse.json({ error: "empresaId invalido" }, { status: 400 })
    }

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 })
    }

    const payload = validarEditarEmpresaPayload(body)

    if ("error" in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const empresaExistente = await db.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    })

    if (!empresaExistente) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const nombreDuplicado = await db.empresa.findFirst({
      where: {
        nombre: {
          equals: payload.data.empresa.nombre,
          mode: "insensitive",
        },
        id: { not: empresaId },
      },
      select: { id: true },
    })

    if (nombreDuplicado) {
      return NextResponse.json(
        { error: "Ya existe una empresa con ese nombre" },
        { status: 409 }
      )
    }

    if (payload.data.empresa.esSucursal) {
      if (payload.data.empresa.casaMatrizId === empresaId) {
        return NextResponse.json(
          { error: "Una empresa no puede ser casa matriz de si misma" },
          { status: 400 }
        )
      }

      const sucursalesAsociadas = await db.empresa.count({
        where: {
          casaMatrizId: empresaId,
        },
      })

      if (sucursalesAsociadas > 0) {
        return NextResponse.json(
          {
            error:
              "No se puede marcar esta empresa como sucursal porque ya tiene sucursales asociadas.",
          },
          { status: 400 }
        )
      }

      const casaMatriz = await db.empresa.findFirst({
        where: {
          id: payload.data.empresa.casaMatrizId ?? undefined,
          esSucursal: false,
        },
        select: { id: true },
      })

      if (!casaMatriz) {
        return NextResponse.json(
          { error: "La casa matriz seleccionada no existe o es una sucursal" },
          { status: 400 }
        )
      }
    }

    const empresa = await db.$transaction(async (tx) => {
      await tx.empresa.update({
        where: { id: empresaId },
        data: payload.data.empresa,
      })

      await actualizarContactoActivo(tx, empresaId, payload.data.contactoTitular)
      await actualizarContactoActivo(tx, empresaId, payload.data.contactoCobranza)

      if (payload.data.contactoSuplente) {
        await actualizarContactoActivo(tx, empresaId, payload.data.contactoSuplente)
      } else {
        await tx.contactoEmpresa.updateMany({
          where: {
            empresaId,
            tipo: TipoContactoEmpresa.SUPLENTE,
            activo: true,
          },
          data: { activo: false },
        })
      }

      const empresaActualizada = await tx.empresa.findUniqueOrThrow({
        where: { id: empresaId },
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
          fechaNacimientoRepresentanteLegal: true,
          estado: true,
          horaDespacho: true,
          esSucursal: true,
          casaMatrizId: true,
          casaMatriz: {
            select: {
              id: true,
              nombre: true,
            },
          },
          ContactoEmpresa: {
            orderBy: [{ activo: "desc" }, { tipo: "asc" }, { id: "asc" }],
            select: {
              id: true,
              tipo: true,
              nombresApellidos: true,
              rut: true,
              rolCargo: true,
              telefono: true,
              email: true,
              fechaNacimiento: true,
              activo: true,
            },
          },
        },
      })

      const { ContactoEmpresa: contactos, ...empresaDetalle } = empresaActualizada

      return {
        ...empresaDetalle,
        contactos,
      }
    })

    return NextResponse.json({ empresa })
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

    console.error("[admin/empresas/detalle] Error actualizando:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar la empresa" },
      { status: 500 }
    )
  }
}
