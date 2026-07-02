import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { APP_NAME } from '../../constants/theme';

const LOGO_SRC = '/GM Express Logo.png';

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
                <SignIn routing="hash" signUpUrl="#/sign-up" />
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