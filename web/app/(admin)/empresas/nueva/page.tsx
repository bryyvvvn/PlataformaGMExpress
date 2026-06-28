"use client"

import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmpresaCrearFormCard } from "@/components/admin/empresas/empresa-crear-form-card"
import { EmpresaCrearPasos } from "@/components/admin/empresas/empresa-crear-pasos"
import { useCrearEmpresa } from "@/hooks/useCrearEmpresa"

export default function NuevaEmpresaPage() {
  const {
    pasoCrearEmpresa,
    guardandoEmpresa,
    errorCrearEmpresa,
    crearEmpresaForm,
    casasMatrices,
    crearEmpresaConvenio,
    contactoTitularForm,
    contactoSuplenteForm,
    contactoCobranzaForm,
    usarTitularComoCobranza,
    setUsarTitularComoCobranza,
    actualizarCampoCrearEmpresa,
    actualizarConvenioCrearEmpresa,
    actualizarTipoEmpaquetadoCrearEmpresa,
    actualizarContacto,
    avanzarPasoCrearEmpresa,
    retrocederPasoCrearEmpresa,
    cancelar,
    crearEmpresa,
  } = useCrearEmpresa()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Empresas
          </p>
          <h1 className="text-xl font-semibold text-[#1B2C56]">
            Agregar Nueva Empresa
          </h1>
          <p className="text-sm text-slate-600">
            Complete los datos para registrar una nueva empresa cliente
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={guardandoEmpresa}
          onClick={cancelar}
        >
          Cancelar
        </Button>
      </div>

      <EmpresaCrearPasos pasoCrearEmpresa={pasoCrearEmpresa} />

      <EmpresaCrearFormCard
        pasoCrearEmpresa={pasoCrearEmpresa}
        guardandoEmpresa={guardandoEmpresa}
        crearEmpresaForm={crearEmpresaForm}
        casasMatrices={casasMatrices}
        crearEmpresaConvenio={crearEmpresaConvenio}
        contactoTitularForm={contactoTitularForm}
        contactoSuplenteForm={contactoSuplenteForm}
        contactoCobranzaForm={contactoCobranzaForm}
        usarTitularComoCobranza={usarTitularComoCobranza}
        setUsarTitularComoCobranza={setUsarTitularComoCobranza}
        actualizarCampoCrearEmpresa={actualizarCampoCrearEmpresa}
        actualizarConvenioCrearEmpresa={actualizarConvenioCrearEmpresa}
        actualizarTipoEmpaquetadoCrearEmpresa={
          actualizarTipoEmpaquetadoCrearEmpresa
        }
        actualizarContacto={actualizarContacto}
      />

      {errorCrearEmpresa && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorCrearEmpresa}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {pasoCrearEmpresa > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={guardandoEmpresa}
              onClick={retrocederPasoCrearEmpresa}
              className="border-[#1b2c56] text-[#1b2c56] hover:bg-[#1b2c56] hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {pasoCrearEmpresa < 4 ? (
            <Button
              type="button"
              disabled={guardandoEmpresa}
              onClick={avanzarPasoCrearEmpresa}
              className="bg-[#1b2c56] text-white hover:bg-[#152242]"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={guardandoEmpresa}
              onClick={crearEmpresa}
              className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
            >
              <Check className="mr-2 h-4 w-4" />
              {guardandoEmpresa ? "Guardando..." : "Guardar Empresa"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
