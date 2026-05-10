"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const router = useRouter()

  const handleLogin = () => {
    // Lógica temporal para Maickol y Valeria
    if ((user === "maickol" || user === "valeria") && pass === "gm2026") {
      router.push("/dashboard")
    } else {
      alert("Credenciales incorrectas")
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-secondary">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary">GM Express</h2>
          <p className="mt-2 text-sm text-gray-600">Acceso Administrativo</p>
        </div>
        <div className="space-y-4">
          <Input placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} />
          <Input type="password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} />
          <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleLogin}>
            Entrar
          </Button>
        </div>
      </div>
    </div>
  )
}