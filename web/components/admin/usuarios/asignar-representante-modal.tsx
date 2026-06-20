"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Search,
  UserCheck,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RolAsignable = "TRABAJADOR" | "REPRESENTANTE"

type UsuarioAsignable = {
  id: string
  nombre: string | null
  apellido: string | null
  nombreUsuario: string | null
  nombreCompleto: string
  rut: string | null
  correo: string | null
  rol: RolAsignable
  empresaId: number | null
  empresa: {
    id: number
    nombre: string
  } | null
}

type EmpresaAsignable = {
  id: number
  nombre: string
  estado?: "ACTIVA" | "INACTIVA"
}

type BuscarUsuariosResponse = {
  usuarios: UsuarioAsignable[]
}

type EmpresasResponse = {
  empresas: EmpresaAsignable[]
}

type AsignarRepresentanteModalProps = {
  abierto: boolean
  onCerrar: () => void
  onAsignado: () => Promise<void> | void
}

function etiquetaRol(rol: RolAsignable) {
  return rol === "REPRESENTANTE" ? "Representante" : "Trabajador"
}

function etiquetaEmpresa(usuario: UsuarioAsignable) {
  return usuario.empresa?.nombre ?? "Sin empresa asignada"
}

export function AsignarRepresentanteModal({
  abierto,
  onCerrar,
  onAsignado,
}: AsignarRepresentanteModalProps) {
  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState<UsuarioAsignable[]>([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioAsignable | null>(null)
  const [empresaId, setEmpresaId] = useState("")
  const [empresas, setEmpresas] = useState<EmpresaAsignable[]>([])
  const [buscando, setBuscando] = useState(false)
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)

  const empresasActivas = useMemo(
    () => empresas.filter((empresa) => empresa.estado !== "INACTIVA"),
    [empresas]
  )

  const empresaSeleccionada = useMemo(
    () => empresasActivas.find((empresa) => String(empresa.id) === empresaId),
    [empresaId, empresasActivas]
  )

  const limpiarEstado = useCallback(() => {
    setBusqueda("")
    setResultados([])
    setUsuarioSeleccionado(null)
    setEmpresaId("")
    setErrorBusqueda(null)
    setErrorEmpresas(null)
    setErrorFormulario(null)
  }, [])

  const cerrar = useCallback(() => {
    if (guardando) return
    limpiarEstado()
    onCerrar()
  }, [guardando, limpiarEstado, onCerrar])

  const cargarEmpresas = useCallback(async () => {
    setCargandoEmpresas(true)
    setErrorEmpresas(null)

    try {
      const response = await fetch("/api/admin/empresas", {
        cache: "no-store",
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        throw new Error(data?.error ?? "No se pudieron cargar las empresas")
      }

      const data = (await response.json()) as EmpresasResponse
      setEmpresas(data.empresas)
    } catch (err) {
      console.error("[AsignarRepresentanteModal] empresas:", err)
      setErrorEmpresas(
        err instanceof Error ? err.message : "No se pudieron cargar las empresas"
      )
    } finally {
      setCargandoEmpresas(false)
    }
  }, [])

  useEffect(() => {
    if (!abierto) return

    queueMicrotask(() => {
      void cargarEmpresas()
    })
  }, [abierto, cargarEmpresas])

  useEffect(() => {
    if (!abierto) return

    const criterio = busqueda.trim()

    if (criterio.length < 2) {
      queueMicrotask(() => {
        setResultados([])
        setBuscando(false)
        setErrorBusqueda(null)
      })
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setBuscando(true)
      setErrorBusqueda(null)

      try {
        const response = await fetch(
          `/api/admin/usuarios-app/buscar?q=${encodeURIComponent(criterio)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string
          } | null

          throw new Error(data?.error ?? "No se pudo buscar usuarios")
        }

        const data = (await response.json()) as BuscarUsuariosResponse
        setResultados(data.usuarios)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return

        console.error("[AsignarRepresentanteModal] busqueda:", err)
        setErrorBusqueda(
          err instanceof Error ? err.message : "No se pudo buscar usuarios"
        )
      } finally {
        if (!controller.signal.aborted) {
          setBuscando(false)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [abierto, busqueda])

  const confirmarAsignacion = async () => {
    setErrorFormulario(null)

    if (!usuarioSeleccionado) {
      setErrorFormulario("Selecciona un usuario registrado.")
      return
    }

    const empresaIdNumber = Number(empresaId)

    if (!Number.isInteger(empresaIdNumber) || empresaIdNumber <= 0) {
      setErrorFormulario("Selecciona una empresa para el representante.")
      return
    }

    setGuardando(true)

    try {
      const response = await fetch(
        "/api/admin/usuarios-app/asignar-representante",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioId: usuarioSeleccionado.id,
            empresaId: empresaIdNumber,
          }),
        }
      )

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        throw new Error(data?.error ?? "No se pudo asignar el representante")
      }

      await onAsignado()
      limpiarEstado()
      onCerrar()
    } catch (err) {
      console.error("[AsignarRepresentanteModal] asignacion:", err)
      setErrorFormulario(
        err instanceof Error ? err.message : "No se pudo asignar el representante"
      )
    } finally {
      setGuardando(false)
    }
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asignar-representante-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="space-y-1">
            <h2
              id="asignar-representante-title"
              className="text-base font-bold text-[#1B2C56]"
            >
              Asignar representante
            </h2>
            <p className="text-sm text-slate-500">
              Busca una cuenta registrada y vincula la empresa que representara.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={guardando}
            onClick={cerrar}
            aria-label="Cerrar modal"
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-3">
              <div className="space-y-2">
                <Label
                  htmlFor="buscar-representante"
                  className="text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Cuenta registrada
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="buscar-representante"
                    type="search"
                    value={busqueda}
                    disabled={guardando}
                    placeholder="Buscar por RUT, nombre o correo"
                    onChange={(event) => {
                      setBusqueda(event.target.value)
                      setUsuarioSeleccionado(null)
                      setErrorFormulario(null)
                    }}
                    className="h-10 border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div className="min-h-56 rounded-md border border-slate-200 bg-slate-50/60 p-2">
                {busqueda.trim().length < 2 ? (
                  <div className="flex h-52 items-center justify-center px-4 text-center text-sm text-slate-500">
                    Ingresa al menos 2 caracteres para buscar cuentas registradas.
                  </div>
                ) : buscando ? (
                  <div className="flex h-52 items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <Loader2 className="size-4 animate-spin" />
                    Buscando usuarios...
                  </div>
                ) : errorBusqueda ? (
                  <div className="flex h-52 items-center justify-center px-4 text-center text-sm text-red-600">
                    {errorBusqueda}
                  </div>
                ) : resultados.length === 0 ? (
                  <div className="flex h-52 items-center justify-center px-4 text-center text-sm text-slate-500">
                    No se encontraron cuentas para {busqueda.trim()}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resultados.map((usuario) => {
                      const seleccionado = usuarioSeleccionado?.id === usuario.id

                      return (
                        <button
                          key={usuario.id}
                          type="button"
                          disabled={guardando}
                          onClick={() => {
                            setUsuarioSeleccionado(usuario)
                            setErrorFormulario(null)
                          }}
                          className={
                            seleccionado
                              ? "w-full rounded-md border border-[#75aa46] bg-white p-3 text-left shadow-sm ring-2 ring-[#75aa46]/20"
                              : "w-full rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-[#1B2C56]/30 hover:bg-slate-50"
                          }
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {usuario.nombreCompleto}
                              </p>
                              <p className="text-xs text-slate-500">
                                {usuario.correo ?? "Sin correo registrado"}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                                <span className="font-mono font-semibold">
                                  {usuario.rut ?? "S/RUT"}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span>{etiquetaEmpresa(usuario)}</span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                usuario.rol === "REPRESENTANTE"
                                  ? "border-[#1B2C56]/20 bg-[#1B2C56]/10 text-[10px] font-bold uppercase tracking-wide text-[#1B2C56]"
                                  : "border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                              }
                            >
                              {etiquetaRol(usuario.rol)}
                            </Badge>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserCheck className="size-4 text-[#1B2C56]" />
                  <h3 className="text-sm font-bold text-[#1B2C56]">
                    Seleccion actual
                  </h3>
                </div>

                {usuarioSeleccionado ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-slate-800">
                      {usuarioSeleccionado.nombreCompleto}
                    </p>
                    <p className="text-xs text-slate-500">
                      {usuarioSeleccionado.correo ?? "Sin correo registrado"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                      >
                        {etiquetaRol(usuarioSeleccionado.rol)}
                      </Badge>
                      {usuarioSeleccionado.rol === "REPRESENTANTE" && (
                        <Badge
                          variant="outline"
                          className="border-[#1B2C56]/20 bg-[#1B2C56]/10 text-[10px] font-bold uppercase tracking-wide text-[#1B2C56]"
                        >
                          Reasignable
                        </Badge>
                      )}
                    </div>
                    <p className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                      <Building2 className="size-3.5" />
                      {etiquetaEmpresa(usuarioSeleccionado)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Selecciona un usuario desde los resultados.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="empresa-representante"
                  className="text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Empresa
                </Label>
                <select
                  id="empresa-representante"
                  value={empresaId}
                  disabled={guardando || cargandoEmpresas}
                  onChange={(event) => {
                    setEmpresaId(event.target.value)
                    setErrorFormulario(null)
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#1B2C56] focus:ring-2 focus:ring-[#1B2C56]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {cargandoEmpresas ? "Cargando empresas..." : "Seleccionar empresa"}
                  </option>
                  {empresasActivas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
                {errorEmpresas && (
                  <p className="text-xs font-medium text-red-600">
                    {errorEmpresas}
                  </p>
                )}
                {!errorEmpresas && !cargandoEmpresas && empresasActivas.length === 0 && (
                  <p className="text-xs font-medium text-amber-700">
                    No hay empresas activas disponibles.
                  </p>
                )}
                {empresaSeleccionada && (
                  <p className="flex items-center gap-1 text-xs font-medium text-[#5d8a38]">
                    <CheckCircle2 className="size-3.5" />
                    {empresaSeleccionada.nombre}
                  </p>
                )}
              </div>

              {usuarioSeleccionado?.rol === "REPRESENTANTE" && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Este usuario ya es representante. Al confirmar se actualizara
                  su empresa asignada.
                </div>
              )}
            </aside>
          </div>

          {errorFormulario && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <AlertCircle className="size-4" />
              {errorFormulario}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={guardando}
            onClick={cerrar}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={guardando || cargandoEmpresas}
            onClick={confirmarAsignacion}
            className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
          >
            {guardando ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Asignando...
              </>
            ) : (
              "Asignar representante"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
