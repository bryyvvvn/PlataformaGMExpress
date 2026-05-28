import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Definimos qué rutas NO van a usar la autenticación de Clerk en la web
const isPublicRoute = createRouteMatcher([
  '/', 
  '/login(.*)',        // Nuestro login propio de Admin
  '/auth(.*)',         // Rutas de autenticación (p.ej. /auth/login) — no deben forzar Clerk
  '/dashboard(.*)',    // Nuestro panel propio de Admin
  '/api/webhooks(.*)', // Importante para tu webhook de Clerk de la app móvil
  '/api/admin(.*)',
  '/api/(pedidos|trabajador/pedidos)(.*)',
  '/api/(menu-semanal|trabajador/menu-semanal)(.*)',
  '/api/usuarios(.*)',
  '/api/representante(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Si la ruta es /dashboard, verificar nuestra sesión propia
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const adminSession = request.cookies.get('admin_session')
    
    if (!adminSession) {
      // Redirigir al login si no hay sesión
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    return NextResponse.next()
  }

  // Para otras rutas, usar el middleware de Clerk
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}