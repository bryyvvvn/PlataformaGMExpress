import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

export function useClerkToken() {
  const { getToken } = useAuth();

  const obtenerToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getToken();
    } catch (err) {
      console.error('[useClerkToken] Error obteniendo token:', err);
      return null;
    }
  }, [getToken]);

  return { obtenerToken };
}
