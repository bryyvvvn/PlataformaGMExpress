export const CLERK_CONFIG = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  localization: {
    signIn: {
      start: {
        title: 'Iniciar Sesión',
        subtitle: 'Bienvenido de vuelta a GM Express',
        actionText: '¿No tienes cuenta?',
        actionLink: 'Regístrate',
      },
    },
    signUp: {
      start: {
        title: 'Crear cuenta',
        subtitle: 'Completa tus datos para comenzar.',
        actionText: '¿Ya tienes cuenta?',
        actionLink: 'Inicia sesión',
      },
    },
    formButtonPrimary: 'Continuar',
  },
  appearance: {
    variables: {
      colorPrimary: '#75aa46',
      colorText: '#1b2c56',
      borderRadius: '1.5rem',
      // Un tamaño base equilibrado (el defecto de Clerk es 1rem, antes probamos 1.15)
      fontSize: '1.05rem', 
    },
    elements: {
      card: 'shadow-2xl border border-gray-100 rounded-[1.5rem] overflow-hidden',
      // Un título grande pero no invasivo
      headerTitle: 'text-[1.7rem] font-extrabold text-[#1b2c56]',
      headerSubtitle: 'text-sm text-gray-500 mt-1',
      // Padding intermedio (py-[14px]) y letra un poco más destacada
      formButtonPrimary: 'font-black text-[1.05rem] text-white py-[14px] transition-all hover:bg-[#5d8a38]',
      formFieldInput: 'rounded-xl border border-gray-200 shadow-sm',
      // Textos del pie de página en su tamaño normal
      footerActionText: 'text-sm',
      footerActionLink: 'text-[#75aa46] font-bold text-sm hover:text-[#5d8a38]',
      // Se mantiene oculta la pastilla
      badge: 'hidden',
    },
  },
} as const;