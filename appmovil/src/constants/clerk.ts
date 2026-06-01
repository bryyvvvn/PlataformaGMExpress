import { esES } from '@clerk/localizations';

export const CLERK_CONFIG = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  localization: {
    ...esES,
    signIn: {
      ...esES.signIn,
      start: {
        ...esES.signIn?.start,
        title: 'Bienvenido a GM Express',
        subtitle: '',
        actionText: '¿No tienes cuenta?',
        actionLink: 'Regístrese',
      },
    },
    signUp: {
      ...esES.signUp,
      start: {
        ...esES.signUp?.start,
        title: 'Crear cuenta',
        subtitle: 'Completa tus datos para comenzar.',
        actionText: '¿Ya tienes cuenta?',
        actionLink: 'Inicia sesión',
      },
    },
    formButtonPrimary: 'Continuar',
  },
  appearance: {
    layout: {
      socialButtonsPlacement: 'bottom' as const,
      logoPlacement: 'none' as const,
    },
    variables: {
      colorPrimary: '#70a344',
      colorText: '#1d2d50',
      colorTextOnPrimaryBackground: '#ffffff', 
      borderRadius: '0.75rem',
    },
    elements: {
      cardBox: {
        boxShadow: 'none',
        borderRadius: '2rem',
      },
      card: {
        borderRadius: '2rem',
        padding: '2rem',
      },
      headerSubtitle: {
        display: 'none',
      },
      headerTitle: {
        fontSize: '1.75rem',
        fontWeight: '900',
        color: '#1d2d50',
        marginBottom: '0', 
      },
      formFieldLabel: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#1d2d50',
      },
      formFieldInput: {
        padding: '1.25rem',
        fontSize: '1.15rem',
        borderRadius: '0.75rem',
        borderWidth: '2px',
        borderColor: '#f3f4f6',
        backgroundColor: '#f9fafb',
      },
      
      // 🔥 Mucho más limpio. La fuente rebelde la controla tu index.css
      formButtonPrimary: {
        padding: '1.15rem !important',
        borderRadius: '0.75rem !important',
        marginTop: '0.5rem',
        fontSize: '1.15rem', 
        fontWeight: '900',
      },
      
      identityPreview: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem', 
        marginBottom: '0.75rem', 
      },
      identityPreviewText: {
        fontSize: '1.25rem', 
        fontWeight: '900',
        color: '#1d2d50',
      },
      identityPreviewEditButton: {
        color: '#70a344',
        '& > svg': {
          width: '1.5rem',
          height: '1.5rem',
        }
      },

      formFieldAction: {
        fontSize: '0.95rem',
        fontWeight: '700',
        color: '#70a344',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        }
      },

      footerActionText: {
        fontSize: '0.95rem',
        color: '#6b7280',
      },
      footerActionLink: {
        fontSize: '0.95rem',
        fontWeight: '900',
        color: '#70a344',
      },

      alternativeMethodsBlockButton: {
        padding: '1.15rem !important',
        borderRadius: '0.75rem !important',
        border: 'none',
        backgroundColor: '#70a344',
        color: '#ffffff',
        '&:hover, &:focus': {
          backgroundColor: '#5a8535',
        },
        '& svg, & svg path': {
          fill: '#ffffff !important',
          color: '#ffffff !important',
          stroke: '#ffffff !important',
        }
      },
      alternativeMethodsBlockButtonText: {
        fontSize: '1.15rem !important',
        fontWeight: '900 !important',
        color: '#ffffff !important',
      },

      dividerText: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#6b7280',
      },

      formButtonReset: {
        fontSize: '1.15rem !important',
        fontWeight: '900 !important',
        color: '#ffffff !important',
        backgroundColor: '#70a344 !important',
        width: '100%',
        padding: '1.15rem !important',
        borderRadius: '0.75rem !important',
        marginTop: '0.5rem',
        textAlign: 'center',
      },
      backLink: {
        fontSize: '1.25rem !important',
        fontWeight: '900 !important',
        color: '#70a344 !important',
        padding: '0.5rem',
        marginTop: '0.5rem',
      },

      badge: {
        display: 'none',
      },
    },
  },
};