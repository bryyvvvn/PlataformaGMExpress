import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL }        from '../constants/api';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface PedidoPayload {
  entradasIds: number[];
  fondoId: number | null;
  postreId: number | null;
  jugoId: number | null; // ✅ AGREGADO PARA QUE LA API LO RECIBA
  guarnicionId: number | null;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const usePedidos = (usuarioId: string | undefined, fecha?: string) => {
  const [yaPedioHoy,            setYaPedioHoy]            = useState(false);
  const [cargandoVerificacion,  setCargandoVerificacion]  = useState(true);
  const [enviando,              setEnviando]              = useState(false);
  const [eliminando,            setEliminando]            = useState(false);
  const [pedidoExistente,       setPedidoExistente]       = useState<any | null>(null);

  // ── 1. EXTRAEMOS LA VERIFICACIÓN A UN CALLBACK PARA PODER REUTILIZARLA ──────
  const refrescarVerificacion = useCallback(async () => {
    if (!usuarioId) {
      setCargandoVerificacion(false);
      return;
    }
    
    // 👇 SOLUCIÓN: Reiniciamos el estado a "Cargando" inmediatamente y limpiamos el pedido viejo
    setCargandoVerificacion(true);
    setPedidoExistente(null); 
    setYaPedioHoy(false);
    
    try {
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}`;
      const res  = await fetch(url);
      const data = await res.json();
      setYaPedioHoy(data.existe);
      setPedidoExistente(data.pedido ?? null);
    } catch (e) {
      console.error('[usePedidos] Error al verificar pedido:', e);
    } finally {
      setCargandoVerificacion(false);
    }
  }, [usuarioId, fecha]);

  // ── 2. EL USE EFFECT AHORA SOLO LLAMA AL CALLBACK ───────────────────────────
  useEffect(() => {
    refrescarVerificacion();
  }, [refrescarVerificacion]);

  // ── Enviar nuevo pedido (Lógica original intacta) ───────────────────────────
  const enviarPedido = async (pedido: PedidoPayload): Promise<boolean> => {
    if (!usuarioId) return false;

    setEnviando(true);
    try {
      const payload = {
        usuarioId,
        entradasIds: pedido.entradasIds,
        fondoId: pedido.fondoId,
        postreId: pedido.postreId,
        jugoId: pedido.jugoId, // ✅ SE AÑADIÓ PARA ENVIARLO AL SERVIDOR
        // Convierte el sentinel -1 (Sin guarnición) a null para el servidor
        guarnicionId: pedido.guarnicionId === -1 ? null : pedido.guarnicionId ?? null,
        fecha: fecha ?? undefined,
      };
      console.info('[usePedidos] Enviando pedido payload=', payload);

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true); // Bloquear UI de inmediato para la fecha actual
        // Refrescar detalle de pedido para sincronizar UI
        try {
          const check = await fetch(`${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}`);
          const data = await check.json();
          setPedidoExistente(data.pedido ?? null);
        } catch (e) {
          // ignore
        }
        return true;
      }

      let errorData: any = null;
      try { errorData = await respuesta.json(); } catch (e) { /* ignore */ }

      // 403 = deadline pasado en el servidor (doble capa con el frontend)
      if (respuesta.status === 403) {
        alert('El horario de pedidos ha cerrado.');
        return false;
      }

      // 409 = ya existe un pedido para hoy
      if (respuesta.status === 409) {
        setYaPedioHoy(true); // sincronizar estado
        return false;
      }

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
    if (!usuarioId) return false;

    setEliminando(true);
    try {
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fechaParam ? `&fecha=${fechaParam}` : (fecha ? `&fecha=${fecha}` : '')}`;
      const res = await fetch(url, { method: 'DELETE' });
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

  // Enviar pedidos usando un arreglo genérico de items (para Canje / Colaciones Premium / Otros)
  const enviarItems = async (items: Array<{ platoId: number; guarnicionId?: number | null; cantidad?: number }>): Promise<boolean> => {
    if (!usuarioId) return false;

    setEnviando(true);
    try {
      const payload = {
        usuarioId,
        items,
        fecha: fecha ?? undefined,
      };

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true);
        try {
          const check = await fetch(`${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}`);
          const data = await check.json();
          setPedidoExistente(data.pedido ?? null);
        } catch (e) { /* ignore */ }
        return true;
      }

      let errorData: any = null;
      try { errorData = await respuesta.json(); } catch (e) { /* ignore */ }

      if (respuesta.status === 403) {
        alert('El horario de pedidos ha cerrado.');
        return false;
      }

      if (respuesta.status === 409) {
        setYaPedioHoy(true);
        return false;
      }

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

  // ── 3. EXPORTAMOS LA FUNCIÓN DE REFRESCO ────────────────────────────────────
  return { yaPedioHoy, pedidoExistente, cargandoVerificacion, enviarPedido, enviarItems, enviando, refrescarVerificacion, eliminarPedido, eliminando };
};