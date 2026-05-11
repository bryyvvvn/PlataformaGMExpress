import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

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
  description: 'Plataforma de Administración GM Express',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ClerkProvider envuelve la app para que la API siga validando la App Móvil, 
            pero no renderizamos ningún botón de Clerk en la pantalla */}
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}