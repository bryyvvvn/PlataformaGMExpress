import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { esES } from '@clerk/localizations';

const PUBLISHABLE_KEY = "pk_test_dGFsZW50ZWQtbGFiLTc4LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      localization={{
        ...esES,
        signIn: {
          start: {
            title: "Iniciar Sesión",
            subtitle: " ",
            actionText: "¿No tienes cuenta?",
            actionLink: "Regístrate aquí",
          },
        },
        signUp: {
          start: {
            title: "Crear cuenta",
            subtitle: "Regístrate para continuar a GM Express",
            actionText: "¿Ya tienes cuenta?",
            actionLink: "Inicia sesión",
          },
        },
        formButtonPrimary: "Entrar",
      }}
      appearance={{
        variables: {
          colorPrimary: "#75aa46",
          colorText: "#1b2c56",
          fontSize: "1.1rem",
        },
        elements: {
          card: "shadow-2xl border-none",
          headerTitle: "text-2xl font-extrabold text-[#1b2c56]",
          headerSubtitle: "hidden",
          formButtonPrimary: "bg-[#75aa46] hover:bg-[#5d8a38] text-white py-3 text-lg transition-all uppercase font-black",
          footer: "flex flex-col items-center", 
          footerAction: "mt-4",
          footerActionText: "text-[#1b2c56]",
          footerActionLink: "text-[#75aa46] font-bold hover:text-[#5d8a38]",
          internal_logoBox: "hidden", 
          logoBox: "hidden",
          userButtonPopoverFooter: { display: "none" },
          userButtonPopoverCard: "border-2 border-gray-100 shadow-2xl",
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);