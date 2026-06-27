import { z } from 'zod'

// ID numérico positivo
export const idSchema = z.number().int().positive()

// ID que puede venir como string o number (común en forms)
export const idFlexibleSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(Number)
])

// Fecha ISO YYYY-MM-DD
export const fechaISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser formato YYYY-MM-DD')

// Clerk userId (string no vacío)
export const clerkIdSchema = z.string().min(1, 'ID de usuario requerido')

// Día de semana 1-7
export const diaSemanaSchema = z
  .number()
  .int()
  .min(1, 'Día debe ser entre 1 y 7')
  .max(7, 'Día debe ser entre 1 y 7')

// RUT chileno (formato básico)
export const rutSchema = z
  .string()
  .min(1, 'RUT requerido')
  .max(12, 'RUT inválido')
  .regex(/^[\d.]+[-][0-9kK]$/, 'Formato de RUT inválido')
