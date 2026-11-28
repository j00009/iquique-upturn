import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { compraIdSchema, cuotaPagoParamsSchema, pagarCuotaSchema } from '../schemas/compras.schema';
import { PagosService } from '../services/pagos.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

export class PagosController {
  constructor(private readonly service: PagosService) {}

  pagar = async (req: Request, res: Response) => {
    const params = cuotaPagoParamsSchema.safeParse(req.params);
    if (!params.success) throw new AppError(400, 'Los identificadores de compra o cuota no son válidos.', params.error.issues);
    const body = pagarCuotaSchema.safeParse(req.body);
    if (!body.success) throw new AppError(400, 'El monto de pago debe ser un número entero.', body.error.issues);
    const key = req.header('Idempotency-Key')?.trim();
    if (!key || key.length < 8 || key.length > 128) throw new AppError(400, 'Debe enviar un Idempotency-Key de entre 8 y 128 caracteres.');
    const pago = await this.service.pagarCuota(params.data.id, params.data.numero, body.data.montoCLP, key, this.user(req));
    res.status(201).json(pago);
  };

  estado = async (req: Request, res: Response) => {
    const params = compraIdSchema.safeParse(req.params);
    if (!params.success) throw new AppError(400, 'El identificador de compra no es válido.', params.error.issues);
    res.json(await this.service.obtenerEstado(params.data.id, this.user(req)));
  };

  private user(req: Request): UsuarioAutenticado {
    if (!req.usuario) throw new AppError(401, 'Se requiere autenticación.');
    return req.usuario;
  }
}
