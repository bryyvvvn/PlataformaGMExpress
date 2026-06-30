// src/hooks/useVincularTrabajador.ts
import { useState, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';

export const useVincularTrabajador = (token?: string | null) => {
  const [buscando, setBuscando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [trabajadorEncontrado, setTrabajadorEncontrado] = useState<any | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const buscarTrabajador = async (rut: string) => {
    if (!rut.trim()) return;
    setBuscando(true);
    setErrorBusqueda(null);
    setTrabajadorEncontrado(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/representante/buscar-trabajador?rut=${rut}`, {
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTrabajadorEncontrado(data);
      } else {
        setErrorBusqueda(data.error || 'Error al buscar el trabajador');
      }
    } catch (e) {
      setErrorBusqueda('Error de red al intentar buscar.');
    } finally {
      setBuscando(false);
    }
  };

  const vincularTrabajador = async (usuarioId: number, empresaId: number, onSuccess: () => void) => {
    setVinculando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/representante/vincular-trabajador`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify({ usuarioId, empresaId })
      });

      if (res.ok) {
        alert('Trabajador vinculado exitosamente.');
        onSuccess(); // Ejecuta la función para cerrar el modal y recargar
      } else {
        const data = await res.json();
        alert(data.error || 'Ocurrió un error al vincular.');
      }
    } catch (e) {
      alert('Error de red al intentar vincular.');
    } finally {
      setVinculando(false);
    }
  };

  const limpiarBusqueda = () => {
    setTrabajadorEncontrado(null);
    setErrorBusqueda(null);
  };

  return { buscando, vinculando, trabajadorEncontrado, errorBusqueda, buscarTrabajador, vincularTrabajador, limpiarBusqueda };
};