import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { compraIdSchema, crearCompraSchema, crearCotizacionSchema } from '../schemas/compras.schema';
import { ComprasService } from '../services/compras.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  cotizar = async (req: Request, res: Response) => {
    const parsed = crearCotizacionSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Los datos de la cotización no son válidos.', parsed.error.issues);
    res.status(201).json(await this.service.crearCotizacion(parsed.data, this.user(req)));
  };

  comprar = async (req: Request, res: Response) => {
    const parsed = crearCompraSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Los datos de la compra no son válidos.', parsed.error.issues);
    const key = req.header('Idempotency-Key')?.trim();
    if (!key || key.length < 8 || key.length > 128) {
      throw new AppError(400, 'Debe enviar un Idempotency-Key de entre 8 y 128 caracteres.');
    }
    res.status(201).json(await this.service.crearCompra(parsed.data.cotizacionId, parsed.data.modalidad, key, this.user(req)));
  };

  obtener = async (req: Request, res: Response) => {
    const parsed = compraIdSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError(400, 'El identificador de compra no es válido.', parsed.error.issues);
    res.json(await this.service.obtenerCompra(parsed.data.id, this.user(req)));
  };

  private user(req: Request): UsuarioAutenticado {
    if (!req.usuario) throw new AppError(401, 'Se requiere autenticación.');
    return req.usuario;
  }
}
