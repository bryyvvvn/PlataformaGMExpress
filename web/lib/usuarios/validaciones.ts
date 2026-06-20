export type AsignarRepresentantePayload = {
  usuarioId: string
  empresaId: number
}

export type ValidationResult<T> = { data: T } | { error: string }

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function normalizarRutBusqueda(value: string) {
  return value.replace(/[.\-\s]/g, "")
}

export function obtenerTerminosRut(query: string) {
  const terminos = new Set<string>([query])
  const rutLimpio = normalizarRutBusqueda(query)

  if (rutLimpio.length >= 2) {
    terminos.add(rutLimpio)

    const rutConPuntos = formatearRutConPuntos(rutLimpio)
    if (rutConPuntos) terminos.add(rutConPuntos)

    if (rutLimpio.length > 1) {
      terminos.add(`${rutLimpio.slice(0, -1)}-${rutLimpio.slice(-1)}`)
    }
  }

  return Array.from(terminos).filter((termino) => termino.trim().length >= 2)
}

export function validarAsignarRepresentantePayload(
  body: unknown
): ValidationResult<AsignarRepresentantePayload> {
  if (!isRecord(body)) {
    return { error: "Body JSON invalido" }
  }

  if (typeof body.usuarioId !== "string" || body.usuarioId.trim().length === 0) {
    return { error: "usuarioId es obligatorio" }
  }

  const empresaId = Number(body.empresaId)

  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    return { error: "empresaId es obligatorio" }
  }

  return {
    data: {
      usuarioId: body.usuarioId.trim(),
      empresaId,
    },
  }
}

function formatearRutConPuntos(value: string) {
  if (value.length < 2) return null

  const cuerpo = value.slice(0, -1)
  const digito = value.slice(-1)
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${cuerpoConPuntos}-${digito}`
}
