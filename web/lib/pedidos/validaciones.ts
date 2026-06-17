import type { PedidoManualForm } from "@/lib/pedidos/tipos"

type ValidacionPedidoManual =
  | { cantidad: number }
  | { error: string }

export function validarFormularioPedidoManual(
  formManual: PedidoManualForm
): ValidacionPedidoManual {
  const cantidad = Number(formManual.cantidad)

  if (!formManual.empresaId) {
    return { error: "Selecciona una empresa" }
  }

  if (!formManual.fecha) {
    return { error: "Selecciona una fecha" }
  }

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { error: "La cantidad debe ser mayor a 0" }
  }

  if (formManual.observacion.trim().length > 500) {
    return { error: "La observación no puede superar 500 caracteres" }
  }

  return { cantidad }
}
