import { z } from 'zod';

const id = z.coerce.number().int().positive();
const periodo = z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1);

export const crearCotizacionSchema = z.object({
  clienteId: id,
  vehiculoIds: z.array(id).min(1).max(100),
  periodo,
});

export const crearCompraSchema = z.object({
  cotizacionId: id,
  modalidad: z.enum(['TOTAL', 'DOS_CUOTAS']),
});

export const compraIdSchema = z.object({ id });

export const cuotaPagoParamsSchema = z.object({ id, numero: z.coerce.number().int().min(1).max(2) });

export const pagarCuotaSchema = z.object({ montoCLP: z.number().int() });
