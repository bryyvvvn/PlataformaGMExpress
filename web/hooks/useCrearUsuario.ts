import { useState } from "react";

// Tipamos los datos que vamos a recibir del formulario
type CrearUsuarioPayload = {
  rut: string;
  nombre: string;
  apellido: string;
  password: string;
  empresaId: string;
  telefono: string;
  correo: string;
};

export function useCrearUsuario() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearUsuario = async (datos: CrearUsuarioPayload) => {
    setCargando(true);
    setError(null);
    
    try {
      const respuesta = await fetch("/api/admin/crear-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.error || "Ocurrió un error al crear el usuario.");
      }

      const usuarioCreado = await respuesta.json();
      return usuarioCreado;
      
    } catch (err: any) {
      setError(err.message);
      throw err; // Lanzamos el error de nuevo por si el componente quiere hacer algo extra
    } finally {
      setCargando(false);
    }
  };

  return { crearUsuario, cargando, error };
}