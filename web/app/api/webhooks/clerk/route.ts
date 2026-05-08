import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { PrismaClient, Rol } from '@prisma/client';
// Idealmente, si tienes un archivo prisma.ts en tu carpeta lib o utils, impórtalo desde ahí.
// Si no, instanciarlo aquí funcionará perfectamente para probar.
const prisma = new PrismaClient();

export async function POST(req: Request) {
  // 1. Obtener la llave secreta del Webhook desde el .env
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Falta la variable de entorno CLERK_WEBHOOK_SECRET');
  }

  // 2. Obtener las cabeceras de seguridad de Svix
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

  // 4. Verificar que la petición sea realmente de Clerk
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

  // 5. Lógica de Sincronización con tu Base de Datos (Neon)
  const eventType = evt.type;

  // Cuando se crea o actualiza un usuario
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, first_name, last_name, username } = evt.data;
    
    // Armar el nombre (por si alguien no pone apellido o usa solo username)
    const nombreCompleto = `${first_name || ''} ${last_name || ''}`.trim() || username || 'Usuario sin nombre';

    try {
      // upsert: Si el usuario existe, lo actualiza. Si no, lo crea.
      await prisma.usuario.upsert({
        where: { id: id },
        update: {
          nombre: nombreCompleto,
        },
        create: {
          id: id,
          nombre: nombreCompleto,
          rol: Rol.TRABAJADOR, 
          empresaId: 1,
        }
      });
      console.log(`✅ Usuario ${id} (${nombreCompleto}) sincronizado exitosamente en Neon.`);
    } catch (error) {
      console.error('❌ Error guardando el usuario en Neon:', error);
      return new Response('Error de base de datos', { status: 500 });
    }
  }

  // Cuando se elimina un usuario
  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    try {
      if (id) {
        await prisma.usuario.delete({
          where: { id: id }
        });
        console.log(`🗑️ Usuario ${id} eliminado de Neon.`);
      }
    } catch (error) {
      console.log('El usuario ya no existía en la BD o hubo un error al eliminar.');
    }
  }

  return new Response('Webhook procesado correctamente', { status: 200 });
}