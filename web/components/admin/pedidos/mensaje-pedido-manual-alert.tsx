import type { MensajePedidoManual } from "@/lib/pedidos/tipos"

export function MensajePedidoManualAlert({
  mensaje,
}: {
  mensaje: MensajePedidoManual
}) {
  return (
    <div
      className={`rounded-md border px-4 py-3 text-sm font-semibold ${
        mensaje.tipo === "exito"
          ? "border-[#75AA46]/20 bg-[#75AA46]/10 text-[#5d8a38]"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {mensaje.texto}
    </div>
  )
}
