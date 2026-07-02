import React, { useState } from 'react';
import { SignUp, useSignIn } from '@clerk/clerk-react';
import { APP_NAME } from '../../constants/theme';

const LOGO_SRC = '/GM Express Logo.png';

function prepararIdentificadorLogin(valor: string) {
  const limpio = valor.trim();

  if (limpio.includes('@')) {
    return limpio.toLowerCase();
  }

  const rutLimpio = limpio.replace(/[.\-\s]/g, '').toLowerCase();

  if (/^\d{7,8}[0-9k]$/.test(rutLimpio)) {
    return `rut${rutLimpio}`;
  }

  return limpio;
}

function obtenerMensajeErrorClerk(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray(error.errors) &&
    error.errors.length > 0
  ) {
    const primerError = error.errors[0];

    if (
      typeof primerError === 'object' &&
      primerError !== null &&
      'message' in primerError &&
      typeof primerError.message === 'string'
    ) {
      return primerError.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'No se pudo iniciar sesion. Revisa tus datos e intenta nuevamente.';
}

function LoginConRut() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarSesion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || enviando) return;

    const identificadorPreparado = prepararIdentificadorLogin(identificador);

    if (!identificadorPreparado || password.length === 0) {
      setError('Ingresa tu RUT o correo y contrasena.');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const resultado = await signIn.create({
        identifier: identificadorPreparado,
        password,
      });

      if (resultado.status === 'complete') {
        await setActive({ session: resultado.createdSessionId });
        return;
      }

      setError('No se pudo completar el inicio de sesion.');
    } catch (err) {
      setError(obtenerMensajeErrorClerk(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={iniciarSesion}>
      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#0F172A]" htmlFor="login-identificador">
          RUT o correo
        </label>
        <input
          id="login-identificador"
          value={identificador}
          disabled={!isLoaded || enviando}
          onChange={(event) => {
            setIdentificador(event.target.value);
            setError(null);
          }}
          placeholder="21.177.361-8"
          autoComplete="username"
          className="min-h-[3.15rem] w-full rounded-[0.9rem] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-base font-semibold text-[#0F172A] outline-none transition focus:border-[#75AA46] focus:ring-4 focus:ring-[#75AA46]/15 disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#0F172A]" htmlFor="login-password">
          Contrasena
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          disabled={!isLoaded || enviando}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          autoComplete="current-password"
          className="min-h-[3.15rem] w-full rounded-[0.9rem] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-base font-semibold text-[#0F172A] outline-none transition focus:border-[#75AA46] focus:ring-4 focus:ring-[#75AA46]/15 disabled:opacity-60"
        />
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!isLoaded || enviando}
        className="min-h-[3.2rem] w-full rounded-[0.95rem] bg-[#75AA46] px-4 py-3 text-base font-extrabold text-white shadow-[0_16px_30px_-18px_rgba(117,170,70,0.9)] transition hover:bg-[#66983D] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Ingresando...' : 'Continuar'}
      </button>
    </form>
  );
}

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const cardTitle = isSignUp ? 'Crear cuenta' : 'Iniciar sesión';
  const cardSubtitle = isSignUp
    ? 'Completa tus datos para comenzar'
    : 'Ingresa con tu cuenta para continuar';

  const handleNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || anchor.href;

    if (href.includes('sign-up')) {
      e.preventDefault();
      e.stopPropagation();
      setIsSignUp(true);
    } else if (href.includes('sign-in')) {
      e.preventDefault();
      e.stopPropagation();
      setIsSignUp(false);
    }
  };

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#F8FAFC] text-[#0F172A]">
      <div className="relative flex min-h-[100dvh] flex-col">
        <header className="relative flex h-[34dvh] min-h-[230px] max-h-[340px] flex-col items-center justify-center overflow-hidden px-6 pb-14 pt-[env(safe-area-inset-top)] text-center text-white">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#1B2C56_0%,#1B2C56_58%,#75AA46_140%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(248,250,252,0)_0%,rgba(248,250,252,0.16)_100%)]" />

          <div className="relative z-10 flex flex-col items-center">
            <img
              src={LOGO_SRC}
              alt={`${APP_NAME} logo`}
              className="h-[360px] w-auto max-w-[400px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.35)]"
            />
          </div>
        </header>

        <section className="relative z-10 -mt-16 px-4 pb-1 sm:pb-4">
          <div
            className="mx-auto w-full max-w-[430px] rounded-[32px] border border-[#E2E8F0] bg-white px-5 py-5 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.42)] sm:px-6 sm:py-6"
            onClickCapture={handleNavigation}
          >
            <div className="mb-4 text-center sm:mb-5">
              <h2 className="text-[1.55rem] font-extrabold leading-tight text-[#0F172A] sm:text-[1.65rem]">
                {cardTitle}
              </h2>

              <p className="mt-2 text-sm font-medium leading-5 text-[#64748B]">
                {cardSubtitle}
              </p>
            </div>

            <div>
              {isSignUp ? (
                <SignUp routing="hash" signInUrl="#/sign-in" />
              ) : (
                <LoginConRut />
              )}
            </div>

            <div className="mt-4 text-center text-sm font-semibold text-[#64748B]">
              {isSignUp ? (
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-extrabold text-[#75AA46] hover:text-[#5F8E38] hover:underline"
                >
                  Ya tengo cuenta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-extrabold text-[#75AA46] hover:text-[#5F8E38] hover:underline"
                >
                  Crear cuenta
                </button>
              )}
            </div>

            <p className="mt-4 border-t border-[#E2E8F0] pt-3 text-center text-xs font-semibold leading-5 text-[#64748B] sm:mt-5 sm:pt-4">
              Acceso para trabajadores y representantes
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
