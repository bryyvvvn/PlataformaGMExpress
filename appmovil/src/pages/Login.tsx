import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { THEME, APP_NAME } from '../constants/theme';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || anchor.href;
    
    if (href.includes('sign-up')) {
      e.preventDefault();
      e.stopPropagation();
      setIsSignUp(true);
    } else if (href.includes('sign-in')) {
      e.preventDefault();
      e.stopPropagation();
      setIsSignUp(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ backgroundColor: THEME.colors.secondary }}
    >
      {/* Un margen intermedio (mb-5) y un tamaño ligeramente mayor al original (230px) */}
      <div className="mb-5 w-full max-w-[230px]">
        <img 
          src="/GM Express Logo.png" 
          alt={`${APP_NAME} Logo`} 
          className="w-full h-auto object-contain drop-shadow-xl" 
        />
      </div>

      <div className="w-full flex justify-center" onClickCapture={handleNavigation}>
        {isSignUp ? (
          <SignUp routing="hash" signInUrl="#/sign-in" />
        ) : (
          <SignIn routing="hash" signUpUrl="#/sign-up" />
        )}
      </div>

      <footer 
        className="mt-12 text-[10px] uppercase tracking-widest text-center w-full font-bold" 
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {APP_NAME} • 2026
      </footer>
    </div>
  );
};

export default Login;