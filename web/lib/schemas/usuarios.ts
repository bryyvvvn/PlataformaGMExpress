import { z } from 'zod'
import { clerkIdSchema, rutSchema } from './comunes'

export const guardarRutSchema = z.object({
  clerkId: clerkIdSchema,
  rut: rutSchema,
  telefono: z.string().min(1, 'Telefono requerido'),
})

export const guardarTokenSchema = z.object({
  usuarioId: clerkIdSchema,
  fcmToken: z.string().min(1, 'Token FCM requerido'),
})
