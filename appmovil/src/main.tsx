import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { CLERK_CONFIG } from './constants/clerk';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const ClerkConfigError = () => {
  const message = import.meta.env.DEV
    ? 'Falta configurar VITE_CLERK_PUBLISHABLE_KEY.'
    : 'No se pudo cargar la configuración de autenticación.';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1.5rem',
        background: '#F8FAFC',
        color: '#0F172A',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        role="alert"
        style={{
          width: 'min(100%, 28rem)',
          border: '1px solid #E2E8F0',
          borderRadius: '0.5rem',
          background: '#FFFFFF',
          padding: '1.25rem',
        }}
      >
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>
          Configuración incompleta
        </h1>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{message}</p>
      </section>
    </main>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found in HTML document.');
}

const root = ReactDOM.createRoot(rootElement);

if (!clerkPublishableKey) {
  root.render(
    <React.StrictMode>
      <ClerkConfigError />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        appearance={CLERK_CONFIG.appearance}
        localization={CLERK_CONFIG.localization}
      >
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}
