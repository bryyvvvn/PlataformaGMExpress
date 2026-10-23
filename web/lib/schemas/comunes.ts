import { z } from 'zod'

export const idSchema = z.number().int().positive()

export const idFlexibleSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(Number)
])

export const fechaISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser formato YYYY-MM-DD')

export const clerkIdSchema = z.string().min(1, 'ID de usuario requerido')

export const diaSemanaSchema = z
  .number()
  .int()
  .min(1, 'Día debe ser entre 1 y 7')
  .max(7, 'Día debe ser entre 1 y 7')

export const rutSchema = z
  .string()
  .min(1, 'RUT requerido')
  .max(12, 'RUT inválido')
  .regex(/^[\d.]+[-][0-9kK]$/, 'Formato de RUT inválido')
