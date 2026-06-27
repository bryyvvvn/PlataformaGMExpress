import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL }        from '../constants/api';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface PedidoPayload {
  entradasIds?: number[];
  fondoId?: number | null;
  postreId?: number | null;
  jugoId?: number | null;
  guarnicionId?: number | null;
  esFinDeSemana?: boolean;
  tipoFinde?: string | null;
  esCena?: boolean; // 🔥 Agregado
  tipoCena?: string | null; // 🔥 Agregado
  observacion?: string | null;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

// 🔥 NUEVO: Ahora el hook recibe 'esCena' como tercer parámetro (por defecto false)
export const usePedidos = (usuarioId: string | undefined, fecha?: string, esCena: boolean = false) => {
  const [yaPedioHoy,            setYaPedioHoy]            = useState(false);
  const [cargandoVerificacion,  setCargandoVerificacion]  = useState(true);
  const [enviando,              setEnviando]              = useState(false);
  const [eliminando,            setEliminando]            = useState(false);
  const [pedidoExistente,       setPedidoExistente]       = useState<any | null>(null);

  const refrescarVerificacion = useCallback(async () => {
    if (!usuarioId) {
      setCargandoVerificacion(false);
      return;
    }
    
    setCargandoVerificacion(true);
    setPedidoExistente(null); 
    setYaPedioHoy(false);
    
    try {
      // 🔥 Le pasamos el parámetro &esCena=true o false a la URL de búsqueda
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}&esCena=${esCena}`;
      const res  = await fetch(url);
      const data = await res.json();
      setYaPedioHoy(data.existe);
      setPedidoExistente(data.pedido ?? null);
    } catch (e) {
      console.error('[usePedidos] Error al verificar pedido:', e);
    } finally {
      setCargandoVerificacion(false);
    }
  }, [usuarioId, fecha, esCena]); // 🔥 Agregamos esCena a las dependencias

  useEffect(() => {
    refrescarVerificacion();
  }, [refrescarVerificacion]);

  const enviarPedido = async (pedido: PedidoPayload): Promise<boolean> => {
    if (!usuarioId) return false;

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
      
      console.info('[usePedidos] Enviando pedido payload=', payload);

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true);
        try {
          // 🔥 Actualizamos la URL aquí también
          const check = await fetch(`${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}&esCena=${esCena}`);
          const data = await check.json();
          setPedidoExistente(data.pedido ?? null);
        } catch (e) {
          // ignore
        }
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
      // 🔥 Le pasamos el parámetro &esCena a la URL de eliminación
      const url = `${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fechaParam ? `&fecha=${fechaParam}` : (fecha ? `&fecha=${fecha}` : '')}&esCena=${esCena}`;
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

  const enviarItems = async (items: Array<{ platoId: number; guarnicionId?: number | null; cantidad?: number }>, observacion?: string | null): Promise<boolean> => {
    if (!usuarioId) return false;

    setEnviando(true);
    try {
      const payload = {
        usuarioId,
        items,
        fecha: fecha ?? undefined,
        observacion: observacion?.trim() || null,
        esCena: esCena, // 🔥 Lo inyectamos por seguridad
      };

      const respuesta = await fetch(`${API_BASE_URL}/api/trabajador/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true);
        try {
          // 🔥 Actualizamos la URL aquí también
          const check = await fetch(`${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${usuarioId}${fecha ? `&fecha=${fecha}` : ''}&esCena=${esCena}`);
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

  return { yaPedioHoy, pedidoExistente, cargandoVerificacion, enviarPedido, enviarItems, enviando, refrescarVerificacion, eliminarPedido, eliminando };
};