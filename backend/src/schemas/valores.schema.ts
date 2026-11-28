import { z } from 'zod';

const periodo = z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1);
const id = z.coerce.number().int().positive();
const fecha = z.coerce.date();

export const tarifaIdSchema = z.object({ id });
export const listarTarifasSchema = z.object({ municipalidadId: id.optional(), periodo: periodo.optional() });
export const tarifaInputSchema = z.object({
  municipalidadId: id,
  periodo,
  categoria: z.string().trim().min(1).max(40),
  valorBaseCLP: z.number().int().positive(),
  activo: z.boolean().optional().default(true),
});
export const tarifaEstadoSchema = z.object({ activo: z.boolean() });

const cargoBase = z.object({
  municipalidadId: id,
  descripcion: z.string().trim().min(1).max(200),
  naturaleza: z.enum(['CARGO', 'DESCUENTO']),
  tipo: z.enum(['MONTO_FIJO', 'PORCENTAJE']),
  valor: z.number().int().positive(),
  vigenciaDesde: fecha,
  vigenciaHasta: fecha,
  activo: z.boolean().optional().default(true),
});
export const cargoInputSchema = cargoBase.superRefine((data, ctx) => {
  if (data.tipo === 'PORCENTAJE' && data.valor > 100) ctx.addIssue({ code: 'custom', path: ['valor'], message: 'El porcentaje debe estar entre 1 y 100.' });
  if (data.vigenciaDesde > data.vigenciaHasta) ctx.addIssue({ code: 'custom', path: ['vigenciaHasta'], message: 'La vigencia desde no puede ser posterior a la vigencia hasta.' });
});
export const cargoEstadoSchema = tarifaEstadoSchema;

export const calcularSchema = z.object({
  clienteId: id,
  vehiculoIds: z.array(id).min(1).max(100),
  periodo,
});
