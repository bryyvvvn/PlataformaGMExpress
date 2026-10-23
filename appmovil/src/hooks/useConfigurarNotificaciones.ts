import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../constants/api';

export const useConfigurarNotificaciones = (usuarioId: string | undefined, token?: string | null) => {
  useEffect(() => {
    if (!usuarioId || token === undefined || !token || Capacitor.getPlatform() === 'web') return;

    const registrarDispositivo = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('El usuario denegó los permisos de notificación.');
        return;
      }

      await PushNotifications.register();
    };

    registrarDispositivo();

    const registroListener = PushNotifications.addListener('registration', async (pushToken) => {
      console.log('¡Token FCM capturado en el celular!: ', pushToken.value);

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

    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Fallo al registrar el dispositivo para push:', error);
    });

    return () => {
      registroListener.then(listener => listener.remove());
      errorListener.then(listener => listener.remove());
    };

  }, [usuarioId, token]);
};