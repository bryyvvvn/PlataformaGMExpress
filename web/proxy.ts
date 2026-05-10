import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Definimos qué rutas NO van a usar la autenticación de Clerk en la web
const isPublicRoute = createRouteMatcher([
  '/', 
  '/login(.*)',       // Nuestro login propio de Admin
  '/dashboard(.*)',   // Nuestro panel propio de Admin
  '/api/webhooks(.*)', // Importante para tu webhook de Clerk de la app móvi
  '/api/admin(.*)',
  '/api/pedidos(.*)',
  '/api/menu-semanal(.*)'
])

export default clerkMiddleware(async (auth, request) => {
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