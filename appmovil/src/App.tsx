import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

import HomePageTrabajador from './pages/homes/HomePageTrabajador';
import HomePageRepresentante from './pages/homes/HomePageRepresentante';
import Login from './pages/auth/Login';
import AccesoDenegado from './pages/auth/AccesoDenegado';
import Historial from './pages/trabajador/Historial';
import Trabajadores from './pages/representante/Trabajadores';

import LoadingView from './components/LoadingView';
import { UsuarioPendienteVinculacion } from './components/UsuarioPendienteVinculacion';
import { VerificadorRut } from './components/VerificadorRut';
import { usePerfil } from './hooks/usePerfil';
import type { RolUsuario } from './hooks/usePerfil';

interface RutaVinculadaProps {
  rolPermitido?: Exclude<RolUsuario, null>;
  children: (perfil: ReturnType<typeof usePerfil>) => React.ReactNode;
}

const RutaVinculada: React.FC<RutaVinculadaProps> = ({ rolPermitido, children }) => {
  const perfil = usePerfil();
  const { usuario, rol, cargandoRol, tieneEmpresa, refrescarPerfil } = perfil;

  if (cargandoRol) {
    return <LoadingView message="Verificando accesos..." />;
  }

  if (!usuario?.rut || !usuario?.telefono) {
    return <VerificadorRut onPerfilCompletado={refrescarPerfil} />;
  }

  if (!tieneEmpresa) {
    return (
      <UsuarioPendienteVinculacion
        usuario={usuario}
        cargando={cargandoRol}
        onRefresh={refrescarPerfil}
      />
    );
  }

  if (rol === 'ADMIN') {
    return <AccesoDenegado />;
  }

  if (rolPermitido && rol !== rolPermitido) {
    return <Navigate to="/" replace />;
  }

  return <>{children(perfil)}</>;
};

const SelectorDeHome = () => (
  <RutaVinculada>
    {({ usuario, rol, empresaId, empresaNombre, convenio, refrescarPerfil }) =>
      rol === 'REPRESENTANTE' ? (
        <HomePageRepresentante
          empresaId={empresaId}
          empresaNombre={empresaNombre}
          convenio={convenio}
        />
      ) : rol === 'TRABAJADOR' ? (
        <HomePageTrabajador empresaNombre={empresaNombre} />
      ) : (
        <UsuarioPendienteVinculacion
          usuario={usuario}
          onRefresh={refrescarPerfil}
        />
      )
    }
  </RutaVinculada>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <SelectorDeHome />
              </SignedIn>
              <SignedOut>
                <Login />
              </SignedOut>
            </>
          }
        />

        <Route
          path="/historial"
          element={
            <>
              <SignedIn>
                <RutaVinculada rolPermitido="TRABAJADOR">
                  {() => <Historial />}
                </RutaVinculada>
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          }
        />

        <Route
          path="/trabajadores"
          element={
            <>
              <SignedIn>
                <RutaVinculada rolPermitido="REPRESENTANTE">
                  {() => <Trabajadores />}
                </RutaVinculada>
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
