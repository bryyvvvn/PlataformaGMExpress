import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { THEME, APP_NAME } from '../../constants/theme';

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
      className="flex flex-col items-center justify-between min-h-screen p-6" // 🔥 Cambiado justify-center a justify-between
      style={{ backgroundColor: THEME.colors.secondary }}
    >
      {/* Ajustamos el contenedor para que tenga altura fija y margen negativo si es necesario */}
      <div className="w-full max-w-[300px] h-[350px] -mt-10 mb-2 flex items-center justify-center overflow-hidden">
        <img 
          src="/GM Express Logo.png" 
          alt={`${APP_NAME} Logo`} 
          // Usamos scale para agrandar la imagen sin afectar el layout del div padre
          className="w-full h-full object-contain scale-[1.6] drop-shadow-xl" 
        />
      </div>

      {/* Añadimos -mt-16 para subir la tarjeta sin mover el logo de arriba */}
      <div className="w-full max-w-md -mt-16 rounded-[32px] bg-white shadow-[0_35px_70px_-30px_rgba(0,0,0,0.4)] overflow-hidden" onClickCapture={handleNavigation}>
        {isSignUp ? (
          <SignUp routing="hash" signInUrl="#/sign-in" />
        ) : (
          <SignIn routing="hash" signUpUrl="#/sign-up" />
        )}
      </div>

      <footer 
        className="mt-12 mb-6 text-[10px] uppercase tracking-widest text-center w-full font-bold" 
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {APP_NAME} • 2026
      </footer>
    </div>
  );
};

export default Login;