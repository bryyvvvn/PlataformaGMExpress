export const TELEFONO_CHILENO_ERROR =
  "El teléfono debe tener un formato válido, por ejemplo +56 9 1234 5678."

function obtenerDigitos(valor: string) {
  return valor.replace(/\D/g, "")
}

export function normalizarTelefonoChileno(
  valor: string | null | undefined
): string | null {
  const texto = valor?.trim()

  if (!texto) return null

  const digitos = obtenerDigitos(texto)

  if (/^9\d{8}$/.test(digitos)) {
    return `+56${digitos}`
  }

  if (/^569\d{8}$/.test(digitos)) {
    return `+${digitos}`
  }

  throw new Error(TELEFONO_CHILENO_ERROR)
}

export function esTelefonoChilenoValido(
  valor: string | null | undefined
): boolean {
  try {
    normalizarTelefonoChileno(valor)
    return true
  } catch {
    return false
  }
}

export function formatearTelefonoChileno(
  valor: string | null | undefined
): string {
  const texto = valor?.trim()

  if (!texto) return "Sin teléfono"

  try {
    const normalizado = normalizarTelefonoChileno(texto)
    if (!normalizado) return "Sin teléfono"

    const ultimosOcho = normalizado.slice(-8)
    return `+56 9 ${ultimosOcho.slice(0, 4)} ${ultimosOcho.slice(4)}`
  } catch {
    return texto
  }
}

export function obtenerTerminosTelefonoBusqueda(query: string) {
  const terminos = new Set<string>()
  const texto = query.trim()
  const digitos = obtenerDigitos(texto)

  if (texto.length >= 2) terminos.add(texto)
  if (digitos.length >= 2) {
    terminos.add(digitos)
    terminos.add(`+${digitos}`)
  }

  if (digitos.startsWith("56") && digitos.length > 2) {
    const sinCodigoPais = digitos.slice(2)
    terminos.add(sinCodigoPais)
    terminos.add(`+${digitos}`)

    if (sinCodigoPais.startsWith("9") && sinCodigoPais.length > 1) {
      terminos.add(`9 ${sinCodigoPais.slice(1)}`)
    }
  }

  if (digitos.startsWith("9")) {
    terminos.add(`56${digitos}`)
    terminos.add(`+56${digitos}`)

    if (digitos.length > 1) {
      terminos.add(`9 ${digitos.slice(1)}`)
    }

    if (digitos.length === 9) {
      const ultimosOcho = digitos.slice(1)
      terminos.add(`${ultimosOcho.slice(0, 4)} ${ultimosOcho.slice(4)}`)
    }
  }

  if (digitos.length === 8) {
    terminos.add(`${digitos.slice(0, 4)} ${digitos.slice(4)}`)
  }

  return Array.from(terminos).filter((termino) => termino.length >= 2)
}
