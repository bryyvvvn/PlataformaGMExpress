/** Clerk authentication configuration for GM Express */

export const CLERK_CONFIG = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_dGFsZW50ZWQtbGFiLTc4LmNsZXJrLmFjY291bnRzLmRldiQ',
  localization: {
    signIn: {
      start: {
        title: 'Iniciar Sesión',
        subtitle: ' ',
        actionText: '¿No tienes cuenta?',
        actionLink: 'Regístrate aquí',
      },
    },
    signUp: {
      start: {
        title: 'Crear cuenta',
        subtitle: 'Regístrate para continuar a GM Express',
        actionText: '¿Ya tienes cuenta?',
        actionLink: 'Inicia sesión',
      },
    },
    formButtonPrimary: 'Entrar',
  },
  appearance: {
    variables: {
      colorPrimary: '#75aa46',
      colorText: '#1b2c56',
      fontSize: '1.1rem',
    },
    elements: {
      card: 'shadow-2xl border-none',
      headerTitle: 'text-2xl font-extrabold text-[#1b2c56]',
      headerSubtitle: 'hidden',
      formButtonPrimary: 'bg-[#75aa46] hover:bg-[#5d8a38] text-white py-3 text-lg transition-all uppercase font-black',
      footer: 'flex flex-col items-center',
      footerAction: 'mt-4',
      footerActionText: 'text-[#1b2c56]',
      footerActionLink: 'text-[#75aa46] font-bold hover:text-[#5d8a38]',
      internal_logoBox: 'hidden',
      logoBox: 'hidden',
      userButtonPopoverFooter: { display: 'none' },
      userButtonPopoverCard: 'border-2 border-gray-100 shadow-2xl',
    },
  },
} as const;
