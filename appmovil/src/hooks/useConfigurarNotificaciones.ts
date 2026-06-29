import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../constants/api';

export const useConfigurarNotificaciones = (usuarioId: string | undefined, token?: string | null) => {
  useEffect(() => {
    // Esperamos a tener usuarioId y token resuelto antes de registrar nada.
    // token === undefined → Clerk aún no resolvió, esperamos.
    // !token (null) → sin sesión, no tiene sentido registrar.
    // Solo corremos en dispositivo nativo, no en el navegador web.
    if (!usuarioId || token === undefined || !token || Capacitor.getPlatform() === 'web') return;

    const registrarDispositivo = async () => {
      // 1. Revisar y pedir permiso al usuario (La ventana nativa del celular)
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('El usuario denegó los permisos de notificación.');
        return;
      }

      // 2. Iniciar el registro con el "cartero" (Firebase/Google)
      await PushNotifications.register();
    };

    registrarDispositivo();

    // 3. Listener: Escucha cuando Firebase nos entrega el Token con éxito
    const registroListener = PushNotifications.addListener('registration', async (pushToken) => {
      console.log('¡Token FCM capturado en el celular!: ', pushToken.value);

      // 4. Mandamos este Token a la ruta POST en Next.js
      // En este punto sabemos seguro que `token` existe porque pasó la guarda de arriba
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/usuarios/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            usuarioId,
            fcmToken: pushToken.value,
          }),
        });

        if (respuesta.ok) {
          console.log('✅ Token guardado exitosamente en la base de datos.');
        } else {
          console.error('❌ Error del backend al guardar el token');
        }
      } catch (error) {
        console.error('Error de red enviando el token al backend:', error);
      }
    });

    // 5. Listener de Errores
    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Fallo al registrar el dispositivo para push:', error);
    });

    // Limpieza cuando el componente se desmonta o cambian las dependencias
    return () => {
      registroListener.then(listener => listener.remove());
      errorListener.then(listener => listener.remove());
    };

  }, [usuarioId, token]); // token en dependencias → se re-ejecuta cuando Clerk resuelve
};