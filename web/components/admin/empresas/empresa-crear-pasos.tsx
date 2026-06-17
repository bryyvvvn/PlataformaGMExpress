import {
  Building2,
  Check,
  CircleDollarSign,
  FileText,
  User,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { PasoCrearEmpresa } from "@/lib/empresas/tipos"

export const PASOS_CREAR_EMPRESA: Array<{
  id: PasoCrearEmpresa
  label: string
  icon: LucideIcon
  titulo: string
  descripcion: string
}> = [
  {
    id: 0,
    label: "Datos Generales",
    icon: Building2,
    titulo: "Datos Generales de la Empresa",
    descripcion: "Ingrese la información administrativa de la empresa",
  },
  {
    id: 1,
    label: "Titular",
    icon: User,
    titulo: "Interlocutor Titular",
    descripcion: "Datos del contacto principal de la empresa",
  },
  {
    id: 2,
    label: "Suplente",
    icon: Users,
    titulo: "Interlocutor Suplente",
    descripcion: "Datos del contacto suplente, si corresponde",
  },
  {
    id: 3,
    label: "Cobranza",
    icon: CircleDollarSign,
    titulo: "Datos de cobranza",
    descripcion: "Datos obligatorios para gestion de cobranza",
  },
  {
    id: 4,
    label: "Convenio",
    icon: FileText,
    titulo: "Convenio Inicial",
    descripcion: "Seleccione los productos incluidos en el convenio",
  },
]

export function EmpresaCrearPasos({
  pasoCrearEmpresa,
}: {
  pasoCrearEmpresa: PasoCrearEmpresa
}) {
  return (
    <div className="w-full rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex w-full items-start">
        {PASOS_CREAR_EMPRESA.map((paso, index) => {
          const Icon = paso.icon
          const isCompleted = pasoCrearEmpresa > paso.id
          const isCurrent = pasoCrearEmpresa === paso.id

          return (
            <div key={paso.id} className="flex flex-1 items-start">
              <div className="flex min-w-[76px] flex-col items-center sm:min-w-[110px]">
                <div
                  className={
                    isCompleted
                      ? "flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#75aa46] bg-[#75aa46] text-white shadow-sm"
                      : isCurrent
                        ? "flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#75aa46] bg-white text-[#75aa46] shadow-sm"
                        : "flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400"
                  }
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={
                    isCurrent || isCompleted
                      ? "mt-2 max-w-[92px] text-center text-xs font-semibold text-[#1b2c56] sm:max-w-none sm:text-sm"
                      : "mt-2 max-w-[92px] text-center text-xs font-medium text-slate-500 sm:max-w-none sm:text-sm"
                  }
                >
                  {paso.label}
                </span>
              </div>

              {index < PASOS_CREAR_EMPRESA.length - 1 && (
                <div
                  className={
                    isCompleted
                      ? "mt-[22px] h-0.5 flex-1 bg-[#75aa46]"
                      : "mt-[22px] h-0.5 flex-1 bg-slate-200"
                  }
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
