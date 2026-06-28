"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SignIn, useClerk, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { clerkAppearance } from "@/lib/clerk";

const OPERACION_BADGES = ["Panel administrativo", "GM Express", "Producción y pedidos"];
const NO_ADMIN_MESSAGE =
  "Esta cuenta no tiene credenciales de administrador. No puedes acceder al sistema.";

type AdminCheckResponse = {
  ok: boolean;
  motivo?: "NO_ADMIN";
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginScreen showNoAdminError={false} isValidating={false} />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isValidatingAdmin, setIsValidatingAdmin] = useState(false);

  const hasNoAdminQuery = searchParams.get("error") === "no-admin";
  const showNoAdminError = hasNoAdminQuery || localError === NO_ADMIN_MESSAGE;

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelado = false;

    async function validarAdmin() {
      setIsValidatingAdmin(true);

      try {
        const response = await fetch("/api/auth/admin-check", { cache: "no-store" });
        const data = (await response.json()) as AdminCheckResponse;

        if (cancelado) return;

        if (response.ok && data.ok) {
          router.replace("/dashboard");
          return;
        }

        setLocalError(NO_ADMIN_MESSAGE);
        await signOut();

        if (!cancelado) {
          router.replace("/auth/login?error=no-admin");
        }
      } catch {
        if (!cancelado) {
          setLocalError(NO_ADMIN_MESSAGE);
          await signOut();
          router.replace("/auth/login?error=no-admin");
        }
      } finally {
        if (!cancelado) {
          setIsValidatingAdmin(false);
        }
      }
    }

    void validarAdmin();

    return () => {
      cancelado = true;
    };
  }, [isLoaded, isSignedIn, router, signOut]);

  const shouldShowSignIn = useMemo(
    () => isLoaded && !isSignedIn && !isValidatingAdmin,
    [isLoaded, isSignedIn, isValidatingAdmin]
  );

  return (
    <LoginScreen
      showNoAdminError={showNoAdminError}
      isValidating={isValidatingAdmin || (isLoaded && Boolean(isSignedIn))}
      showSignIn={shouldShowSignIn}
    />
  );
}

function LoginScreen({
  showNoAdminError,
  isValidating,
  showSignIn = true,
}: {
  showNoAdminError: boolean;
  isValidating: boolean;
  showSignIn?: boolean;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[550px]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
              <header className="relative overflow-hidden bg-[#1B2C56] px-6 py-5 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(117,170,70,0.38),transparent_30%)]" />

                <div className="relative z-10 flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white p-2 shadow-md">
                    <Image
                      src="/logo-gm-verde-azul.png"
                      alt="GM Express"
                      width={160}
                      height={160}
                      priority
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-2xl font-bold tracking-tight text-white">
                      GM Express
                    </p>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#BFE6A4]">
                      Panel administrativo
                    </p>
                  </div>
                </div>
              </header>

              <div className="px-6 py-7 sm:px-8">
                <div className="mb-7 text-center">
                  <h1 className="text-3xl font-bold tracking-tight text-[#1B2C56] sm:text-4xl">
                    Bienvenido Administrador
                  </h1>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                    Ingresa con tus credenciales para continuar gestionando la operación.
                  </p>
                </div>

                {/* 🔥 Aquí se eliminó el borde y la sombra. Ahora solo centra el contenido */}
                <div className="flex w-full flex-col items-center justify-center">
                  {showNoAdminError && (
                    <div className="mb-4 w-full max-w-[400px] rounded-md border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold leading-5 text-red-700">
                      {NO_ADMIN_MESSAGE}
                    </div>
                  )}

                  {isValidating ? (
                    <div className="w-full max-w-[400px] rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-[#1B2C56]">
                      Validando credenciales...
                    </div>
                  ) : showSignIn ? (
                    <SignIn routing="hash" appearance={clerkAppearance} />
                  ) : null}
                </div>

                <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-slate-500">
                  Plataforma privada para administración, carga de minutas, pedidos y facturación.
                </p>
              </div>
            </div>
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