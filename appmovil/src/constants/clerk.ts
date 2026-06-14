import { esES } from '@clerk/localizations';

const BRAND_BLUE = '#1B2C56';
const BRAND_GREEN = '#75AA46';
const TEXT_PRIMARY = '#0F172A';
const TEXT_SECONDARY = '#64748B';
const BORDER = '#E2E8F0';
const SURFACE = '#F8FAFC';

export const CLERK_CONFIG = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  localization: {
    ...esES,
    signIn: {
      ...esES.signIn,
      start: {
        ...esES.signIn?.start,
        title: 'Iniciar sesión',
        subtitle: 'Ingresa con tu cuenta para continuar',
        actionText: '¿No tienes cuenta?',
        actionLink: 'Regístrate',
      },
    },
    signUp: {
      ...esES.signUp,
      start: {
        ...esES.signUp?.start,
        title: 'Crear cuenta',
        subtitle: 'Completa tus datos para comenzar',
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
      colorPrimary: BRAND_GREEN,
      colorText: TEXT_PRIMARY,
      colorTextSecondary: TEXT_SECONDARY,
      colorBackground: '#FFFFFF',
      colorInputBackground: SURFACE,
      colorInputText: TEXT_PRIMARY,
      colorTextOnPrimaryBackground: '#FFFFFF',
      borderRadius: '0.875rem',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    elements: {
      rootBox: {
        width: '100%',
      },
      cardBox: {
        width: '100%',
        boxShadow: 'none',
        border: '0',
        borderRadius: '0',
        backgroundColor: 'transparent',
      },
      card: {
        width: '100%',
        boxShadow: 'none',
        border: '0',
        borderRadius: '0',
        padding: '0',
        backgroundColor: 'transparent',
      },
      header: {
        display: 'none',
      },
      headerTitle: {
        display: 'none',
      },
      headerSubtitle: {
        display: 'none',
      },
      main: {
        width: '100%',
      },
      formField: {
        marginBottom: '0.9rem',
      },
      formFieldLabel: {
        marginBottom: '0.45rem',
        color: TEXT_PRIMARY,
        fontSize: '0.875rem',
        fontWeight: '700',
      },
      formFieldInput: {
        minHeight: '3.15rem',
        padding: '0.9rem 1rem',
        borderRadius: '0.9rem',
        border: `1px solid ${BORDER}`,
        backgroundColor: SURFACE,
        color: TEXT_PRIMARY,
        fontSize: '1rem',
        boxShadow: 'none',
        outline: 'none',
        '&:focus': {
          borderColor: BRAND_GREEN,
          boxShadow: '0 0 0 3px rgba(117, 170, 70, 0.18)',
        },
      },
      formFieldAction: {
        color: BRAND_GREEN,
        fontSize: '0.875rem',
        fontWeight: '700',
        textDecoration: 'none',
        '&:hover': {
          color: '#5F8E38',
          textDecoration: 'underline',
        },
      },
      formButtonPrimary: {
        width: '100%',
        minHeight: '3.2rem',
        marginTop: '0.35rem',
        borderRadius: '0.95rem',
        backgroundColor: BRAND_GREEN,
        color: '#FFFFFF',
        fontSize: '1rem',
        fontWeight: '800',
        boxShadow: '0 16px 30px -18px rgba(117, 170, 70, 0.9)',
        transition: 'background-color 160ms ease, transform 160ms ease',
        '&:hover, &:focus': {
          backgroundColor: '#66983D',
        },
        '&:active': {
          transform: 'translateY(1px)',
        },
      },
      footer: {
        backgroundColor: 'transparent',
      },
      footerActionText: {
        color: TEXT_SECONDARY,
        fontSize: '0.875rem',
      },
      footerActionLink: {
        color: BRAND_GREEN,
        fontSize: '0.875rem',
        fontWeight: '800',
        textDecoration: 'none',
        '&:hover': {
          color: '#5F8E38',
          textDecoration: 'underline',
        },
      },
      dividerLine: {
        backgroundColor: BORDER,
      },
      dividerText: {
        color: TEXT_SECONDARY,
        fontSize: '0.8rem',
        fontWeight: '700',
      },
      alternativeMethodsBlockButton: {
        minHeight: '3rem',
        borderRadius: '0.9rem',
        border: `1px solid ${BORDER}`,
        backgroundColor: '#FFFFFF',
        color: BRAND_BLUE,
        boxShadow: 'none',
        '&:hover, &:focus': {
          borderColor: BRAND_GREEN,
          backgroundColor: '#F4FAF0',
        },
      },
      alternativeMethodsBlockButtonText: {
        color: BRAND_BLUE,
        fontSize: '0.95rem',
        fontWeight: '800',
      },
      identityPreview: {
        border: `1px solid ${BORDER}`,
        borderRadius: '0.95rem',
        backgroundColor: SURFACE,
        padding: '0.85rem',
      },
      identityPreviewText: {
        color: TEXT_PRIMARY,
        fontSize: '0.95rem',
        fontWeight: '800',
      },
      identityPreviewEditButton: {
        color: BRAND_GREEN,
      },
      formButtonReset: {
        color: BRAND_GREEN,
        fontSize: '0.9rem',
        fontWeight: '800',
      },
      backLink: {
        color: BRAND_GREEN,
        fontSize: '0.9rem',
        fontWeight: '800',
      },
      badge: {
        display: 'none',
      },
    },
  },
};
