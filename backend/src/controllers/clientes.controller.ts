import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import {
  buscarClientesQuerySchema,
  clienteIdParamsSchema,
  vehiculosClienteQuerySchema,
} from '../schemas/clientes.schema';
import { ClientesService } from '../services/clientes.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  listar = async (req: Request, res: Response): Promise<void> => {
    const usuario = this.usuario(req);
    const query = buscarClientesQuerySchema.safeParse(req.query);
    if (!query.success) throw new AppError(400, 'Los parámetros de búsqueda no son válidos.', query.error.issues);
    res.status(200).json(await this.clientes.listar(query.data, usuario));
  };

  obtenerFicha = async (req: Request, res: Response): Promise<void> => {
    const usuario = this.usuario(req);
    const params = clienteIdParamsSchema.safeParse(req.params);
    if (!params.success) throw new AppError(400, 'El identificador del cliente no es válido.', params.error.issues);
    res.status(200).json(await this.clientes.obtenerFicha(params.data.id, usuario));
  };

  listarVehiculos = async (req: Request, res: Response): Promise<void> => {
    const usuario = this.usuario(req);
    const params = clienteIdParamsSchema.safeParse(req.params);
    if (!params.success) throw new AppError(400, 'El identificador del cliente no es válido.', params.error.issues);
    const query = vehiculosClienteQuerySchema.safeParse(req.query);
    if (!query.success) throw new AppError(400, 'El período no es válido.', query.error.issues);
    res.status(200).json(await this.clientes.listarVehiculos(params.data.id, query.data.periodo, usuario));
  };

  private usuario(req: Request): UsuarioAutenticado {
    if (!req.usuario) throw new AppError(401, 'Se requiere autenticación.');
    return req.usuario;
  }
}
