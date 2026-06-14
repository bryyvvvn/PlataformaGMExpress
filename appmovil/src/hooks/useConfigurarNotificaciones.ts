import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../constants/api'; // Verifica que esta ruta apunte bien a tu archivo de constantes

export const useConfigurarNotificaciones = (usuarioId: string | undefined) => {
  useEffect(() => {
    // Si no hay usuario o estamos probando en el navegador web (computador), cancelamos.
    // Las notificaciones nativas solo funcionan cuando la app corre en un celular.
    if (!usuarioId || Capacitor.getPlatform() === 'web') return;

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
    const registroListener = PushNotifications.addListener('registration', async (token) => {
      console.log('¡Token FCM capturado en el celular!: ', token.value);

      // 4. Mandamos este Token a la ruta POST que armaste en Next.js (Railway)
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/usuarios/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId: usuarioId,
            fcmToken: token.value
          })
        });
        
        if (respuesta.ok) {
          console.log('✅ Token guardado exitosamente en la base de datos de Neon.');
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

    // Limpieza de memoria cuando el componente se cierra
    // Limpieza de memoria cuando el componente se cierra
    return () => {
      registroListener.then(listener => listener.remove());
      errorListener.then(listener => listener.remove());
    };

  }, [usuarioId]);
};