import { useState, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useAsignarManual = (token?: string | null) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Usamos useRef para tener siempre el token más fresco sin re-renderizar
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const asignarPedido = async (usuarioId: number | string, fecha: string, tipoMenu: string, esCena: boolean) => {
    if (!tokenRef.current) {
      console.error("No hay token de autenticación");
      return false;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/representante/pedido-manual-representante`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRef.current}` // 🔥 Aquí va el pase VIP
        },
        body: JSON.stringify({ usuarioId, fecha, tipoMenu, esCena })
      });

      if (response.ok) {
        return true;
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
        return false;
      }
    } catch (e) { 
      alert("Error de conexión al servidor"); 
      return false; 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return { asignarPedido, isSubmitting };
};
