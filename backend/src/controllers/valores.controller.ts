import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { cargoEstadoSchema, cargoInputSchema, calcularSchema, listarTarifasSchema, tarifaEstadoSchema, tarifaIdSchema, tarifaInputSchema } from '../schemas/valores.schema';
import { ValoresService } from '../services/valores.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

export class ValoresController {
  constructor(private readonly service: ValoresService) {}
  listarTarifas = async (req: Request, res: Response) => {
    const parsed = listarTarifasSchema.safeParse(req.query);
    if (!parsed.success) throw new AppError(400, 'Los filtros de tarifas no son válidos.', parsed.error.issues);
    res.json(await this.service.listarTarifas(parsed.data, this.user(req)));
  };
  crearTarifa = async (req: Request, res: Response) => {
    const parsed = tarifaInputSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Los datos de la tarifa no son válidos.', parsed.error.issues);
    res.status(201).json(await this.service.crearTarifa(parsed.data, this.user(req)));
  };
  actualizarTarifa = async (req: Request, res: Response) => {
    const id = this.id(req);
    const parsed = tarifaInputSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Los datos de la tarifa no son válidos.', parsed.error.issues);
    res.json(await this.service.actualizarTarifa(id, parsed.data, this.user(req)));
  };
  estadoTarifa = async (req: Request, res: Response) => {
    const id = this.id(req);
    const parsed = tarifaEstadoSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'El estado de la tarifa no es válido.', parsed.error.issues);
    res.json(await this.service.cambiarEstadoTarifa(id, parsed.data.activo, this.user(req)));
  };
  listarCargos = async (req: Request, res: Response) => {
    const parsed = listarTarifasSchema.pick({ municipalidadId: true }).safeParse(req.query);
    if (!parsed.success) throw new AppError(400, 'El filtro de municipalidad no es válido.', parsed.error.issues);
    res.json(await this.service.listarCargos(parsed.data.municipalidadId, this.user(req)));
  };
  crearCargo = async (req: Request, res: Response) => {
    const parsed = cargoInputSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Los datos del cargo no son válidos.', parsed.error.issues);
    res.status(201).json(await this.service.crearCargo(parsed.data, this.user(req)));
  };
  actualizarCargo = async (req: Request, res: Response) => {
    const id = this.id(req);
    const parsed = cargoInputSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Los datos del cargo no son válidos.', parsed.error.issues);
    res.json(await this.service.actualizarCargo(id, parsed.data, this.user(req)));
  };
  estadoCargo = async (req: Request, res: Response) => {
    const id = this.id(req);
    const parsed = cargoEstadoSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'El estado del cargo no es válido.', parsed.error.issues);
    res.json(await this.service.cambiarEstadoCargo(id, parsed.data.activo, this.user(req)));
  };
  calcular = async (req: Request, res: Response) => {
    const parsed = calcularSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Los datos de cálculo no son válidos.', parsed.error.issues);
    res.json(await this.service.calcularVistaPrevia(parsed.data, this.user(req)));
  };
  private id(req: Request): number {
    const parsed = tarifaIdSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError(400, 'El identificador no es válido.', parsed.error.issues);
    return parsed.data.id;
  }
  private user(req: Request): UsuarioAutenticado {
    if (!req.usuario) throw new AppError(401, 'Se requiere autenticación.');
    return req.usuario;
  }
}
