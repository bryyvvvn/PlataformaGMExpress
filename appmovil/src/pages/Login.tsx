import { useState } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { THEME, APP_NAME } from '../constants/theme';

/**
 * Login page with dual authentication modes:
 * 1. Demo mode: Quick access with any credentials for visual testing
 * 2. Clerk SSO: Production-grade authentication
 */
interface LoginProps {
  onDemoLogin?: () => void;
}

const Login: React.FC<LoginProps> = ({ onDemoLogin }) => {
  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [error, setError] = useState('');
  const [showClerkAuth, setShowClerkAuth] = useState(false);

  /**
   * Validate and submit demo login form.
   * Requires both username and password (any values accepted for demo).
   */
  const handleDemoSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmedUsername = demoUsername.trim();
    const trimmedPassword = demoPassword.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Por favor ingresa usuario y contraseña.');
      return;
    }

    if (trimmedUsername.length < 2) {
      setError('El usuario debe tener al menos 2 caracteres.');
      return;
    }

    if (trimmedPassword.length < 2) {
      setError('La contraseña debe tener al menos 2 caracteres.');
      return;
    }

    setError('');
    onDemoLogin?.();
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6 relative"
      style={{ backgroundColor: THEME.colors.secondary }}
    >
      <div className="relative -mt-20 mb-2 flex justify-center items-center w-full">
        <img src="/GM Express Logo.png" alt={`${APP_NAME} Logo`} className="h-75 w-auto object-contain" />
      </div>

      <div className="w-full flex justify-center -mt-14 relative z-10">
        <div className="w-full max-w-sm">
          {!showClerkAuth ? (
            <form onSubmit={handleDemoSubmit} className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
              <h2 className="text-xl font-black text-center uppercase tracking-tighter italic" style={{ color: THEME.colors.secondary }}>
                Acceso Rápido
              </h2>
              <p className="text-[10px] text-gray-400 text-center mt-1 mb-5 uppercase tracking-widest font-bold">
                Módulo de Presentación
              </p>

              <label className="block text-[10px] font-black mb-1 uppercase" style={{ color: THEME.colors.secondary }}>
                Usuario
              </label>
              <input
                type="text"
                value={demoUsername}
                onChange={(e) => setDemoUsername(e.target.value)}
                disabled={false}
                className="w-full mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 transition-colors"
                style={{
                  borderColor: demoUsername ? THEME.colors.primary : '#E5E7EB',
                }}
                placeholder="ej: admin"
                autoComplete="off"
              />

              <label className="block text-[10px] font-black mb-1 uppercase" style={{ color: THEME.colors.secondary }}>
                Contraseña
              </label>
              <input
                type="password"
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                disabled={false}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 transition-colors"
                style={{
                  borderColor: demoPassword ? THEME.colors.primary : '#E5E7EB',
                }}
                placeholder="••••"
                autoComplete="off"
              />

              {error && <p className="text-[10px] mt-3 font-bold uppercase" style={{ color: THEME.colors.error }}>{error}</p>}

              <button
                type="submit"
                className="w-full mt-6 text-white py-3 rounded-xl font-black uppercase tracking-wide shadow-lg active:scale-95 transition-all"
                style={{
                  backgroundColor: THEME.colors.primary,
                }}
              >
                Entrar a la Demo
              </button>

              <button
                type="button"
                onClick={() => setShowClerkAuth(true)}
                className="w-full text-center mt-6 text-[9px] text-gray-300 font-bold transition-colors uppercase tracking-widest hover:text-gray-200"
              >
                Acceso Corporativo (Clerk)
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center">
              <SignIn routing="hash" />
              <button
                onClick={() => setShowClerkAuth(false)}
                className="mt-4 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                Volver al ingreso de prueba
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 text-[10px] uppercase tracking-widest text-center w-full font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {APP_NAME} Logística • 2026
      </footer>
    </div>
  );
};

export default Login;