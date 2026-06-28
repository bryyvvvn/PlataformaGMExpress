import { z } from 'zod'
import { clerkIdSchema, idFlexibleSchema,
         fechaISOSchema, diaSemanaSchema } from './comunes'

export const vincularTrabajadorSchema = z.object({
  usuarioId: clerkIdSchema,
  empresaId: idFlexibleSchema,
})

export const bloqueoSchema = z.object({
  usuarioId: clerkIdSchema,
  diaSemana: diaSemanaSchema,
})

export const planillaSchema = z.object({
  empresaId: idFlexibleSchema,
  fecha: fechaISOSchema.optional().nullable(),
})

export const enviarPlanillaSchema = z.object({
  empresaId: idFlexibleSchema.optional(),
  usuarioId: clerkIdSchema.optional(),
  fecha: fechaISOSchema.optional().nullable(),
}).refine(
  data => data.empresaId !== undefined || data.usuarioId !== undefined,
  { message: 'Falta empresaId o usuarioId' }
)
