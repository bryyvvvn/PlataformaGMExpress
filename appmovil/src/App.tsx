import React from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import Login from './pages/Login'; // <-- IMPORTAMOS EL LOGIN LIMPIO
import { THEME, APP_NAME } from './constants/theme';

/**
 * Root application component.
 * Handles authentication via Clerk SSO.
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: THEME.colors.background }}>

      {/* Authenticated with Clerk SSO */}
      <SignedIn>
        <LayoutWrapper>
          <HomePage />
        </LayoutWrapper>
      </SignedIn>

      {/* Unauthenticated - show the isolated Login Component */}
      <SignedOut>
        <Login />
      </SignedOut>

    </div>
  );
};

/**
 * Layout wrapper component that provides consistent header
 * for authenticated users.
 */
interface LayoutProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutProps> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <header
      className="flex justify-between items-center p-4 text-white shadow-md border-b-4"
      style={{
        backgroundColor: THEME.colors.secondary,
        borderColor: THEME.colors.primary,
      }}
    >
      <h1 className="font-black tracking-tighter italic uppercase">{APP_NAME}</h1>
      {/* Este es el botón para cerrar sesión y volver al Login */}
      <UserButton afterSignOutUrl="/" />
    </header>

    <main className="flex-1 overflow-y-auto">{children}</main>
  </div>
);

export default App;