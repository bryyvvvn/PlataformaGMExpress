import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export function useClerkToken() {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelado = false;

    const refrescarToken = async () => {
      try {
        const nuevoToken = await getToken({ skipCache: true });
        if (!cancelado) setToken(nuevoToken);
      } catch (err) {
        console.error('[useClerkToken] Error obteniendo token:', err);
        if (!cancelado) setToken(null);
      }
    };

    refrescarToken();

    // Refrescar el token cada 50 segundos para evitar que expire (los tokens de Clerk duran ~60 segundos)
    const interval = setInterval(refrescarToken, 50000);

    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [getToken]);

  return { token };
}
