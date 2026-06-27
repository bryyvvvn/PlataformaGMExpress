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
])

export default clerkMiddleware(async (auth, request) => {
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

  // La validacion de rol ADMIN vive en app/(admin)/layout.tsx.
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
