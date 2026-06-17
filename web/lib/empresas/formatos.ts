import { LABELS_TIPO_EMPAQUETADO } from "@/lib/empresas/constantes"
import type { TipoEmpaquetado } from "@/lib/empresas/tipos"

export function mostrarTexto(value: string | null | undefined) {
  const texto = value?.trim()

  return texto && texto.length > 0 ? texto : "No registrado"
}

export function formatearFecha(value: string | null | undefined) {
  if (!value) return "No registrado"

  const fecha = new Date(value)

  if (Number.isNaN(fecha.getTime())) {
    return "No registrado"
  }

  return new Intl.DateTimeFormat("es-CL").format(fecha)
}

export function mostrarTipoEmpaquetado(
  value: TipoEmpaquetado | null | undefined
) {
  return value ? LABELS_TIPO_EMPAQUETADO[value] : "No definido"
}
