import { ClipboardPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type {
  EmpresaOption,
  MensajePedidoManual,
  PedidoManualForm,
} from "@/lib/pedidos/tipos"

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

export function PedidoManualModal({
  open,
  empresas,
  empresaManualSeleccionada,
  formManual,
  guardandoManual,
  mensajeManual,
  onClose,
  onChange,
  onGuardar,
}: {
  open: boolean
  empresas: EmpresaOption[]
  empresaManualSeleccionada: EmpresaOption | undefined
  formManual: PedidoManualForm
  guardandoManual: boolean
  mensajeManual: MensajePedidoManual | null
  onClose: () => void
  onChange: <K extends keyof PedidoManualForm>(
    campo: K,
    valor: PedidoManualForm[K]
  ) => void
  onGuardar: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1B2C56]">Agregar pedido manual</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pedido fuera de plazo o pedido solicitado por canal externo.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={guardandoManual}
            >
              Cerrar
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Empresa
            </Label>
            <Select
              value={formManual.empresaId}
              onValueChange={(value) => onChange("empresaId", value ?? "")}
              disabled={guardandoManual}
            >
              <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-200">
                <span className={empresaManualSeleccionada ? "text-slate-900" : "text-slate-400"}>
                  {empresaManualSeleccionada?.nombre ?? "Selecciona una empresa..."}
                </span>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                sideOffset={4}
                alignItemWithTrigger={false}
                className="z-50 max-h-64 bg-white border-slate-200 shadow-md"
              >
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={String(empresa.id)} className="cursor-pointer">
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Fecha del pedido
              </Label>
              <Input
                type="date"
                value={formManual.fecha}
                onChange={(event) => onChange("fecha", event.target.value)}
                disabled={guardandoManual}
                className="h-10 bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Cantidad de almuerzos
              </Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={formManual.cantidad}
                onChange={(event) => onChange("cantidad", event.target.value)}
                disabled={guardandoManual}
                className="h-10 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Observación opcional
            </Label>
            <textarea
              value={formManual.observacion}
              onChange={(event) => onChange("observacion", event.target.value)}
              disabled={guardandoManual}
              maxLength={500}
              className="min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#1B2C56] focus:bg-white"
              placeholder="Ej: Solicitud por WhatsApp para invitados"
            />
            <p className="text-right text-[10px] font-medium text-slate-400">
              {formManual.observacion.length}/500
            </p>
          </div>

          {mensajeManual && (
            <div
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                mensajeManual.tipo === "exito"
                  ? "border-[#75AA46]/20 bg-[#75AA46]/10 text-[#5d8a38]"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {mensajeManual.texto}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={guardandoManual}
            className="h-9"
          >
            Cancelar
          </Button>
          <Button
            onClick={onGuardar}
            disabled={guardandoManual}
            className="h-9 bg-[#75AA46] text-white hover:bg-[#5d8a38]"
          >
            {guardandoManual ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <ClipboardPlus className="mr-2 h-4 w-4" />
                Guardar pedido
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
