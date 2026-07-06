// src/hooks/useVerificadorRut.ts
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants/api';

type ResultadoGuardarRut =
  | { success: true }
  | { success: false; error: string };

const MENSAJE_TELEFONO_INVALIDO =
  'Ingresa un telefono valido, por ejemplo +56 9 27832211 o 927832211.';
const MENSAJE_SESION_INVALIDA =
  'Tu sesión no pudo ser validada. Cierra sesión e inicia nuevamente.';

export function normalizarTelefonoPerfil(valor: string): string | null {
  const digitos = valor.replace(/\D/g, '');

  if (/^\d{8}$/.test(digitos)) {
    return `+569${digitos}`;
  }

  if (/^9\d{8}$/.test(digitos)) {
    return `+56${digitos}`;
  }

  if (/^569\d{8}$/.test(digitos)) {
    return `+${digitos}`;
  }

  return null;
}

export const useVerificadorRut = () => {
  const { getToken, isLoaded, userId } = useAuth();
  const [requiereRut, setRequiereRut] = useState(false);
  const [guardandoRut, setGuardandoRut] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!isLoaded) {
        return;
      }

      if (!userId) {
        setRequiereRut(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/usuarios/perfil?clerkId=${encodeURIComponent(userId)}`
        );

        if (res.ok) {
          const data = await res.json();
          setRequiereRut(Boolean(data && !data.rut));
        }
      } catch (error) {
        console.error('Error obteniendo perfil en verificador:', error);
      }
    };

    fetchPerfil();
  }, [isLoaded, userId]);

  const guardarRutAPI = async (
    rut: string,
    telefono: string
  ): Promise<ResultadoGuardarRut> => {
    setGuardandoRut(true);

    try {
      if (!isLoaded) {
        return {
          success: false,
          error: 'Espera a que la sesión termine de cargar.',
        };
      }

      if (!userId) {
        return {
          success: false,
          error: MENSAJE_SESION_INVALIDA,
        };
      }

      const telefonoNormalizado = normalizarTelefonoPerfil(telefono);

      if (!telefonoNormalizado) {
        return { success: false, error: MENSAJE_TELEFONO_INVALIDO };
      }

      const token = await getToken({ skipCache: true });

      if (!token) {
        if (import.meta.env.DEV) {
          console.error('[useVerificadorRut] token ausente', {
            clerkLoaded: isLoaded,
            hasUserId: Boolean(userId),
          });
        }

        return {
          success: false,
          error: MENSAJE_SESION_INVALIDA,
        };
      }

      const res = await fetch(`${API_BASE_URL}/api/usuarios/rut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clerkId: userId,
          rut,
          telefono: telefonoNormalizado,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setRequiereRut(false);
        return { success: true };
      }

      if (res.status === 401) {
        return {
          success: false,
          error: MENSAJE_SESION_INVALIDA,
        };
      }

      return {
        success: false,
        error: data?.error || 'No se pudo completar el perfil.',
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: 'Error de conexion al guardar los datos.',
      };
    } finally {
      setGuardandoRut(false);
    }
  };

  return { requiereRut, guardandoRut, guardarRutAPI };
};
