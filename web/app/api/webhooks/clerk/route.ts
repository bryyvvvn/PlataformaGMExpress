import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import db from '../../../../lib/db'; 
import { Rol } from '@prisma/client';

export async function POST(req: Request) {
  // 1. Obtener la llave secreta del Webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Falta la variable de entorno CLERK_WEBHOOK_SECRET');
  }

  // 2. Obtener las cabeceras de seguridad
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Faltan cabeceras de Svix', { status: 400 });
  }

  // 3. Obtener el cuerpo de la petición
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // 4. Verificar la autenticidad de Clerk
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('❌ Error verificando el webhook de Clerk:', err);
    return new Response('Error de seguridad', { status: 400 });
  }

  const eventType = evt.type;

  // 5. Sincronización con Neon (usando 'db')
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, first_name, last_name, username } = evt.data;
    const nombreCompleto = `${first_name || ''} ${last_name || ''}`.trim() || username || 'Usuario sin nombre';

    try {
      await db.usuario.upsert({
        where: { id: id },
        update: { nombre: nombreCompleto },
        create: {
          id: id,
          nombre: nombreCompleto,
          rol: Rol.TRABAJADOR, 
          empresaId: 1, // 👈 Recuerda que esto asume que la empresa 1 ya existe
        }
      });
      console.log(`✅ Usuario ${id} (${nombreCompleto}) sincronizado exitosamente.`);
    } catch (error) {
      console.error('❌ Error sincronizando usuario:', error);
      return new Response('Error de base de datos', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    try {
      if (id) {
        await db.usuario.delete({ where: { id: id } });
        console.log(`🗑️ Usuario ${id} eliminado.`);
      }
    } catch (error) {
      console.log('El usuario no existía o ya fue eliminado.');
    }
  }

  return new Response('Webhook procesado correctamente', { status: 200 });
}