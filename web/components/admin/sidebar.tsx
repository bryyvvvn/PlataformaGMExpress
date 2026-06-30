"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Building2,
  Users,
  FileSpreadsheet,
  LogOut,
  ChevronRight,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Planificador", href: "/planificador", icon: CalendarDays },
  { name: "Gestión de Pedidos", href: "/pedidos", icon: ClipboardList },
  { name: "Facturación", href: "/facturacion", icon: FileSpreadsheet },
  { name: "Empresas Clientes", href: "/empresas", icon: Building2 },
  { name: "Usuarios de App", href: "/usuarios", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  const cerrarSesion = async () => {
    if (cerrandoSesion) return

    setCerrandoSesion(true)

    try {
      await signOut({ redirectUrl: "/auth/login" })
    } catch (error) {
      console.error("[Sidebar] Error cerrando sesión:", error)
      setCerrandoSesion(false)
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-slate-800 bg-[#1B2C56] shadow-2xl">
      {/* Cabecera / Logo */}
      <div className="flex h-24 items-center justify-center border-b border-white/10 bg-[#122042] px-4">
        <Link
          href="/dashboard"
          aria-label="Ir al dashboard"
          className="flex items-center justify-center"
        >
          <Image
            src="/logo-blanco.png"
            alt="GM Express"
            width={180}
            height={80}
            priority
            className="h-40 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        <div className="mb-4 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Menú Principal
        </div>

        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`)

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
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Administración */}
      <div className="border-t border-white/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="group flex w-full items-center gap-3 rounded-xl border border-white/15 bg-[#263B70] px-3 py-3 text-left text-sm font-medium text-slate-300 shadow-sm outline-none transition-all duration-150 hover:border-white/25 hover:bg-[#30477D] hover:text-white data-[state=open]:border-white/25 data-[state=open]:bg-[#30477D]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 shadow-sm ring-1 ring-white/20">
              <Image
                src="/logo-gm-verde-azul.png"
                alt="GM Express"
                width={34}
                height={34}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-white">
                Administración
              </span>
              <span className="truncate text-xs text-slate-300">
                Cuenta admin
              </span>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-white group-data-[state=open]:-rotate-90 group-data-[state=open]:text-white" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={10}
            className="w-[224px] rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-2xl"
          >
            <DropdownMenuItem
              disabled={cerrandoSesion}
              onClick={cerrarSesion}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors focus:bg-red-50 focus:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                <LogOut className="h-4 w-4" />
              </div>

              <span>{cerrandoSesion ? "Cerrando..." : "Cerrar sesión"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}