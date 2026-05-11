import { useState, useEffect } from 'react';
import { API_BASE_URL }        from '../constants/api';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface PedidoPayload {
  entradaId:    number | null;
  fondoId:      number | null;
  postreId:     number | null;
  guarnicionId?: number | null; // Sprint N: elección de guarnición en la UI
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const usePedidos = (usuarioId: string | undefined, fecha?: string) => {
  const [yaPedioHoy,            setYaPedioHoy]            = useState(false);
  const [cargandoVerificacion,  setCargandoVerificacion]  = useState(true);
  const [enviando,              setEnviando]              = useState(false);
  const [pedidoExistente,       setPedidoExistente]       = useState<any | null>(null);

  // ── Verificar si el usuario ya pidió hoy ────────────────────────────────────
  useEffect(() => {
    const verificarPedidoPrevio = async () => {
      if (!usuarioId) {
        setCargandoVerificacion(false);
        return;
      }
      try {
        const url = `${API_BASE_URL}/api/pedidos/verificar-pedido?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}`;
        const res  = await fetch(url);
        const data = await res.json();
        setYaPedioHoy(data.existe);
        setPedidoExistente(data.pedido ?? null);
      } catch (e) {
        console.error('[usePedidos] Error al verificar pedido:', e);
      } finally {
        setCargandoVerificacion(false);
      }
    };
    verificarPedidoPrevio();
  }, [usuarioId, fecha]);

  // ── Enviar nuevo pedido ──────────────────────────────────────────────────────
  const enviarPedido = async (pedido: PedidoPayload): Promise<boolean> => {
    if (!usuarioId) return false;

    setEnviando(true);
    try {
      // ✅ URL corregida: el endpoint está en /api/pedidos/crear-pedido
      const payload = {
        usuarioId,
        entradaId: pedido.entradaId,
        fondoId: pedido.fondoId,
        postreId: pedido.postreId,
        // Convierte el sentinel -1 (Sin guarnición) a null para el servidor
        guarnicionId: pedido.guarnicionId === -1 ? null : pedido.guarnicionId ?? null,
        fecha: fecha ?? undefined,
      };
      console.info('[usePedidos] Enviando pedido payload=', payload);

      const respuesta = await fetch(`${API_BASE_URL}/api/pedidos/crear-pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true); // Bloquear UI de inmediato para la fecha actual
        // Refrescar detalle de pedido para sincronizar UI
        try {
          const check = await fetch(`${API_BASE_URL}/api/pedidos/verificar-pedido?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}`);
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

  return { yaPedioHoy, pedidoExistente, cargandoVerificacion, enviarPedido, enviando };
};