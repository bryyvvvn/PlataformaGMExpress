// web/app/auth/login/page.tsx
"use client"
import { SignIn } from '@clerk/nextjs'
// Ajusta la ruta de importación si tu carpeta lib está en otro nivel
import { clerkAppearance } from '@/lib/clerk' 

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-secondary">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary">GM Express</h2>
          <p className="mt-2 text-sm text-gray-600">Acceso Administrativo</p>
        </div>
        
        <div className="space-y-4">
          <SignIn routing="hash" appearance={clerkAppearance} />
        </div>

      </div>
    </div>
  )
}