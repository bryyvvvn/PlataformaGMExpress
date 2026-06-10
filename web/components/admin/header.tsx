"use client"

import { useState } from "react"
import { useClerk } from "@clerk/nextjs"
import { Bell, Search, LogOut, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { signOut } = useClerk()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  const cerrarSesion = async () => {
    if (cerrandoSesion) return

    setCerrandoSesion(true)

    try {
      await signOut({ redirectUrl: "/auth/login" })
    } catch (error) {
      console.error("[Header] Error cerrando sesion:", error)
      setCerrandoSesion(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-[#1B2C56]">{title}</h1>
        {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="h-8 w-64 rounded-md border-slate-200 bg-slate-50 pl-9 text-sm"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted cursor-pointer transition-colors outline-none border-none">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex text-left">
              <span className="text-sm font-semibold text-foreground leading-none">
                Administraci&oacute;n
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" /> Configuraci&oacute;n
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={cerrandoSesion}
              onClick={cerrarSesion}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {cerrandoSesion ? "Cerrando..." : "Cerrar Sesi\u00f3n"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
