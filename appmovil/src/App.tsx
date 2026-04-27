import React, { useState } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import { THEME, APP_NAME } from './constants/theme';

/**
 * Root application component.
 * Handles authentication flows: Clerk SSO and demo mode for testing.
 */
const App: React.FC = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: THEME.colors.background }}>
      {/* Authenticated with Clerk SSO */}
      <SignedIn>
        <LayoutWrapper>
          <HomePage />
        </LayoutWrapper>
      </SignedIn>

      {/* Unauthenticated - show login or demo mode */}
      <SignedOut>
        {!isDemoMode ? (
          <Login onDemoLogin={() => setIsDemoMode(true)} />
        ) : (
          <LayoutWrapper isDemoMode onLogout={() => setIsDemoMode(false)}>
            <HomePage />
          </LayoutWrapper>
        )}
      </SignedOut>
    </div>
  );
};

/**
 * Layout wrapper component that provides consistent header and footer
 * for both authenticated and demo users.
 *
 * @param children - Page content to render
 * @param isDemoMode - Whether running in demo mode (shows manual logout)
 * @param onLogout - Callback when user logs out
 */
interface LayoutProps {
  children: React.ReactNode;
  isDemoMode?: boolean;
  onLogout?: () => void;
}

const LayoutWrapper: React.FC<LayoutProps> = ({ children, isDemoMode = false, onLogout }) => (
  <div className="flex flex-col min-h-screen">
    <header
      className="flex justify-between items-center p-4 text-white shadow-md border-b-4"
      style={{
        backgroundColor: THEME.colors.secondary,
        borderColor: THEME.colors.primary,
      }}
    >
      <h1 className="font-black tracking-tighter italic uppercase">{APP_NAME}</h1>

      {isDemoMode && onLogout ? (
        <button
          onClick={onLogout}
          className="text-[10px] px-3 py-1 rounded-full border transition-colors uppercase font-bold"
          style={{
            backgroundColor: `${THEME.colors.error}20`,
            borderColor: `${THEME.colors.error}50`,
            color: THEME.colors.error,
          }}
        >
          Cerrar Demo
        </button>
      ) : (
        <UserButton afterSignOutUrl="/" />
      )}
    </header>

    <main className="flex-1 overflow-y-auto">{children}</main>
  </div>
);

export default App;