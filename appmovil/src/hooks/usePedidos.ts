import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

export const usePedidos = (usuarioId: string | undefined) => {
  const [yaPedioHoy, setYaPedioHoy] = useState(false);
  const [cargandoVerificacion, setCargandoVerificacion] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // 1. Verificar si ya pidió hoy
  useEffect(() => {
    const verificarPedidoPrevio = async () => {
      if (!usuarioId) {
        setCargandoVerificacion(false);
        return;
      }
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/pedidos/verificar-pedido?usuarioId=${usuarioId}`);
        const data = await res.json();
        setYaPedioHoy(data.existe);
      } catch (e) {
        console.error("Error al verificar pedido:", e);
      } finally {
        setCargandoVerificacion(false);
      }
    };

    verificarPedidoPrevio();
  }, [usuarioId]);

  // 2. Enviar el nuevo pedido
  const enviarPedido = async (pedido: { entradaId: number | null, fondoId: number | null, postreId: number | null }) => {
    if (!usuarioId) return false;
    
    setEnviando(true);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: usuarioId,
          entradaId: pedido.entradaId,
          fondoId: pedido.fondoId,
          postreId: pedido.postreId,
        }),
      });

      if (respuesta.ok) {
        setYaPedioHoy(true); // Bloqueamos la interfaz al instante
        return true;
      } else {
        const errorData = await respuesta.json();
        alert(`Error: ${errorData.error || 'No se pudo procesar el pedido'}`);
        return false;
      }
    } catch (error) {
      console.error("Error enviando pedido:", error);
      alert("Fallo de conexión con el servidor.");
      return false;
    } finally {
      setEnviando(false);
    }
  };

  return { yaPedioHoy, cargandoVerificacion, enviarPedido, enviando };
};