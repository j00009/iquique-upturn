import { NaturalezaCargo, Prisma, PrismaClient, TipoCargo } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { ClientesService } from './clientes.service';
import { LogService } from './log.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

type TarifaInput = { municipalidadId: number; periodo: number; categoria: string; valorBaseCLP: number; activo?: boolean };
type CargoInput = { municipalidadId: number; descripcion: string; naturaleza: NaturalezaCargo; tipo: TipoCargo; valor: number; vigenciaDesde: Date; vigenciaHasta: Date; activo?: boolean };
type VehiculoCalculo = { id: number; patente: string; tipo: string; municipalidadId: number; marca: string | null; modelo: string | null; anio: number };

export class ValoresService {
  constructor(private readonly db: PrismaClient, private readonly logs: LogService, private readonly clientes: ClientesService) {}

  listarTarifas(filtros: { municipalidadId?: number; periodo?: number }, user: UsuarioAutenticado) {
    const where: Prisma.TarifaPermisoWhereInput = {};
    if (filtros.periodo !== undefined) where.periodo = filtros.periodo;
    if (user.rol === 'FUNCIONARIO') where.municipalidadId = this.municipalidadUsuario(user);
    else if (filtros.municipalidadId !== undefined) where.municipalidadId = filtros.municipalidadId;
    return this.db.tarifaPermiso.findMany({ where, include: { municipalidad: { select: { nombre: true } } }, orderBy: [{ municipalidadId: 'asc' }, { periodo: 'desc' }, { categoria: 'asc' }] });
  }

  async crearTarifa(input: TarifaInput, user: UsuarioAutenticado) {
    this.validarMunicipalidadEscritura(input.municipalidadId, user);
    await this.validarCategoria(input.municipalidadId, input.categoria);
    try {
      const result = await this.db.tarifaPermiso.create({ data: input });
      this.logs.info('tarifas.crear', user.id);
      return result;
    } catch (error) { this.throwSiDuplicado(error, 'Ya existe una tarifa para esa municipalidad, período y categoría.'); throw error; }
  }

  async actualizarTarifa(id: number, input: TarifaInput, user: UsuarioAutenticado) {
    const current = await this.db.tarifaPermiso.findUnique({ where: { id } });
    if (!current) throw new AppError(404, 'No se encontró la tarifa.');
    this.validarMunicipalidadEscritura(current.municipalidadId, user);
    this.validarMunicipalidadEscritura(input.municipalidadId, user);
    await this.validarCategoria(input.municipalidadId, input.categoria);
    try {
      const result = await this.db.tarifaPermiso.update({ where: { id }, data: input });
      this.logs.info('tarifas.actualizar', user.id);
      return result;
    } catch (error) { this.throwSiDuplicado(error, 'Ya existe una tarifa para esa municipalidad, período y categoría.'); throw error; }
  }

  async cambiarEstadoTarifa(id: number, activo: boolean, user: UsuarioAutenticado) {
    const row = await this.db.tarifaPermiso.findUnique({ where: { id } });
    if (!row) throw new AppError(404, 'No se encontró la tarifa.');
    this.validarMunicipalidadEscritura(row.municipalidadId, user);
    const result = await this.db.tarifaPermiso.update({ where: { id }, data: { activo } });
    this.logs.info(activo ? 'tarifas.activar' : 'tarifas.desactivar', user.id);
    return result;
  }

  listarCargos(municipalidadId: number | undefined, user: UsuarioAutenticado) {
    const where: Prisma.CargoAdicionalWhereInput = {};
    if (user.rol === 'FUNCIONARIO') where.municipalidadId = this.municipalidadUsuario(user);
    else if (municipalidadId !== undefined) where.municipalidadId = municipalidadId;
    return this.db.cargoAdicional.findMany({ where, include: { municipalidad: { select: { nombre: true } } }, orderBy: [{ municipalidadId: 'asc' }, { vigenciaDesde: 'desc' }, { id: 'asc' }] });
  }

  async crearCargo(input: CargoInput, user: UsuarioAutenticado) {
    this.validarMunicipalidadEscritura(input.municipalidadId, user);
    const result = await this.db.cargoAdicional.create({ data: input });
    this.logs.info('cargos.crear', user.id);
    return result;
  }

  async actualizarCargo(id: number, input: CargoInput, user: UsuarioAutenticado) {
    const current = await this.db.cargoAdicional.findUnique({ where: { id } });
    if (!current) throw new AppError(404, 'No se encontró el cargo.');
    this.validarMunicipalidadEscritura(current.municipalidadId, user);
    this.validarMunicipalidadEscritura(input.municipalidadId, user);
    const result = await this.db.cargoAdicional.update({ where: { id }, data: input });
    this.logs.info('cargos.actualizar', user.id);
    return result;
  }

