import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import { THEME } from './constants/theme';

const App: React.FC = () => {
  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: THEME.colors.background }}>
      <SignedIn>
        <HomePage />
      </SignedIn>

      <SignedOut>
        <Login />
      </SignedOut>
    </div>
  );
};

export default App;