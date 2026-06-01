import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import HomePageTrabajador from './pages/homes/HomePageTrabajador';
import HomePageRepresentante from './pages/homes/HomePageRepresentante';
import Login from './pages/auth/Login';
import Historial from './pages/trabajador/Historial'; 
import Trabajadores from './pages/representante/Trabajadores'; 
import LoadingView from './components/LoadingView';
import { usePerfil } from './hooks/usePerfil';

const SelectorDeHome = () => {
  const { rol, empresaId, empresaNombre, cargandoRol } = usePerfil();

  if (cargandoRol) {
    return <LoadingView message="Cargando perfil..." />;
  }

  return rol === 'REPRESENTANTE' 
    ? <HomePageRepresentante empresaId={empresaId} empresaNombre={empresaNombre} /> 
    : <HomePageTrabajador />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA 1: El Home Principal (Redirige según el rol) */}
        <Route path="/" element={
          <>
            <SignedIn>
              <SelectorDeHome />
            </SignedIn>
            <SignedOut>
              <Login />
            </SignedOut>
          </>
        } />

        {/* RUTA 2: Historial de Pedidos */}
        <Route path="/historial" element={
          <>
            <SignedIn>
              <Historial />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        } />

        {/* 🔥 RUTA 3: Panel de Trabajadores (Exclusivo Representante) */}
        <Route path="/trabajadores" element={
          <>
            <SignedIn>
              <Trabajadores />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        } />

        {/* El atrapa-errores (Si escriben cualquier otra ruta, vuelven al Home) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;