import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export const usePerfilTrabajador = (clerkId: string | undefined) => {
  const [diasBloqueadosAdmin, setDiasBloqueadosAdmin] = useState<number[]>([]);
  const [convenio, setConvenio] = useState<any | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!clerkId) {
        setCargandoPerfil(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/perfil?clerkId=${clerkId}`);
        if (res.ok) {
          const data = await res.json();
          
          if (data && data.diasBloqueados) {
            setDiasBloqueadosAdmin(data.diasBloqueados);
          }
          
          if (data && data.empresa && data.empresa.ConvenioEmpresa) {
             setConvenio(data.empresa.ConvenioEmpresa);
          }
        }
      } catch (error) {
        console.error("Error obteniendo perfil del trabajador:", error);
      } finally {
        setCargandoPerfil(false);
      }
    };
    fetchPerfil();
  }, [clerkId]);

  return { diasBloqueadosAdmin, convenio, cargandoPerfil };
};