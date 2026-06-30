"use client"

import { AlertCircle, Building2, CheckCircle2, Loader2, Search, UserCheck, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { etiquetaEmpresaAsignable, etiquetaPerfil } from "@/lib/usuarios/formatos"
import { formatearTelefonoChileno } from "@/lib/usuarios/telefono"
import type { EmpresaAsignable, UsuarioAsignable } from "@/lib/usuarios/tipos"
import { useAsignarRepresentante } from "@/hooks/useAsignarRepresentante"

type AsignarRepresentanteModalProps = {
  abierto: boolean
  onCerrar: () => void
  onAsignado: () => Promise<void> | void
}

type BuscadorProps = {
  busqueda: string
  guardando: boolean
  onChange: (value: string) => void
}

type ResultadosProps = {
  busqueda: string
  resultados: UsuarioAsignable[]
  usuarioSeleccionado: UsuarioAsignable | null
  buscando: boolean
  guardando: boolean
  errorBusqueda: string | null
  onSeleccionar: (usuario: UsuarioAsignable) => void
}

type EmpresaSelectProps = {
  empresaId: string
  empresas: EmpresaAsignable[]
  cargandoEmpresas: boolean
  guardando: boolean
  errorEmpresas: string | null
  empresaSeleccionada: EmpresaAsignable | undefined
  onChange: (value: string) => void
}

function UsuarioBadge({ usuario }: { usuario: UsuarioAsignable }) {
  return (
    <Badge
      variant="outline"
      className={
        usuario.rol === "REPRESENTANTE"
          ? "border-[#1B2C56]/20 bg-[#1B2C56]/10 text-[10px] font-bold uppercase tracking-wide text-[#1B2C56]"
          : "border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600"
      }
    >
      {etiquetaPerfil(usuario.rol)}
    </Badge>
  )
}

function AsignarRepresentanteBuscador({
  busqueda,
  guardando,
  onChange,
}: BuscadorProps) {
  return (
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
          placeholder="Buscar por RUT, nombre, correo o teléfono"
          onChange={(event) => onChange(event.target.value)}
          className="h-10 border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white"
        />
      </div>
    </div>
  )
}

function AsignarRepresentanteResultados({
  busqueda,
  resultados,
  usuarioSeleccionado,
  buscando,
  guardando,
  errorBusqueda,
  onSeleccionar,
}: ResultadosProps) {
  if (busqueda.trim().length < 2) {
    return (
      <EstadoResultados>
        Ingresa al menos 2 caracteres para buscar cuentas registradas.
      </EstadoResultados>
    )
  }

  if (buscando) {
    return (
      <EstadoResultados className="gap-2 font-medium">
        <Loader2 className="size-4 animate-spin" />
        Buscando usuarios...
      </EstadoResultados>
    )
  }

  if (errorBusqueda) {
    return (
      <EstadoResultados className="text-red-600">{errorBusqueda}</EstadoResultados>
    )
  }

  if (resultados.length === 0) {
    return (
      <EstadoResultados>
        No se encontraron cuentas para {busqueda.trim()}.
      </EstadoResultados>
    )
  }

  return (
    <div className="space-y-2">
      {resultados.map((usuario) => {
        const seleccionado = usuarioSeleccionado?.id === usuario.id

        return (
          <button
            key={usuario.id}
            type="button"
            disabled={guardando}
            onClick={() => onSeleccionar(usuario)}
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
                <p className="font-mono text-xs font-semibold text-slate-500">
                  {formatearTelefonoChileno(usuario.telefono)}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                  <span className="font-mono font-semibold">
                    {usuario.rut ?? "S/RUT"}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>{etiquetaEmpresaAsignable(usuario)}</span>
                </div>
              </div>
              <UsuarioBadge usuario={usuario} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function EstadoResultados({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex h-52 items-center justify-center px-4 text-center text-sm text-slate-500 ${className}`}>
      {children}
    </div>
  )
}

function SeleccionActual({
  usuario,
}: {
  usuario: UsuarioAsignable | null
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserCheck className="size-4 text-[#1B2C56]" />
        <h3 className="text-sm font-bold text-[#1B2C56]">Seleccion actual</h3>
      </div>

      {usuario ? (
        <div className="space-y-2 text-sm">
          <p className="font-bold text-slate-800">{usuario.nombreCompleto}</p>
          <p className="text-xs text-slate-500">
            {usuario.correo ?? "Sin correo registrado"}
          </p>
          <p className="font-mono text-xs font-semibold text-slate-500">
            {formatearTelefonoChileno(usuario.telefono)}
          </p>
          <div className="flex flex-wrap gap-2">
            <UsuarioBadge usuario={usuario} />
            {usuario.rol === "REPRESENTANTE" && (
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
            {etiquetaEmpresaAsignable(usuario)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Selecciona un usuario desde los resultados.
        </p>
      )}
    </div>
  )
}

function AsignarRepresentanteEmpresaSelect({
  empresaId,
  empresas,
  cargandoEmpresas,
  guardando,
  errorEmpresas,
  empresaSeleccionada,
  onChange,
}: EmpresaSelectProps) {
  return (
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
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#1B2C56] focus:ring-2 focus:ring-[#1B2C56]/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {cargandoEmpresas ? "Cargando empresas..." : "Seleccionar empresa"}
        </option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nombre}
          </option>
        ))}
      </select>
      {errorEmpresas && (
        <p className="text-xs font-medium text-red-600">{errorEmpresas}</p>
      )}
      {!errorEmpresas && !cargandoEmpresas && empresas.length === 0 && (
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
  )
}

export function AsignarRepresentanteModal({
  abierto,
  onCerrar,
  onAsignado,
}: AsignarRepresentanteModalProps) {
  const asignacion = useAsignarRepresentante({ abierto, onCerrar, onAsignado })

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
            disabled={asignacion.guardando}
            onClick={asignacion.cerrar}
            aria-label="Cerrar modal"
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-3">
              <AsignarRepresentanteBuscador
                busqueda={asignacion.busqueda}
                guardando={asignacion.guardando}
                onChange={asignacion.actualizarBusqueda}
              />

              <div className="min-h-56 rounded-md border border-slate-200 bg-slate-50/60 p-2">
                <AsignarRepresentanteResultados
                  busqueda={asignacion.busqueda}
                  resultados={asignacion.resultados}
                  usuarioSeleccionado={asignacion.usuarioSeleccionado}
                  buscando={asignacion.buscando}
                  guardando={asignacion.guardando}
                  errorBusqueda={asignacion.errorBusqueda}
                  onSeleccionar={asignacion.seleccionarUsuario}
                />
              </div>
            </section>

            <aside className="space-y-4">
              <SeleccionActual usuario={asignacion.usuarioSeleccionado} />
              <AsignarRepresentanteEmpresaSelect
                empresaId={asignacion.empresaId}
                empresas={asignacion.empresasActivas}
                cargandoEmpresas={asignacion.cargandoEmpresas}
                guardando={asignacion.guardando}
                errorEmpresas={asignacion.errorEmpresas}
                empresaSeleccionada={asignacion.empresaSeleccionada}
                onChange={asignacion.seleccionarEmpresa}
              />

              {asignacion.usuarioSeleccionado?.rol === "REPRESENTANTE" && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Este usuario ya es representante. Al confirmar se actualizara
                  su empresa asignada.
                </div>
              )}
            </aside>
          </div>

          {asignacion.errorFormulario && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <AlertCircle className="size-4" />
              {asignacion.errorFormulario}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={asignacion.guardando}
            onClick={asignacion.cerrar}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={asignacion.guardando || asignacion.cargandoEmpresas}
            onClick={asignacion.confirmarAsignacion}
            className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
          >
            {asignacion.guardando ? (
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
