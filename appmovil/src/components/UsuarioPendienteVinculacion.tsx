import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SignOutButton } from '@clerk/clerk-react';
import { APP_NAME, THEME } from '../constants/theme';
import type { UsuarioPerfil } from '../hooks/usePerfil';

interface UsuarioPendienteVinculacionProps {
  usuario: UsuarioPerfil | null;
  cargando?: boolean;
  onRefresh: () => void | Promise<void>;
}

const LOGO_SRC = 'logo-gm-verde-azul.png';

export const UsuarioPendienteVinculacion: React.FC<UsuarioPendienteVinculacionProps> = ({
  usuario,
  cargando = false,
  onRefresh,
}) => {
  const nombre = usuario?.nombre?.trim();

  return (
    <main
      className="min-h-[100dvh] flex items-center justify-center px-6 py-10 text-[#1d2d50]"
      style={{ backgroundColor: THEME.colors.background }}
    >
      <section className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl border border-gray-100">
        <div className="mx-auto mb-10 flex h-26 w-48 items-center justify-center overflow-hidden">
          <img
            src={LOGO_SRC}
            alt={`${APP_NAME} logo`}
            className="h-auto w-42 scale-[1.35] object-contain"
          />
        </div>

        {nombre && (
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">
            Hola, {nombre}
          </p>
        )}

        <h1 className="text-2xl font-black leading-tight">
          Aún no estás vinculado a una empresa
        </h1>

        <p className="mt-4 text-sm font-medium leading-6 text-gray-500">
          Tu cuenta fue creada correctamente, pero todavía no tienes una empresa
          ni un rol asociado dentro de GM Express. Comunícate con tu representante
          o administrador para que te vinculen a tu empresa y rol correspondiente.
        </p>

        <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-bold leading-5 text-gray-500">
          Cuando tu cuenta sea vinculada, podrás acceder automáticamente a las
          funcionalidades disponibles para tu rol.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={cargando}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#70a344] text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all active:scale-95 disabled:bg-gray-300"
          >
            <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
            Actualizar estado
          </button>

          <SignOutButton>
            <button
              type="button"
              className="h-12 w-full rounded-2xl bg-red-50 text-sm font-black uppercase tracking-wide text-red-500 transition-all active:scale-95"
            >
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </section>
    </main>
  );
};
