import { Briefcase, UserCheck, Users, UserX } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { ResumenUsuariosApp } from "@/lib/usuarios/tipos"

type UsuariosKpiCardsProps = {
  resumen: ResumenUsuariosApp
}

export function UsuariosKpiCards({ resumen }: UsuariosKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total Registrados"
        value={resumen.total}
        color="#1B2C56"
        icon={<Users className="size-5 text-[#1B2C56]" />}
      />
      <KpiCard
        label="Trabajadores"
        value={resumen.trabajadores}
        color="#75AA46"
        icon={<Briefcase className="size-5 text-[#75AA46]" />}
        valueClassName="text-[#75AA46]"
        iconClassName="bg-[#75AA46]/10"
      />
      <KpiCard
        label="Representantes"
        value={resumen.representantes}
        color="#1B2C56"
        icon={<UserCheck className="size-5 text-[#1B2C56]" />}
      />
      <KpiCard
        label="Sin Asignación"
        value={resumen.sinEmpresa}
        color="#f59e0b"
        icon={<UserX className="size-5 text-amber-600" />}
        valueClassName="text-amber-600"
        iconClassName="bg-amber-50"
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  color,
  icon,
  valueClassName,
  iconClassName,
}: {
  label: string
  value: number
  color: string
  icon: React.ReactNode
  valueClassName?: string
  iconClassName?: string
}) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-md border-slate-200 bg-white shadow-sm">
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <CardContent className="flex flex-1 items-center justify-between p-5">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className={`text-3xl font-bold ${valueClassName ?? "text-[#1B2C56]"}`}>
            {value}
          </p>
        </div>
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${iconClassName ?? "bg-[#1B2C56]/10"}`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
