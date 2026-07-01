"use client"

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { EmpresaAsignable, EmpresasAsignablesResponse, UsuarioApp } from "@/lib/usuarios/tipos"

type PerfilEditable = "TRABAJADOR" | "REPRESENTANTE"

type UseEditarUsuarioParams = {
  usuario: UsuarioApp
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => Promise<void> | void
}

function useEditarUsuario({
  usuario,
  abierto,
  onCerrar,
  onGuardado,
}: UseEditarUsuarioParams) {
  const [rol, setRol] = useState<PerfilEditable>(usuario.perfil)
  const [empresaId, setEmpresaId] = useState<string>(
    usuario.empresa ? String(usuario.empresa.id) : ""
  )
  const [empresas, setEmpresas] = useState<EmpresaAsignable[]>([])
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)

  const empresasActivas = useMemo(
    () => empresas.filter((e) => e.estado !== "INACTIVA"),
    [empresas]
  )

  const empresaSeleccionada = useMemo(
    () => empresasActivas.find((e) => String(e.id) === empresaId),
    [empresaId, empresasActivas]
  )

  const cargarEmpresas = useCallback(async () => {
    setCargandoEmpresas(true)
    setErrorEmpresas(null)

    try {
      const response = await fetch("/api/admin/empresas", { cache: "no-store" })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        throw new Error(data?.error ?? "No se pudieron cargar las empresas")
      }

      const data = (await response.json()) as EmpresasAsignablesResponse
      setEmpresas(data.empresas)
    } catch (err) {
      console.error("[useEditarUsuario] empresas:", err)
      setErrorEmpresas(
        err instanceof Error ? err.message : "No se pudieron cargar las empresas"
      )
    } finally {
      setCargandoEmpresas(false)
    }
  }, [])

  useEffect(() => {
    if (!abierto) return

    setRol(usuario.perfil)
    setEmpresaId(usuario.empresa ? String(usuario.empresa.id) : "")
    setErrorFormulario(null)

    queueMicrotask(() => {
      void cargarEmpresas()
    })
  }, [abierto, usuario, cargarEmpresas])

  const cerrar = useCallback(() => {
    if (guardando) return
    onCerrar()
  }, [guardando, onCerrar])

  const confirmarEdicion = async () => {
    setErrorFormulario(null)

    if (rol === "REPRESENTANTE" && !empresaId) {
      setErrorFormulario("La empresa es obligatoria para un representante.")
      return
    }

    setGuardando(true)

    try {
      const body: { rol: PerfilEditable; empresaId?: number | null } = { rol }

      if (rol === "REPRESENTANTE") {
        body.empresaId = Number(empresaId)
      } else {
        // TRABAJADOR: send null only if user clears the empresa
        body.empresaId = empresaId ? Number(empresaId) : null
      }

      const response = await fetch(
        `/api/admin/usuarios-app/${usuario.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        throw new Error(data?.error ?? "No se pudo actualizar el usuario")
      }

      await onGuardado()
      onCerrar()
    } catch (err) {
      console.error("[useEditarUsuario] guardar:", err)
      setErrorFormulario(
        err instanceof Error ? err.message : "No se pudo actualizar el usuario"
      )
    } finally {
      setGuardando(false)
    }
  }

  return {
    rol,
    setRol,
    empresaId,
    setEmpresaId,
    empresasActivas,
    empresaSeleccionada,
    cargandoEmpresas,
    guardando,
    errorEmpresas,
    errorFormulario,
    cerrar,
    confirmarEdicion,
  }
}

type EditarUsuarioModalProps = {
  usuario: UsuarioApp
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => Promise<void> | void
}

export function EditarUsuarioModal({
  usuario,
  abierto,
  onCerrar,
  onGuardado,
}: EditarUsuarioModalProps) {
  const edicion = useEditarUsuario({ usuario, abierto, onCerrar, onGuardado })

  if (!abierto) return null

  const quitandoRolRepresentante =
    usuario.perfil === "REPRESENTANTE" && edicion.rol === "TRABAJADOR"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-usuario-title"
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="space-y-1">
            <h2
              id="editar-usuario-title"
              className="text-base font-bold text-[#1B2C56]"
            >
              Editar usuario
            </h2>
            <p className="text-sm text-slate-500">
              {usuario.nombre.toUpperCase()}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={edicion.guardando}
            onClick={edicion.cerrar}
            aria-label="Cerrar modal"
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5 space-y-5">
          {/* Rol */}
          <div className="space-y-2">
            <Label
              htmlFor="editar-rol"
              className="text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Rol de sistema
            </Label>
            <select
              id="editar-rol"
              value={edicion.rol}
              disabled={edicion.guardando}
              onChange={(e) =>
                edicion.setRol(e.target.value as "TRABAJADOR" | "REPRESENTANTE")
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#1B2C56] focus:ring-2 focus:ring-[#1B2C56]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="TRABAJADOR">Trabajador</option>
              <option value="REPRESENTANTE">Representante</option>
            </select>
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label
              htmlFor="editar-empresa"
              className="text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Empresa vinculada
              {edicion.rol === "REPRESENTANTE" && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <select
              id="editar-empresa"
              value={edicion.empresaId}
              disabled={edicion.guardando || edicion.cargandoEmpresas}
              onChange={(e) => edicion.setEmpresaId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#1B2C56] focus:ring-2 focus:ring-[#1B2C56]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {edicion.cargandoEmpresas
                  ? "Cargando empresas..."
                  : edicion.rol === "TRABAJADOR"
                    ? "Sin empresa (opcional)"
                    : "Seleccionar empresa"}
              </option>
              {edicion.empresasActivas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
            {edicion.errorEmpresas && (
              <p className="text-xs font-medium text-red-600">
                {edicion.errorEmpresas}
              </p>
            )}
            {!edicion.errorEmpresas &&
              !edicion.cargandoEmpresas &&
              edicion.empresasActivas.length === 0 && (
                <p className="text-xs font-medium text-amber-700">
                  No hay empresas activas disponibles.
                </p>
              )}
            {edicion.empresaSeleccionada && (
              <p className="flex items-center gap-1 text-xs font-medium text-[#5d8a38]">
                <Building2 className="size-3.5" />
                {edicion.empresaSeleccionada.nombre}
                <CheckCircle2 className="size-3.5 ml-0.5" />
              </p>
            )}
          </div>

          {/* Advertencia quitar rol representante */}
          {quitandoRolRepresentante && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Este usuario es actualmente representante. Al guardar perderá ese
              rol y su empresa vinculada podrá quedar sin representante.
            </div>
          )}

          {/* Error formulario */}
          {edicion.errorFormulario && (
            <p className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              {edicion.errorFormulario}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={edicion.guardando}
            onClick={edicion.cerrar}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={edicion.guardando || edicion.cargandoEmpresas}
            onClick={edicion.confirmarEdicion}
            className="bg-[#1B2C56] text-white hover:bg-[#1B2C56]/90"
          >
            {edicion.guardando ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
