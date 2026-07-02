"use client"

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  esTelefonoChilenoValido,
  TELEFONO_CHILENO_ERROR,
} from "@/lib/usuarios/telefono"
import type {
  EmpresaAsignable,
  EmpresasAsignablesResponse,
} from "@/lib/usuarios/tipos"
import { useCrearUsuario } from "@/hooks/useCrearUsuario"

type AgregarUsuarioModalProps = {
  abierto: boolean
  onCerrar: () => void
  onUsuarioCreado: () => Promise<void> | void
}

type ErrorResponse = {
  error?: string
}

type FormState = {
  rut: string
  nombre: string
  apellido: string
  password: string
  empresaId: string
  telefono: string
  correo: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const FORM_INICIAL: FormState = {
  rut: "",
  nombre: "",
  apellido: "",
  password: "",
  empresaId: "",
  telefono: "",
  correo: "",
}

const EMAIL_BASICO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function obtenerMensajeError(data: ErrorResponse | null, fallback: string) {
  return data?.error ?? fallback
}

function validarFormulario(form: FormState): FormErrors {
  const errores: FormErrors = {}

  if (form.rut.trim().length === 0) {
    errores.rut = "Ingresa el RUT del usuario."
  }

  if (form.nombre.trim().length === 0) {
    errores.nombre = "Ingresa el nombre del usuario."
  }

  if (form.apellido.trim().length === 0) {
    errores.apellido = "Ingresa el apellido del usuario."
  }

  if (form.password.length === 0) {
    errores.password = "Ingresa una contrasena."
  } else if (form.password.length < 8) {
    errores.password = "La contrasena debe tener al menos 8 caracteres."
  }

  if (form.empresaId.length === 0) {
    errores.empresaId = "Selecciona una empresa."
  }

  if (form.telefono.trim().length === 0) {
    errores.telefono = "Ingresa el telefono del usuario."
  } else if (!esTelefonoChilenoValido(form.telefono)) {
    errores.telefono = TELEFONO_CHILENO_ERROR
  }

  if (form.correo.trim().length === 0) {
    errores.correo = "Ingresa el correo del usuario."
  } else if (!EMAIL_BASICO_REGEX.test(form.correo.trim())) {
    errores.correo = "Ingresa un correo valido."
  }

  return errores
}

export function AgregarUsuarioModal({
  abierto,
  onCerrar,
  onUsuarioCreado,
}: AgregarUsuarioModalProps) {
  const {
    crearUsuario,
    cargando: guardando,
    error: errorCrearUsuario,
    success,
    limpiarEstado,
  } = useCrearUsuario()
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [errores, setErrores] = useState<FormErrors>({})
  const [empresas, setEmpresas] = useState<EmpresaAsignable[]>([])
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)

  const empresasActivas = useMemo(
    () => empresas.filter((empresa) => empresa.estado !== "INACTIVA"),
    [empresas]
  )

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

        console.error("[AgregarUsuarioModal] empresas:", err)
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

  const actualizarCampo = (campo: keyof FormState, value: string) => {
    limpiarEstado()
    setForm((current) => ({ ...current, [campo]: value }))
    setErrores((current) => {
      if (!current[campo]) return current

      const next = { ...current }
      delete next[campo]
      return next
    })
  }

  const cerrar = () => {
    if (guardando) return
    onCerrar()
  }

  const guardarUsuario = async () => {
    limpiarEstado()

    const erroresFormulario = validarFormulario(form)

    setErrores(erroresFormulario)

    if (Object.keys(erroresFormulario).length > 0) return

    try {
      await crearUsuario(form)
      await onUsuarioCreado()
      onCerrar()
    } catch {
      return
    }
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agregar-usuario-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-[#1B2C56]" />
              <h2
                id="agregar-usuario-title"
                className="text-base font-bold text-[#1B2C56]"
              >
                Agregar usuario
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Crea una cuenta de acceso para la aplicacion movil y la vincula a
              una empresa.
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
          <div className="mb-4 rounded-md border border-[#75aa46]/20 bg-[#75aa46]/10 px-3 py-2 text-xs font-semibold text-[#5d8a38]">
            El usuario se creara como trabajador y quedara disponible en Clerk y
            en el directorio de usuarios de app.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="agregar-usuario-rut"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                RUT
              </Label>
              <Input
                id="agregar-usuario-rut"
                value={form.rut}
                disabled={guardando}
                placeholder="12.345.678-9"
                onChange={(event) => actualizarCampo("rut", event.target.value)}
                aria-invalid={Boolean(errores.rut)}
                className="h-10 border-slate-200 bg-slate-50 font-mono text-sm focus:bg-white"
              />
              {errores.rut && (
                <p className="text-xs font-medium text-red-600">{errores.rut}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="agregar-usuario-empresa"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Empresa
              </Label>
              <select
                id="agregar-usuario-empresa"
                value={form.empresaId}
                disabled={guardando || cargandoEmpresas}
                onChange={(event) =>
                  actualizarCampo("empresaId", event.target.value)
                }
                aria-invalid={Boolean(errores.empresaId)}
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
              {errores.empresaId && (
                <p className="text-xs font-medium text-red-600">
                  {errores.empresaId}
                </p>
              )}
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
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="agregar-usuario-nombre"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Nombre
              </Label>
              <Input
                id="agregar-usuario-nombre"
                value={form.nombre}
                disabled={guardando}
                onChange={(event) =>
                  actualizarCampo("nombre", event.target.value)
                }
                aria-invalid={Boolean(errores.nombre)}
                className="h-10 border-slate-200 bg-slate-50 text-sm focus:bg-white"
              />
              {errores.nombre && (
                <p className="text-xs font-medium text-red-600">
                  {errores.nombre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="agregar-usuario-apellido"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Apellido
              </Label>
              <Input
                id="agregar-usuario-apellido"
                value={form.apellido}
                disabled={guardando}
                onChange={(event) =>
                  actualizarCampo("apellido", event.target.value)
                }
                aria-invalid={Boolean(errores.apellido)}
                className="h-10 border-slate-200 bg-slate-50 text-sm focus:bg-white"
              />
              {errores.apellido && (
                <p className="text-xs font-medium text-red-600">
                  {errores.apellido}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label
                htmlFor="agregar-usuario-password"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Contrasena
              </Label>
              <Input
                id="agregar-usuario-password"
                type="password"
                value={form.password}
                disabled={guardando}
                minLength={8}
                onChange={(event) =>
                  actualizarCampo("password", event.target.value)
                }
                aria-invalid={Boolean(errores.password)}
                className="h-10 border-slate-200 bg-slate-50 text-sm focus:bg-white"
              />
              {errores.password ? (
                <p className="text-xs font-medium text-red-600">
                  {errores.password}
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-500">
                  Minimo 8 caracteres. No se guarda en la base de datos.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="agregar-usuario-telefono"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Telefono
              </Label>
              <Input
                id="agregar-usuario-telefono"
                value={form.telefono}
                disabled={guardando}
                placeholder="+56 9 1234 5678"
                onChange={(event) =>
                  actualizarCampo("telefono", event.target.value)
                }
                aria-invalid={Boolean(errores.telefono)}
                className="h-10 border-slate-200 bg-slate-50 text-sm focus:bg-white"
              />
              {errores.telefono && (
                <p className="text-xs font-medium text-red-600">
                  {errores.telefono}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="agregar-usuario-correo"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Correo
              </Label>
              <Input
                id="agregar-usuario-correo"
                type="email"
                value={form.correo}
                disabled={guardando}
                placeholder="usuario@empresa.cl"
                onChange={(event) =>
                  actualizarCampo("correo", event.target.value)
                }
                aria-invalid={Boolean(errores.correo)}
                className="h-10 border-slate-200 bg-slate-50 text-sm focus:bg-white"
              />
              {errores.correo && (
                <p className="text-xs font-medium text-red-600">
                  {errores.correo}
                </p>
              )}
            </div>
          </div>

          {errorCrearUsuario && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <AlertCircle className="size-4" />
              {errorCrearUsuario}
            </p>
          )}
          {success && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-[#75aa46]/20 bg-[#75aa46]/10 px-3 py-2 text-sm font-semibold text-[#5d8a38]">
              <CheckCircle2 className="size-4" />
              {success}
            </p>
          )}
          {Object.keys(errores).length > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <AlertCircle className="size-4" />
              Revisa los campos marcados antes de guardar.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1 text-xs font-semibold text-[#5d8a38]">
            <CheckCircle2 className="size-3.5" />
            Creacion segura con validacion de administrador.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
              onClick={guardarUsuario}
              className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
            >
              {guardando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear usuario"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
