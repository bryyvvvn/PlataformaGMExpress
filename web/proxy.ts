import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Definimos qué rutas NO van a usar la autenticación de Clerk en la web
const isPublicRoute = createRouteMatcher([
  // ¡ELIMINAMOS /sign-in DE AQUÍ!
  '/sign-up(.*)',
  '/auth/login(.*)',
  '/auth(.*)',
  
  '/api/webhooks(.*)', 
  '/api/admin(.*)',
  '/api/(pedidos|trabajador/pedidos)(.*)',
  '/api/(menu-semanal|trabajador/menu-semanal)(.*)',
  '/api/usuarios(.*)',
  '/api/representante(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // 1. EL MARTILLAZO: Si Clerk intenta ir a /sign-in, lo forzamos a tu ruta
  if (request.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 2. Redirección de la raíz al login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 3. Para rutas públicas no protegemos
  if (isPublicRoute(request)) return;

  // 4. Obtener sesión sin redirigir automáticamente
  const authObj = await auth();

  // 5. Si no hay sesión, al login correcto
  if (!authObj.userId) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 6. Verificación de Rol ADMIN
  if (!request.nextUrl.pathname.startsWith('/api')) {
    try {
      const db = (await import('./lib/db')).default;
      const usuario = await db.usuario.findUnique({ 
        where: { id: authObj.userId }, 
        select: { rol: true } 
      });
      
      if (!usuario || usuario.rol !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } catch (e) {
      console.error('[proxy] Error verificando rol ADMIN:', e);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}