import { useState } from 'react';
import { API_BASE_URL } from '../constants/api';

export const usePlanilla = () => {
  const [loading, setLoading] = useState(false);

  const enviarPlanilla = async (empresaId: number | null, fecha?: string) => {
    if (!empresaId) return { ok: false, data: null };
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/representante/enviar-planilla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId, fecha })
      });
      const data = res.ok ? await res.json() : null;
      return { ok: res.ok, data };
    } catch (e) {
      console.error('[usePlanilla] Error enviando planilla:', e);
      return { ok: false, data: null, error: e };
    } finally {
      setLoading(false);
    }
  };

  return { enviarPlanilla, loading };
};
