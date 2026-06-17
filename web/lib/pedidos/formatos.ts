export function formatearFechaCreacionPedidoManual(creadoEn: string) {
  return new Date(creadoEn).toLocaleDateString("es-CL")
}
