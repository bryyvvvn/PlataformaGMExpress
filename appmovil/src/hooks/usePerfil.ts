import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE_URL } from '../constants/api';

export type RolUsuario = 'TRABAJADOR' | 'REPRESENTANTE' | 'ADMIN' | null;

export type ConvenioEmpresa = {
  trabajaFinDeSemana?: boolean | null;
};

export const usePerfil = () => {
  const { user, isLoaded } = useUser();
  const [rol, setRol] = useState<RolUsuario>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [convenio, setConvenio] = useState<ConvenioEmpresa | null>(null);
  const [cargandoRol, setCargandoRol] = useState(true);

  useEffect(() => {
    const obtenerPerfil = async () => {
      if (!isLoaded || !user) {
        if (isLoaded) setCargandoRol(false);
        return;
      }

      try {
        const url = `${API_BASE_URL}/api/usuarios/perfil?clerkId=${user.id}`;
        const res = await fetch(url);
        
        if (res.ok) {
          const data = await res.json();
          setRol(data.rol);
          setEmpresaId(data.empresaId);
          setEmpresaNombre(data.empresa?.nombre || 'Sin Empresa');
          setConvenio(data.empresa?.ConvenioEmpresa ?? null);
        } else {
          setRol('TRABAJADOR'); 
        }
      } catch (error) {
        console.error("[usePerfil] Error:", error);
        setRol('TRABAJADOR'); 
      } finally {
        setCargandoRol(false);
      }
    };

    obtenerPerfil();
  }, [user?.id, isLoaded]); // 🔥 Optimizado por ID

  return { rol, empresaId, empresaNombre, convenio, cargandoRol };
};
