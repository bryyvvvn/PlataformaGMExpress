import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import db from '../../../../lib/db'; 
import { Rol } from '@prisma/client';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Falta la variable de entorno CLERK_WEBHOOK_SECRET');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Faltan cabeceras de Svix', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

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

  if (eventType === 'user.created' || eventType === 'user.updated') {
    // 🔥 Separamos los datos exactos que vienen de Clerk
    const { id, first_name, last_name, username } = evt.data;
    
    // Si el usuario no tiene 'username' en Clerk, usamos su primer nombre como respaldo
    const nick = username || first_name || 'Nuevo Usuario';

    try {
      await db.usuario.upsert({
        where: { id: id },
        update: { 
          nombre: first_name || null,
          apellido: last_name || null,
          nombreUsuario: nick // Actualizamos el nick si cambia
        },
        create: {
          id: id,
          nombreUsuario: nick,
          nombre: first_name || null,
          apellido: last_name || null,
          rol: Rol.TRABAJADOR, 
          empresaId: 1, 
        }
      });
      console.log(`✅ Usuario ${id} sincronizado exitosamente.`);
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