  async cambiarEstadoCargo(id: number, activo: boolean, user: UsuarioAutenticado) {
    const row = await this.db.cargoAdicional.findUnique({ where: { id } });
    if (!row) throw new AppError(404, 'No se encontró el cargo.');
    this.validarMunicipalidadEscritura(row.municipalidadId, user);
    const result = await this.db.cargoAdicional.update({ where: { id }, data: { activo } });
    this.logs.info(activo ? 'cargos.activar' : 'cargos.desactivar', user.id);
    return result;
  }

  async calcularValorVehiculo(vehiculo: VehiculoCalculo, periodo: number, fecha: Date) {
    const tarifa = await this.db.tarifaPermiso.findFirst({ where: {
      municipalidadId: vehiculo.municipalidadId, periodo, categoria: vehiculo.tipo, activo: true,
    } });
    if (!tarifa) throw new AppError(409, `No hay tarifa configurada para ${vehiculo.tipo} en el período ${periodo}.`);
    const cargos = await this.db.cargoAdicional.findMany({ where: {
      municipalidadId: vehiculo.municipalidadId,
      activo: true,
      vigenciaDesde: { lte: fecha },
      vigenciaHasta: { gte: fecha },
    }, orderBy: { id: 'asc' } });
    const aplicados = cargos.map((cargo) => {
      // Los porcentajes siempre se calculan sobre valorBaseCLP y se redondean al entero CLP más cercano.
      const montoCLP = cargo.tipo === TipoCargo.PORCENTAJE
        ? Math.round((tarifa.valorBaseCLP * cargo.valor) / 100)
        : cargo.valor;
      return { descripcion: cargo.descripcion, naturaleza: cargo.naturaleza, tipo: cargo.tipo, valor: cargo.valor, montoCLP };
    });
    const totalCargosCLP = aplicados.filter((c) => c.naturaleza === NaturalezaCargo.CARGO).reduce((sum, c) => sum + c.montoCLP, 0);
    const totalDescuentosCLP = aplicados.filter((c) => c.naturaleza === NaturalezaCargo.DESCUENTO).reduce((sum, c) => sum + c.montoCLP, 0);
    return {
      vehiculoId: vehiculo.id,
      patente: vehiculo.patente,
      tipo: vehiculo.tipo,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      valorBaseCLP: tarifa.valorBaseCLP,
      cargos: aplicados.filter((c) => c.naturaleza === NaturalezaCargo.CARGO),
      descuentos: aplicados.filter((c) => c.naturaleza === NaturalezaCargo.DESCUENTO),
      totalCargosCLP,
      totalDescuentosCLP,
      totalCLP: Math.max(0, tarifa.valorBaseCLP + totalCargosCLP - totalDescuentosCLP),
    };
  }

  async calcularVistaPrevia(input: { clienteId: number; vehiculoIds: number[]; periodo: number }, user: UsuarioAutenticado) {
    await this.clientes.validarVehiculosDelCliente(input.clienteId, input.vehiculoIds, input.periodo, user.id);
    const vehiculos = await this.db.vehiculo.findMany({ where: { id: { in: input.vehiculoIds }, clienteId: input.clienteId }, select: {
      id: true, patente: true, tipo: true, marca: true, modelo: true, anio: true, municipalidadId: true,
    } });
    const fecha = new Date();
    const detalle = await Promise.all(vehiculos.map((v) => this.calcularValorVehiculo(v, input.periodo, fecha)));
    return { clienteId: input.clienteId, periodo: input.periodo, fechaCalculo: fecha.toISOString(), vehiculos: detalle, totalCLP: detalle.reduce((sum, v) => sum + v.totalCLP, 0) };
  }

  private municipalidadUsuario(user: UsuarioAutenticado): number {
    if (user.municipalidadId === null) throw new AppError(403, 'La cuenta no está asociada a una municipalidad.');
    return user.municipalidadId;
  }
  private validarMunicipalidadEscritura(municipalidadId: number, user: UsuarioAutenticado): void {
    if (user.rol === 'FUNCIONARIO' && municipalidadId !== this.municipalidadUsuario(user)) throw new AppError(403, 'Solo puede administrar valores de su municipalidad.');
  }
  private async validarCategoria(municipalidadId: number, categoria: string): Promise<void> {
    const found = await this.db.vehiculo.findFirst({ where: { municipalidadId, tipo: categoria }, select: { id: true } });
    if (!found) throw new AppError(422, 'La categoría debe coincidir con un tipo de vehículo de la municipalidad.');
  }
  private throwSiDuplicado(error: unknown, mensaje: string): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new AppError(409, mensaje);
  }
}
