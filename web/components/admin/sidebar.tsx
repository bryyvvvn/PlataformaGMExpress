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
  Users
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gestión de Pedidos", href: "/dashboard/pedidos", icon: ClipboardList },
  { name: "Subir Platos", href: "/dashboard/platos", icon: UtensilsCrossed },
  { name: "Planificador Semanal", href: "/dashboard/planificador", icon: CalendarDays },
  { name: "Empresas Clientes", href: "/dashboard/empresas", icon: Building2 },
  { name: "Usuarios de App", href: "/dashboard/usuarios", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-secondary shadow-xl">
      <div className="flex h-20 items-center justify-center border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">GM Express</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-white/50">
          Menú Principal
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-white/50 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}