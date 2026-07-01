"use client"

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  UserCog,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { etiquetaPerfil } from "@/lib/usuarios/formatos"
import type {
  EmpresaAsignable,
  EmpresasAsignablesResponse,
  PerfilUsuarioApp,
  UsuarioApp,
} from "@/lib/usuarios/tipos"

type EditarUsuarioModalProps = {
  abierto: boolean
  usuario: UsuarioApp
  onCerrar: () => void
  onGuardado: () => Promise<void> | void
}

type EditarUsuarioRequest = {
  rol: PerfilUsuarioApp
  empresaId?: number | null
  nombre: string
  rut: string | null
}

type ErrorResponse = {
  error?: string
}

function obtenerMensajeError(data: ErrorResponse | null, fallback: string) {
  return data?.error ?? fallback
}

function RolBadge({ rol }: { rol: PerfilUsuarioApp }) {
  return (
    <Badge
      variant="outline"
      className={
        rol === "REPRESENTANTE"
          ? "border-[#1B2C56]/20 bg-[#1B2C56]/10 text-[10px] font-bold uppercase tracking-wide text-[#1B2C56]"
          : "border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600"
      }
    >
      {etiquetaPerfil(rol)}
    </Badge>
  )
}

export function EditarUsuarioModal({
  abierto,
  usuario,
  onCerrar,
  onGuardado,
}: EditarUsuarioModalProps) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const [rut, setRut] = useState(usuario.rut ?? "")
  const [rol, setRol] = useState<PerfilUsuarioApp>(usuario.perfil)
  const [empresaId, setEmpresaId] = useState(
    usuario.empresa ? String(usuario.empresa.id) : ""
  )
  const [empresas, setEmpresas] = useState<EmpresaAsignable[]>([])
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)

  const empresasActivas = useMemo(
    () => empresas.filter((empresa) => empresa.estado === "ACTIVA"),
    [empresas]
  )

  const empresaSeleccionada = useMemo(
    () => empresasActivas.find((empresa) => String(empresa.id) === empresaId),
    [empresaId, empresasActivas]
  )

  const quitandoRepresentante =
    usuario.perfil === "REPRESENTANTE" && rol === "TRABAJADOR"

  useEffect(() => {
    if (!abierto) return

    setNombre(usuario.nombre)
    setRut(usuario.rut ?? "")
    setRol(usuario.perfil)
    setEmpresaId(usuario.empresa ? String(usuario.empresa.id) : "")
    setErrorFormulario(null)
  }, [abierto, usuario])

  useEffect(() => {
    if (!abierto) return

    const controller = new AbortController()

    async function cargarEmpresas() {
      setCargandoEmpresas(true)
      setErrorEmpresas(null)

      try {
        const response = await fetch("/api/admin/empresas", {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | ErrorResponse
            | null

          throw new Error(
            obtenerMensajeError(data, "No se pudieron cargar las empresas")
          )
        }

        const data = (await response.json()) as EmpresasAsignablesResponse
        setEmpresas(data.empresas)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return

        console.error("[EditarUsuarioModal] empresas:", err)
        setErrorEmpresas(
          err instanceof Error ? err.message : "No se pudieron cargar las empresas"
        )
      } finally {
        if (!controller.signal.aborted) {
          setCargandoEmpresas(false)
        }
      }
    }

    void cargarEmpresas()

    return () => {
      controller.abort()
    }
  }, [abierto])

  const cerrar = () => {
    if (guardando) return
    onCerrar()
  }

  const guardar = async () => {
    setErrorFormulario(null)

    const nombreNormalizado = nombre.trim()
    const rutNormalizado = rut.trim()

    if (nombreNormalizado.length === 0) {
      setErrorFormulario("Ingresa el nombre del usuario.")
      return
    }

    if (rol === "REPRESENTANTE" && empresaId.length === 0) {
      setErrorFormulario("Selecciona una empresa para el representante.")
      return
    }

    const payload: EditarUsuarioRequest = {
      rol,
      nombre: nombreNormalizado,
      rut: rutNormalizado.length > 0 ? rutNormalizado : null,
    }

    if (empresaId.length === 0) {
      payload.empresaId = null
    } else {
      const empresaIdNumber = Number(empresaId)

      if (!Number.isInteger(empresaIdNumber) || empresaIdNumber <= 0) {
        setErrorFormulario("Selecciona una empresa valida.")
        return
      }

      payload.empresaId = empresaIdNumber
    }

    setGuardando(true)

    try {
      const response = await fetch(`/api/admin/usuarios-app/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | ErrorResponse
          | null

        throw new Error(
          obtenerMensajeError(data, "No se pudo actualizar el usuario")
        )
      }

      await onGuardado()
      onCerrar()
    } catch (err) {
      console.error("[EditarUsuarioModal] guardar:", err)
      setErrorFormulario(
        err instanceof Error ? err.message : "No se pudo actualizar el usuario"
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
        aria-labelledby="editar-usuario-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="space-y-1">
            <h2
              id="editar-usuario-title"
              className="text-base font-bold text-[#1B2C56]"
            >
              Editar usuario
            </h2>
            <p className="text-sm text-slate-500">
              Actualiza sus datos, rol y vinculacion empresarial.
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
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserCog className="size-4 text-[#1B2C56]" />
                  <h3 className="text-sm font-bold text-[#1B2C56]">
                    Usuario seleccionado
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-800">
                    {usuario.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {usuario.correo ?? usuario.nombreUsuario ?? "Sin correo"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <RolBadge rol={usuario.perfil} />
                  </div>
                  <p className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                    <Building2 className="size-3.5" />
                    {usuario.empresa?.nombre ?? "Sin empresa asignada"}
                  </p>
                </div>
              </div>

              {quitandoRepresentante && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Este usuario dejara de ser representante. Puede conservar una
                  empresa vinculada como trabajador o quedar desvinculado.
                </div>
              )}
            </aside>

            <section className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor="editar-usuario-nombre"
                    className="text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Nombre
                  </Label>
                  <Input
                    id="editar-usuario-nombre"
                    value={nombre}
                    disabled={guardando}
                    onChange={(event) => {
                      setNombre(event.target.value)
                      setErrorFormulario(null)
                    }}
                    className="h-10 border-slate-200 bg-slate-50 text-sm focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="editar-usuario-rut"
                    className="text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    RUT
                  </Label>
                  <Input
                    id="editar-usuario-rut"
                    value={rut}
                    disabled={guardando}
                    placeholder="Sin RUT"
                    onChange={(event) => {
                      setRut(event.target.value)
                      setErrorFormulario(null)
                    }}
                    className="h-10 border-slate-200 bg-slate-50 font-mono text-sm focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="editar-usuario-rol"
                    className="text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Rol
                  </Label>
                  <select
                    id="editar-usuario-rol"
                    value={rol}
                    disabled={guardando}
                    onChange={(event) => {
                      setRol(event.target.value as PerfilUsuarioApp)
                      setErrorFormulario(null)
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#1B2C56] focus:ring-2 focus:ring-[#1B2C56]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="TRABAJADOR">Trabajador</option>
                    <option value="REPRESENTANTE">Representante</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="editar-usuario-empresa"
                  className="text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Empresa {rol === "TRABAJADOR" ? "(opcional)" : ""}
                </Label>
                <select
                  id="editar-usuario-empresa"
                  value={empresaId}
                  disabled={guardando || cargandoEmpresas}
                  onChange={(event) => {
                    setEmpresaId(event.target.value)
                    setErrorFormulario(null)
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#1B2C56] focus:ring-2 focus:ring-[#1B2C56]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {cargandoEmpresas
                      ? "Cargando empresas..."
                      : rol === "TRABAJADOR"
                        ? "Sin empresa vinculada"
                        : "Seleccionar empresa"}
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
                {!errorEmpresas &&
                  !cargandoEmpresas &&
                  empresasActivas.length === 0 && (
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
            </section>
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
            onClick={guardar}
            className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
          >
            {guardando ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
