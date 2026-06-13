"use client";

import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk";

const OPERACION_BADGES = ["Panel administrativo", "GM Express", "Producción y pedidos"];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[480px]">
            <div className="mb-8 flex items-center gap-4">
              <Image
                src="/logo-gm-verde-azul.png"
                alt="GM Express"
                width={96}
                height={96}
                priority
                className="h-26 w-26 object-contain"
              />

              <div>
                <p className="text-2xl font-bold tracking-tight text-[#1B2C56]">
                  GM Express
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#75AA46]">
                  Panel administrativo
                </p>
              </div>
            </div>

            <div className="mb-7">

              <h1 className="text-3xl font-bold tracking-tight text-[#1B2C56] sm:text-4xl">
                Bienvenido Administrador
              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                Ingresa con tus credenciales para continuar gestionando la operación 
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70 sm:p-4">
              <SignIn routing="hash" appearance={clerkAppearance} />
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500 text-center">
              Plataforma privada para administración, carga de minutas, pedidos y facturación.
            </p>
          </div>
        </section>

        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          <Image
            src="/login-gm-express.png"
            alt="Instalaciones GM Express"
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-[#1B2C56]/95 via-[#1B2C56]/75 to-[#75AA46]/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_28%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white xl:p-16">
            <div className="flex flex-wrap gap-2">
              {OPERACION_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="max-w-xl pb-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#d8efc8]">
                Operación centralizada
              </p>

              <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Gestión operativa para alimentación corporativa
              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/80">
                Administra empresas, convenios, minutas y pedidos desde una plataforma
                centralizada.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}