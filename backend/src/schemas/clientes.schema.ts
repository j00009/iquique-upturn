import { z } from 'zod';

const enteroPositivo = z.coerce.number().int().positive();
const periodoSchema = z.coerce.number().int().min(2000).refine(
  (periodo) => periodo <= new Date().getFullYear() + 1,
  'El período no puede superar el próximo año.',
);

export const buscarClientesQuerySchema = z.object({
  q: z.string().trim().max(100, 'La búsqueda no puede superar 100 caracteres.').optional().default(''),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const clienteIdParamsSchema = z.object({ id: enteroPositivo });

export const vehiculosClienteQuerySchema = z.object({
  periodo: periodoSchema.optional().default(new Date().getFullYear()),
});

export const elegibilidadBodySchema = z.object({
  vehiculoIds: z.array(enteroPositivo).max(100),
  periodo: periodoSchema,
});

export type BuscarClientesQuery = z.infer<typeof buscarClientesQuerySchema>;
export type VehiculosClienteQuery = z.infer<typeof vehiculosClienteQuerySchema>;
