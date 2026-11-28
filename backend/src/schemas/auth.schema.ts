import { z } from 'zod';

export const loginSchema = z.object({
  correo: z.string().trim().email('Ingresa un correo válido.').max(254),
  password: z.string().min(1, 'La contraseña es obligatoria.').max(200),
});
