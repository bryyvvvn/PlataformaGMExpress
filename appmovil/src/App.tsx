import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import { Historial } from './pages/Historial';
import { THEME } from './constants/theme';

const App: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.colors.background }}>
      <BrowserRouter>
        <Routes>
          {/* Ruta Raíz: Decide qué mostrar según el estado de sesión */}
          <Route path="/" element={
            <>
              <SignedIn>
                <HomePage />
              </SignedIn>
              <SignedOut>
                <Login />
              </SignedOut>
            </>
          } />

          {/* Ruta Historial: Protegida */}
          <Route path="/historial" element={
            <SignedIn>
              <Historial />
            </SignedIn>
          } />

          {/* Redirección: Cualquier otra ruta vuelve al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;