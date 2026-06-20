"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type UsuariosHeaderProps = {
  onAsignarRepresentante: () => void
}

export function UsuariosHeader({ onAsignarRepresentante }: UsuariosHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#1B2C56]" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Administración de Sistema
          </p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1B2C56]">
          Directorio de Usuarios
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestión de accesos, roles y vinculación empresarial.
        </p>
      </div>
      <Button
        type="button"
        onClick={onAsignarRepresentante}
        className="h-10 w-full bg-[#75aa46] px-3 text-white hover:bg-[#5d8a38] sm:w-auto"
      >
        <Plus className="size-4" />
        Asignar representante
      </Button>
    </header>
  )
}
