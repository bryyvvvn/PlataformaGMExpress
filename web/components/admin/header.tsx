"use client"

import { useEffect, useState } from "react"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Search, LogOut, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title: string
  subtitle?: string
}

type ResultadoBusqueda = {
  id: string
  tipo: "EMPRESA" | "TRABAJADOR" | "REPRESENTANTE" | "ADMIN"
  titulo: string
  descripcion: string
  href: string
}

const LABELS_TIPO_RESULTADO: Record<ResultadoBusqueda["tipo"], string> = {
  EMPRESA: "Empresa",
  TRABAJADOR: "Trabajador",
  REPRESENTANTE: "Representante",
  ADMIN: "Admin",
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const { signOut } = useClerk()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [busquedaActiva, setBusquedaActiva] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)

  const queryNormalizada = query.trim()
  const mostrarDropdown = busquedaActiva && queryNormalizada.length >= 2

  useEffect(() => {
    if (queryNormalizada.length < 2) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setBuscando(true)
      setErrorBusqueda(null)

      try {
        const response = await fetch(
          `/api/admin/busqueda?q=${encodeURIComponent(queryNormalizada)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(data?.error ?? "No se pudo buscar")
        }

        const data = (await response.json()) as {
          resultados?: ResultadoBusqueda[]
        }

        setResultados(Array.isArray(data.resultados) ? data.resultados : [])
      } catch (error) {
        if (controller.signal.aborted) return

        console.error("[Header] Error buscando:", error)
        setResultados([])
        setErrorBusqueda("No se pudo buscar")
      } finally {
        if (!controller.signal.aborted) setBuscando(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [queryNormalizada])

  const seleccionarResultado = (resultado: ResultadoBusqueda) => {
    setBusquedaActiva(false)
    setQuery("")
    setResultados([])
    router.push(resultado.href)
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-[#1B2C56]">{title}</h1>
        {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            value={query}
            onBlur={() => window.setTimeout(() => setBusquedaActiva(false), 120)}
            onChange={(event) => {
              const nuevoQuery = event.target.value

              setQuery(nuevoQuery)
              setBusquedaActiva(true)

              if (nuevoQuery.trim().length < 2) {
                setResultados([])
                setBuscando(false)
                setErrorBusqueda(null)
              }
            }}
            onFocus={() => setBusquedaActiva(true)}
            className="h-8 w-64 rounded-md border-slate-200 bg-slate-50 pl-9 text-sm"
          />
          {mostrarDropdown && (
            <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
              <div className="max-h-80 overflow-y-auto p-1">
                {buscando ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    Buscando...
                  </div>
                ) : errorBusqueda ? (
                  <div className="px-3 py-2 text-sm text-destructive">
                    {errorBusqueda}
                  </div>
                ) : resultados.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    Sin resultados
                  </div>
                ) : (
                  resultados.map((resultado) => (
                    <button
                      key={resultado.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        seleccionarResultado(resultado)
                      }}
                      className="flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {resultado.titulo}
                        </span>
                        <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          {LABELS_TIPO_RESULTADO[resultado.tipo]}
                        </span>
                      </div>
                      <span className="mt-0.5 truncate text-xs text-slate-500">
                        {resultado.descripcion}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
