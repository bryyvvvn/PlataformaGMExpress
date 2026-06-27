import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  OPCIONES_CONVENIO,
  OPCIONES_TIPO_EMPAQUETADO,
} from "@/lib/empresas/constantes"
import type {
  CampoBooleanoConvenio,
  ConvenioForm,
  EmpresaCliente,
  TipoEmpaquetado,
} from "@/lib/empresas/tipos"

export function EmpresaConvenioModal({
  empresa,
  convenioForm,
  guardandoConvenio,
  errorConvenio,
  cerrarModalConvenio,
  actualizarCampoConvenio,
  actualizarTipoEmpaquetado,
  guardarConvenio,
}: {
  empresa: EmpresaCliente | null
  convenioForm: ConvenioForm
  guardandoConvenio: boolean
  errorConvenio: string | null
  cerrarModalConvenio: () => void
  actualizarCampoConvenio: (
    campo: CampoBooleanoConvenio,
    checked: boolean
  ) => void
  actualizarTipoEmpaquetado: (tipoEmpaquetado: TipoEmpaquetado | null) => void
  guardarConvenio: () => void
}) {
  if (!empresa) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-[#1B2C56]">Editar convenio</h2>
          <p className="text-sm text-slate-600">
            Selecciona los productos disponibles para {empresa.nombre}.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipoEmpaquetado" className="text-sm font-medium">
              Tipo de empaquetado
            </Label>
            <select
              id="tipoEmpaquetado"
              value={convenioForm.tipoEmpaquetado ?? ""}
              disabled={guardandoConvenio}
              onChange={(event) =>
                actualizarTipoEmpaquetado(
                  event.target.value
                    ? (event.target.value as TipoEmpaquetado)
                    : null
                )
              }
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No definido</option>
              {OPCIONES_TIPO_EMPAQUETADO.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>

          {OPCIONES_CONVENIO.map((opcion) => (
            <div key={opcion.campo} className="flex items-start gap-3">
              <input
                id={opcion.campo}
                type="checkbox"
                checked={convenioForm[opcion.campo]}
                disabled={guardandoConvenio}
                onChange={(event) =>
                  actualizarCampoConvenio(opcion.campo, event.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-border accent-[#75aa46]"
              />
              <div className="space-y-1">
                <Label htmlFor={opcion.campo} className="text-sm font-medium">
                  {opcion.label}
                </Label>
                {opcion.ayuda && (
                  <p className="text-xs leading-5 text-slate-500">{opcion.ayuda}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {errorConvenio && (
          <p className="mt-4 text-sm text-destructive">{errorConvenio}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={guardandoConvenio}
            onClick={cerrarModalConvenio}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[#75aa46] text-white hover:bg-[#5d8a38]"
            disabled={guardandoConvenio}
            onClick={guardarConvenio}
          >
            {guardandoConvenio ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
