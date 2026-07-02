import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE_URL } from '../constants/api';

export type RolUsuario = 'TRABAJADOR' | 'REPRESENTANTE' | 'ADMIN' | null;

export type ConvenioEmpresa = {
  trabajaFinDeSemana?: boolean | null;
  permiteCena?: boolean | null;
};

export type UsuarioPerfil = {
  id: string;
  nombre?: string | null;
  rol: RolUsuario;
  diasBloqueados?: number[];
  rut?: string | null;
  telefono?: string | null;
  empresaId: number | null;
  empresa: {
    id?: number;
    nombre: string;
    ConvenioEmpresa?: ConvenioEmpresa | null;
  } | null;
};

export const usePerfil = () => {
  const { user, isLoaded } = useUser();
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [rol, setRol] = useState<RolUsuario>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [convenio, setConvenio] = useState<ConvenioEmpresa | null>(null);
  const [cargandoRol, setCargandoRol] = useState(true);

  const limpiarPerfil = useCallback(() => {
    setUsuario(null);
    setRol(null);
    setEmpresaId(null);
    setEmpresaNombre('');
    setConvenio(null);
  }, []);

  const obtenerPerfil = useCallback(async () => {
    if (!isLoaded || !user) {
      if (isLoaded) {
        limpiarPerfil();
        setCargandoRol(false);
      }
      return;
    }

    setCargandoRol(true);

    try {
      const url = `${API_BASE_URL}/api/usuarios/perfil?clerkId=${encodeURIComponent(user.id)}`;
      const res = await fetch(url);

      if (!res.ok) {
        limpiarPerfil();
        return;
      }

      const data = await res.json();
      const perfil = (data?.usuario ?? data) as UsuarioPerfil | null;

      setUsuario(perfil);
      setRol(perfil?.rol ?? null);
      setEmpresaId(perfil?.empresaId ?? null);
      setEmpresaNombre(perfil?.empresa?.nombre ?? '');
      setConvenio(perfil?.empresa?.ConvenioEmpresa ?? null);
    } catch (error) {
      console.error('[usePerfil] Error:', error);
      limpiarPerfil();
    } finally {
      setCargandoRol(false);
    }
  }, [isLoaded, user, limpiarPerfil]);

  useEffect(() => {
    obtenerPerfil();
  }, [obtenerPerfil]);

  const tieneEmpresa = Boolean(empresaId && usuario?.empresa);

  return {
    usuario,
    rol,
    empresaId,
    empresaNombre,
    convenio,
    cargandoRol,
    tieneEmpresa,
    refrescarPerfil: obtenerPerfil,
  };
};
