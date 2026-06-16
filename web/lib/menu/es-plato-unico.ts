const LEGUMBRES_REGEX = /\b(lentejas?|porotos?|garbanzos?|arvejas?|legumbres?)\b/

export function normalizarTextoMenu(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export function esPlatoUnicoPorLegumbre(nombre: string): boolean {
  return LEGUMBRES_REGEX.test(normalizarTextoMenu(nombre))
}
