"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, ChefHat, CheckCircle2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AccionesProduccion({ 
  empresaId, 
  confirmados, 
  enProduccion 
}: { 
  empresaId: number, 
  confirmados: number, 
  enProduccion: number 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const cambiarEstado = async (estadoActual: string, nuevoEstado: string) => {
    setLoading(true)
    try {
      // API Call comentada para el futuro
      /*
      await fetch(`/api/admin/pedidos/bulk-update`, {
        method: "PATCH",
        body: JSON.stringify({ empresaId, estadoActual, nuevoEstado })
      })
      */
      
      // Simulador de carga por ahora
      await new Promise(resolve => setTimeout(resolve, 800))
      
      router.refresh()
    } catch (error) {
      console.error("Error al actualizar estados", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      {/* SOLUCIÓN: Quitamos asChild y aplicamos los estilos del botón directamente al Trigger */}
      <DropdownMenuTrigger 
        disabled={loading}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones de Cocina</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => cambiarEstado("CONFIRMADO", "EN_PRODUCCION")}
          disabled={confirmados === 0}
          className="text-purple-600"
        >
          <ChefHat className="mr-2 h-4 w-4" />
          Pasar {confirmados} a Producción
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => cambiarEstado("EN_PRODUCCION", "ENTREGADO")}
          disabled={enProduccion === 0}
          className="text-emerald-600"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Marcar {enProduccion} Entregados
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}