// src/hooks/usePerfilTrabajador.ts
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export const usePerfilTrabajador = (clerkId: string | undefined) => {
  const [diasBloqueadosAdmin, setDiasBloqueadosAdmin] = useState<number[]>([]);
  // 🔥 Nuevo estado para guardar el convenio de la empresa
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
          
          // 1. Lógica original: Guardamos los días bloqueados
          if (data && data.diasBloqueados) {
            setDiasBloqueadosAdmin(data.diasBloqueados);
          }
          
          // 2. NUEVA LÓGICA: Guardamos el convenio si es que existe
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

  // Retornamos el convenio junto a lo que ya retornabas antes
  return { diasBloqueadosAdmin, convenio, cargandoPerfil };
};