import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-up(.*)',
  '/auth/login(.*)',
  '/auth(.*)',
  '/api/webhooks(.*)',
  '/api/(menu-semanal|trabajador/menu-semanal)(.*)',
  '/api/usuarios(.*)',
  '/api/representante(.*)',
  '/api/cron/recordatorio', 
  '/api/cron/auto-asignar',
  '/api/cron/auto-confirmar', 
  '/api/representante/bloqueos',
])

export default clerkMiddleware(async (auth, request) => {
  // 🔥 ESTO ES LO QUE ARREGLA LA APP MÓVIL: Deja pasar el OPTIONS sin chistar
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }

  if (request.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isPublicRoute(request)) return

  const authObj = await auth()

  if (!authObj.userId) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}