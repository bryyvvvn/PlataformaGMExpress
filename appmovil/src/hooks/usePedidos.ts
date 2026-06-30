import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';

export interface PedidoPayload {
  entradasIds?: number[];
  fondoId?: number | null;
  postreId?: number | null;
  jugoId?: number | null;
  guarnicionId?: number | null;
  esFinDeSemana?: boolean;
  tipoFinde?: string | null;
  esCena?: boolean;
  tipoCena?: string | null;
  observacion?: string | null;
}

export const usePedidos = (
  usuarioId: string | undefined,
  fecha?: string,
  token?: string | null,
  esCena: boolean = false
) => {
  const [yaPedioHoy,           setYaPedioHoy]           = useState(false);
  const [cargandoVerificacion, setCargandoVerificacion] = useState(true);
  const [enviando,             setEnviando]             = useState(false);
  const [eliminando,           setEliminando]           = useState(false);
  const [pedidoExistente,      setPedidoExistente]      = useState<any | null>(null);
  const [tokenListo,           setTokenListo]           = useState(false);

  // Ref para usar siempre el token más reciente sin causarr re-ejecuciones
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // tokenListo pasa a true una sola vez cuando llega el primer token válido
  useEffect(() => {
    if (token && !tokenListo) setTokenListo(true);
    if (!token && token !== undefined) setCargandoVerificacion(false);
  }, [token]);

  const refrescarVerificacion = useCallback(async () => {
    if (!usuarioId || !tokenListo || !tokenRef.current) return;

    setCargandoVerificacion(true);
    setPedidoExistente(null);
    setYaPedioHoy(false);

    try {
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}&esCena=${esCena}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      setYaPedioHoy(data.existe);
      setPedidoExistente(data.pedido ?? null);
    } catch (e) {
      console.error('[usePedidos] Error al verificar pedido:', e);
    } finally {
      setCargandoVerificacion(false);
    }
  }, [usuarioId, fecha, esCena, tokenListo]); // token fuera — usa tokenRef internamente

  useEffect(() => {
    refrescarVerificacion();
  }, [refrescarVerificacion]);

  const enviarPedido = async (pedido: PedidoPayload): Promise<boolean> => {
    if (!usuarioId || !tokenRef.current) return false;

    setEnviando(true);
    try {
      const payload = {
        usuarioId,
        entradasIds: pedido.entradasIds || [],
        fondoId: pedido.fondoId ?? null,
        postreId: pedido.postreId ?? null,
        jugoId: pedido.jugoId ?? null,
        guarnicionId: pedido.guarnicionId === -1 ? null : pedido.guarnicionId ?? null,
        fecha: fecha ?? undefined,
        esFinDeSemana: pedido.esFinDeSemana ?? false,
        tipoFinde: pedido.tipoFinde ?? null,
        esCena: pedido.esCena ?? false,
        tipoCena: pedido.tipoCena ?? null,
        observacion: pedido.observacion?.trim() || null,
      };

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true);
        try {
          const check = await fetch(`${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}&esCena=${esCena}`, {
            headers: { 'Authorization': `Bearer ${tokenRef.current}` },
          });
          const data = await check.json();
          setPedidoExistente(data.pedido ?? null);
        } catch (e) { /* ignore */ }
        return true;
      }

      let errorData: any = null;
      try { errorData = await respuesta.json(); } catch (e) { /* ignore */ }

      if (respuesta.status === 403) { alert('El horario de pedidos ha cerrado.'); return false; }
      if (respuesta.status === 409) { setYaPedioHoy(true); return false; }

      alert(`Error: ${errorData.error || 'No se pudo procesar el pedido'}`);
      return false;
    } catch (error) {
      console.error('[usePedidos] Error de red:', error);
      alert(`Fallo de conexión con el servidor: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const eliminarPedido = async (fechaParam?: string): Promise<boolean> => {
    if (!usuarioId || !tokenRef.current) return false;

    setEliminando(true);
    try {
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fechaParam ? `&fecha=${fechaParam}` : (fecha ? `&fecha=${fecha}` : '')}&esCena=${esCena}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
      });
      if (res.ok) {
        setPedidoExistente(null);
        setYaPedioHoy(false);
        try { await refrescarVerificacion(); } catch (e) { /* ignore */ }
        return true;
      }
      return false;
    } catch (e) {
      console.error('[usePedidos] Error eliminando pedido:', e);
      return false;
    } finally {
      setEliminando(false);
    }
  };

  const enviarItems = async (items: Array<{ platoId: number; guarnicionId?: number | null; cantidad?: number }>, observacion?: string | null): Promise<boolean> => {
    if (!usuarioId || !tokenRef.current) return false;

    setEnviando(true);
    try {
      const payload = {
        usuarioId,
        items,
        fecha: fecha ?? undefined,
        observacion: observacion?.trim() || null,
        esCena,
      };

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true);
        try {
          const check = await fetch(`${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}&esCena=${esCena}`, {
            headers: { 'Authorization': `Bearer ${tokenRef.current}` },
          });
          const data = await check.json();
          setPedidoExistente(data.pedido ?? null);
        } catch (e) { /* ignore */ }
        return true;
      }

      let errorData: any = null;
      try { errorData = await respuesta.json(); } catch (e) { /* ignore */ }

      if (respuesta.status === 403) { alert('El horario de pedidos ha cerrado.'); return false; }
      if (respuesta.status === 409) { setYaPedioHoy(true); return false; }

      alert(`Error: ${errorData?.error || 'No se pudo procesar el pedido'}`);
      return false;
    } catch (error) {
      console.error('[usePedidos] Error de red (items):', error);
      alert(`Fallo de conexión con el servidor: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setEnviando(false);
    }
  };

  return { yaPedioHoy, pedidoExistente, cargandoVerificacion, enviarPedido, enviarItems, enviando, refrescarVerificacion, eliminarPedido, eliminando };
};