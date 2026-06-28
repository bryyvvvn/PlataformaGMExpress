import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  EmpresaCobranzaFields,
  EmpresaContactoFields,
  EmpresaConvenioInicialFields,
  EmpresaDatosGeneralesFields,
  EmpresaRepresentanteFields,
  EmpresaUbicacionFields,
} from "@/components/admin/empresas/empresa-form-fields"
import { PASOS_CREAR_EMPRESA } from "@/components/admin/empresas/empresa-crear-pasos"
import type {
  CampoBooleanoConvenio,
  ContactoEmpresaForm,
  ContactoFormularioTipo,
  ConvenioForm,
  CrearEmpresaForm,
  EmpresaFormularioBase,
  EmpresaRelacionResumen,
  EstadoEmpresaCliente,
  PasoCrearEmpresa,
  TipoEmpaquetado,
} from "@/lib/empresas/tipos"

export function EmpresaCrearFormCard({
  pasoCrearEmpresa,
  guardandoEmpresa,
  crearEmpresaForm,
  crearEmpresaConvenio,
  casasMatrices,
  contactoTitularForm,
  contactoSuplenteForm,
  contactoCobranzaForm,
  usarTitularComoCobranza,
  setUsarTitularComoCobranza,
  actualizarCampoCrearEmpresa,
  actualizarConvenioCrearEmpresa,
  actualizarTipoEmpaquetadoCrearEmpresa,
  actualizarContacto,
}: {
  pasoCrearEmpresa: PasoCrearEmpresa
  guardandoEmpresa: boolean
  crearEmpresaForm: CrearEmpresaForm
  casasMatrices: EmpresaRelacionResumen[]
  crearEmpresaConvenio: ConvenioForm
  contactoTitularForm: ContactoEmpresaForm
  contactoSuplenteForm: ContactoEmpresaForm
  contactoCobranzaForm: ContactoEmpresaForm
  usarTitularComoCobranza: boolean
  setUsarTitularComoCobranza: (value: boolean) => void
  actualizarCampoCrearEmpresa: (
    campo: keyof EmpresaFormularioBase,
    valor: string | boolean | EstadoEmpresaCliente
  ) => void
  actualizarConvenioCrearEmpresa: (
    campo: CampoBooleanoConvenio,
    checked: boolean
  ) => void
  actualizarTipoEmpaquetadoCrearEmpresa: (
    tipoEmpaquetado: TipoEmpaquetado | null
  ) => void
  actualizarContacto: (
    tipo: ContactoFormularioTipo,
    campo: keyof ContactoEmpresaForm,
    valor: string
  ) => void
}) {
  const pasoActual = PASOS_CREAR_EMPRESA[pasoCrearEmpresa]
  const PasoActualIcon = pasoActual.icon

  return (
    <Card className="w-full rounded-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1B2C56]">
          <PasoActualIcon className="h-5 w-5" />
          {pasoActual.titulo}
        </CardTitle>
        <CardDescription>{pasoActual.descripcion}</CardDescription>
      </CardHeader>

      <CardContent>
        {pasoCrearEmpresa === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <EmpresaDatosGeneralesFields
              form={crearEmpresaForm}
              disabled={guardandoEmpresa}
              onChange={actualizarCampoCrearEmpresa}
              casasMatrices={casasMatrices}
            />
            <EmpresaUbicacionFields
              form={crearEmpresaForm}
              disabled={guardandoEmpresa}
              onChange={actualizarCampoCrearEmpresa}
            />
            <EmpresaRepresentanteFields
              form={crearEmpresaForm}
              disabled={guardandoEmpresa}
              onChange={actualizarCampoCrearEmpresa}
            />
          </div>
        )}

        {pasoCrearEmpresa === 1 && (
          <EmpresaContactoFields
            tipo="titular"
            form={contactoTitularForm}
            disabled={guardandoEmpresa}
            required
            layout="step"
            onChange={actualizarContacto}
          />
        )}

        {pasoCrearEmpresa === 2 && (
          <EmpresaContactoFields
            tipo="suplente"
            form={contactoSuplenteForm}
            disabled={guardandoEmpresa}
            required={false}
            layout="step"
            onChange={actualizarContacto}
          />
        )}

        {pasoCrearEmpresa === 3 && (
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm">
              <input
                type="checkbox"
                checked={usarTitularComoCobranza}
                disabled={guardandoEmpresa}
                onChange={(event) =>
                  setUsarTitularComoCobranza(event.target.checked)
                }
                className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#75aa46]"
              />
              <span className="space-y-1">
                <span className="block font-medium text-[#1B2C56]">
                  Usar interlocutor titular como dato de cobranza
                </span>
                <span className="block text-muted-foreground">
                  Se guardará una copia de los datos del interlocutor titular como
                  contacto de cobranza.
                </span>
              </span>
            </label>

            {!usarTitularComoCobranza && (
              <EmpresaCobranzaFields
                form={contactoCobranzaForm}
                disabled={guardandoEmpresa}
                layout="step"
                onChange={actualizarContacto}
              />
            )}
          </div>
        )}

        {pasoCrearEmpresa === 4 && (
          <EmpresaConvenioInicialFields
            convenio={crearEmpresaConvenio}
            disabled={guardandoEmpresa}
            onBooleanChange={actualizarConvenioCrearEmpresa}
            onTipoEmpaquetadoChange={actualizarTipoEmpaquetadoCrearEmpresa}
          />
        )}
      </CardContent>
    </Card>
  )
}
