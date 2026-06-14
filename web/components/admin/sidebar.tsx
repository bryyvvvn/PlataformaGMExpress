"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  Building2,
  Users,
  Settings,
  FileSpreadsheet,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Planificador", href: "/planificador", icon: CalendarDays },
  { name: "Gestión de Pedidos", href: "/pedidos", icon: ClipboardList },
  { name: "Facturación", href: "/facturacion", icon: FileSpreadsheet },
  { name: "Empresas Clientes", href: "/empresas", icon: Building2 },
  { name: "Usuarios de App", href: "/usuarios", icon: Users },
  { name: "Configuración", href: "/configuracion", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-[#1B2C56] border-r border-slate-800 shadow-2xl">
      {/* Cabecera / Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10 bg-[#122042]">
        <div className="flex items-center gap-3">
          {/* AQUÍ IRÁ EL LOGO: Cuando tengas tiempo, cambia este div por: <img src="/logo.png" className="h-8 w-8 object-contain" alt="Logo" /> */}
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#75AA46] shadow-sm">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">GM Express</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        <div className="mb-4 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Menú Principal
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#75AA46] text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer Logístico - Toque profesional */}
      <div className="p-4 border-t border-white/10">
      </div>
    </aside>
  )
}