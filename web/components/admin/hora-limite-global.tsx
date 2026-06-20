"use client"

import { useEffect, useState } from "react"
import { Clock, Loader2, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TimePickerBlock } from "@/components/ui/time-picker-block"

type ConfiguracionSistema = {
  id: number
  horaLimite: string
  diasAnticipacion: number
  mensajePedidoTrabajadores: string | null
  actualizadoEn: string
}

type ConfiguracionResponse = {
  configuracion: ConfiguracionSistema
}

type ErrorResponse = {
  error?: string
}

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export function HoraLimiteGlobal() {
  const [horaLimite, setHoraLimite] = useState("10:00")
  const [horaGuardada, setHoraGuardada] = useState("10:00")
  const [mensajeTrabajadores, setMensajeTrabajadores] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null)

  useEffect(() => {
    let cancelado = false

    void fetch("/api/admin/configuracion", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as
          | ConfiguracionResponse
          | ErrorResponse
          | null

        if (!response.ok || !data || !("configuracion" in data)) {
          throw new Error(
            (data && "error" in data && data.error) || "No se pudo cargar la configuracion"
          )
        }

        if (!cancelado) {
          setHoraLimite(data.configuracion.horaLimite)
          setHoraGuardada(data.configuracion.horaLimite)
          setMensajeTrabajadores(data.configuracion.mensajePedidoTrabajadores)
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setMensaje({
            tipo: "error",
            texto: err instanceof Error ? err.message : "No se pudo cargar la configuracion",
          })
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  async function guardar() {
    setMensaje(null)

    if (!HORA_REGEX.test(horaLimite)) {
      setMensaje({ tipo: "error", texto: "La hora debe tener formato HH:MM valido" })
      return
    }

    setGuardando(true)

    try {
      const response = await fetch("/api/admin/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horaLimite,
          mensajePedidoTrabajadores: mensajeTrabajadores,
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | ConfiguracionResponse
        | ErrorResponse
        | null

      if (!response.ok || !data || !("configuracion" in data)) {
        throw new Error(
          (data && "error" in data && data.error) || "No se pudo guardar la configuracion"
        )
      }

      setHoraLimite(data.configuracion.horaLimite)
      setHoraGuardada(data.configuracion.horaLimite)
      setMensajeTrabajadores(data.configuracion.mensajePedidoTrabajadores)
      setMensaje({ tipo: "exito", texto: "Hora de cierre global actualizada correctamente" })
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "No se pudo guardar la configuracion",
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#1B2C56]">
            <Clock className="h-4 w-4" />
            Hora Global de Cierre de Pedidos
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Aplica a todas las empresas sin hora de despacho configurada
          </p>
        </div>
        <Badge className="w-fit border-none bg-[#1B2C56]/10 text-[#1B2C56]">
          Configuración actual: {horaGuardada}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600">Hora límite</Label>
          <TimePickerBlock
            value={horaLimite}
            onChange={setHoraLimite}
            disabled={loading || guardando}
          />
        </div>
        <Button
          onClick={() => void guardar()}
          disabled={loading || guardando}
          className="h-10 bg-[#75AA46] text-white hover:bg-[#5d8a38] font-semibold"
        >
          {guardando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </>
          )}
        </Button>
      </div>

      {mensaje && (
        <div
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
            mensaje.tipo === "exito"
              ? "border-[#75AA46]/20 bg-[#75AA46]/10 text-[#5d8a38]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {mensaje.texto}
        </div>
      )}
    </div>
  )
}
