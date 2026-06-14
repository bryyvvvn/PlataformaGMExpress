"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export type TimePickerBlockProps = {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  disabled?: boolean
}

const MINUTOS_PERMITIDOS = [0, 15, 30, 45]

function redondearMinutos(minutos: number): number {
  return MINUTOS_PERMITIDOS.reduce((cercano, candidato) =>
    Math.abs(candidato - minutos) < Math.abs(cercano - minutos) ? candidato : cercano
  )
}

function parsearValor(value: string) {
  const [horaStr, minutosStr] = value.split(":")
  return {
    hora: Number.parseInt(horaStr, 10),
    minutos: redondearMinutos(Number.parseInt(minutosStr, 10)),
  }
}

export function TimePickerBlock({
  value,
  onChange,
  min = "00:00",
  max = "23:59",
  disabled = false,
}: TimePickerBlockProps) {
  const [hora, setHora] = useState(() => parsearValor(value).hora)
  const [minutos, setMinutos] = useState(() => parsearValor(value).minutos)

  // Resincroniza con `value` cuando cambia desde el padre (ej. tras cargar datos async)
  useEffect(() => {
    const parsed = parsearValor(value)
    setHora(parsed.hora)
    setMinutos(parsed.minutos)
  }, [value])

  const valorActual = `${String(hora).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`
  const dentroDeRango = valorActual >= min && valorActual <= max

  // `onChange` se omite a propósito de las dependencias: es una función inline
  // en los consumidores y depender de ella provocaría un loop de renders.
  useEffect(() => {
    if (dentroDeRango) {
      onChange(valorActual)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorActual, dentroDeRango])

  function incrementarHora() {
    setHora((h) => Math.min(h + 1, 23))
  }

  function decrementarHora() {
    setHora((h) => Math.max(h - 1, 0))
  }

  function incrementarMinutos() {
    setMinutos((m) => {
      const idx = MINUTOS_PERMITIDOS.indexOf(m)
      return MINUTOS_PERMITIDOS[Math.min(idx + 1, MINUTOS_PERMITIDOS.length - 1)]
    })
  }

  function decrementarMinutos() {
    setMinutos((m) => {
      const idx = MINUTOS_PERMITIDOS.indexOf(m)
      return MINUTOS_PERMITIDOS[Math.max(idx - 1, 0)]
    })
  }

  const minutosIndex = MINUTOS_PERMITIDOS.indexOf(minutos)

  const cajaClassName = `flex h-16 w-16 items-center justify-center rounded-xl border-2 text-3xl font-bold tabular-nums ${
    dentroDeRango
      ? "border-[#1b2c56] bg-slate-50 text-[#1b2c56]"
      : "border-red-300 bg-red-50 text-red-500"
  }`

  const botonClassName =
    "p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"

  return (
    <div className="flex items-center gap-2">
      {/* Bloque HORA */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={incrementarHora}
          disabled={disabled || hora >= 23}
          className={botonClassName}
        >
          <ChevronUp className="h-5 w-5 text-[#1b2c56]" />
        </button>

        <div className={cajaClassName}>{String(hora).padStart(2, "0")}</div>

        <button
          type="button"
          onClick={decrementarHora}
          disabled={disabled || hora <= 0}
          className={botonClassName}
        >
          <ChevronDown className="h-5 w-5 text-[#1b2c56]" />
        </button>
      </div>

      {/* Separador */}
      <span className="mb-1 text-3xl font-bold text-[#1b2c56]">:</span>

      {/* Bloque MINUTOS */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={incrementarMinutos}
          disabled={disabled || minutosIndex >= MINUTOS_PERMITIDOS.length - 1}
          className={botonClassName}
        >
          <ChevronUp className="h-5 w-5 text-[#1b2c56]" />
        </button>

        <div className={cajaClassName}>{String(minutos).padStart(2, "0")}</div>

        <button
          type="button"
          onClick={decrementarMinutos}
          disabled={disabled || minutosIndex <= 0}
          className={botonClassName}
        >
          <ChevronDown className="h-5 w-5 text-[#1b2c56]" />
        </button>
      </div>
    </div>
  )
}
