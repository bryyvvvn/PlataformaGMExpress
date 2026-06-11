"use client"

import { useEffect, useState } from "react"
import { Clock, Info, Save, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export default function ConfiguracionPage() {
  const [horaLimite, setHoraLimite] = useState("11:00")
  const [mensajePedidoTrabajadores, setMensajePedidoTrabajadores] = useState("")
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    const cargarConfiguracion = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/configuracion", {
          cache: "no-store",
        })

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(data?.error ?? "No se pudo cargar la configuracion")
        }

        const data = (await response.json()) as ConfiguracionResponse

        if (!cancelado) {
          setHoraLimite(data.configuracion.horaLimite)
          setMensajePedidoTrabajadores(
            data.configuracion.mensajePedidoTrabajadores ?? ""
          )
        }
      } catch (err) {
        console.error("[ConfiguracionPage] Error cargando:", err)
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la configuracion"
          )
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarConfiguracion()

    return () => {
      cancelado = true
    }
  }, [])

  const guardarCambios = async () => {
    setError(null)
    setExito(null)

    if (!HORA_REGEX.test(horaLimite)) {
      setError("La hora limite debe tener formato HH:mm valido")
      return
    }

    if (mensajePedidoTrabajadores.trim().length > 500) {
      setError("El mensaje para trabajadores no puede superar 500 caracteres")
      return
    }

    setGuardando(true)

    try {
      const response = await fetch("/api/admin/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horaLimite,
          mensajePedidoTrabajadores,
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(data?.error ?? "No se pudo guardar la configuracion")
      }

      const data = (await response.json()) as ConfiguracionResponse
      setHoraLimite(data.configuracion.horaLimite)
      setMensajePedidoTrabajadores(
        data.configuracion.mensajePedidoTrabajadores ?? ""
      )
      setExito("Configuracion guardada correctamente")
    } catch (err) {
      console.error("[ConfiguracionPage] Error guardando:", err)
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la configuracion"
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Administracion
          </p>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-[#1B2C56]">
            <Settings className="h-5 w-5" />
            Configuracion
          </h1>
          <p className="text-sm text-slate-600">
            Parametros generales del sistema GM Express
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {exito && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {exito}
        </p>
      )}

      {loading ? (
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardContent className="px-4 py-6 text-sm text-slate-600">
            Cargando configuracion...
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-md border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
                <Clock className="h-4 w-4" />
                Configuracion de pedidos
              </CardTitle>
              <CardDescription>
                Parametros generales relacionados con pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="horaLimite">Hora limite de pedidos</Label>
                <Input
                  id="horaLimite"
                  type="time"
                  value={horaLimite}
                  disabled={guardando}
                  onChange={(event) => setHoraLimite(event.target.value)}
                />
                <p className="text-xs leading-relaxed text-slate-500">
                  La hora limite quedara guardada para futuras restricciones de
                  pedidos. En esta etapa todavia no bloquea pedidos en la
                  aplicacion movil.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
                <Info className="h-4 w-4" />
                Mensaje para trabajadores
              </CardTitle>
              <CardDescription>
                Texto informativo guardado para uso futuro en la app movil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="mensajePedidoTrabajadores">
                Mensaje informativo para trabajadores
              </Label>
              <textarea
                id="mensajePedidoTrabajadores"
                value={mensajePedidoTrabajadores}
                disabled={guardando}
                maxLength={500}
                rows={6}
                onChange={(event) =>
                  setMensajePedidoTrabajadores(event.target.value)
                }
                className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs leading-relaxed text-slate-500">
                  Este mensaje quedara guardado para ser utilizado
                  posteriormente en la aplicacion movil del trabajador.
                </p>
                <span className="shrink-0 text-xs text-slate-400">
                  {mensajePedidoTrabajadores.length}/500
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={guardando}
              onClick={guardarCambios}
              className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
            >
              <Save className="mr-2 h-4 w-4" />
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
