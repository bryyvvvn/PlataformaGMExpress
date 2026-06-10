import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GM Express',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  description: 'Plataforma de Administración GM Express',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Forzamos las rutas directamente en el componente
    <ClerkProvider 
      signInUrl="/auth/login" 
      signUpUrl="/auth/login" 
      signInFallbackRedirectUrl="/dashboard" // O a donde quieras que vaya al entrar
    >
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
