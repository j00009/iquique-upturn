import {
  EstadoCompra,
  EstadoCuota,
  ModalidadPago,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { AppError } from '../errors/app-error';
import { ClientesService } from './clientes.service';
import { LogService } from './log.service';
import { ValoresService } from './valores.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

const cotizacionInclude = {
  vehiculos: { orderBy: { id: 'asc' as const } },
} satisfies Prisma.CotizacionInclude;

const compraInclude = {
  detalles: {
    orderBy: { id: 'asc' as const },
    include: { vehiculo: { select: { id: true, patente: true, tipo: true, marca: true, modelo: true, anio: true } }, cargosAplicados: true },
  },
  cuotas: { orderBy: { numero: 'asc' as const } },
} satisfies Prisma.CompraInclude;

type DetalleCotizacion = {
  vehiculoId: number;
  patente: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  anio: number;
  valorBaseCLP: number;
  totalCargosCLP: number;
  totalDescuentosCLP: number;
  totalCLP: number;
  cargos: Prisma.InputJsonValue;
  descuentos: Prisma.InputJsonValue;
};

export class ComprasService {
  constructor(
    private readonly db: PrismaClient,
    private readonly logs: LogService,
    private readonly clientes: ClientesService,
    private readonly valores: ValoresService,
  ) {}

  async crearCotizacion(input: { clienteId: number; vehiculoIds: number[]; periodo: number }, user: UsuarioAutenticado) {
    const cliente = await this.validarAccesoCliente(this.db, input.clienteId, user);
    await this.clientes.validarVehiculosDelCliente(input.clienteId, input.vehiculoIds, input.periodo, user.id);
    const vehiculos = await this.db.vehiculo.findMany({
      where: { id: { in: input.vehiculoIds }, clienteId: input.clienteId },
      select: { id: true, patente: true, tipo: true, marca: true, modelo: true, anio: true, municipalidadId: true },
    });
    const fecha = new Date();
    const calculados = await Promise.all(vehiculos.map((v) => this.valores.calcularValorVehiculo(v, input.periodo, fecha)));
    const porId = new Map(calculados.map((v) => [v.vehiculoId, v]));
    const detalles: DetalleCotizacion[] = input.vehiculoIds.map((vehiculoId) => {
      const v = porId.get(vehiculoId);
      if (!v) throw new AppError(404, 'No se encontró uno de los vehículos de la cotización.');
      return {
        vehiculoId: v.vehiculoId,
        patente: v.patente,
        tipo: v.tipo,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        valorBaseCLP: v.valorBaseCLP,
        totalCargosCLP: v.totalCargosCLP,
        totalDescuentosCLP: v.totalDescuentosCLP,
        totalCLP: v.totalCLP,
        cargos: v.cargos as unknown as Prisma.InputJsonValue,
        descuentos: v.descuentos as unknown as Prisma.InputJsonValue,
      };
    });
    const cotizacion = await this.db.cotizacion.create({
      data: {
        clienteId: input.clienteId,
        municipalidadId: cliente.municipalidadId,
        periodo: input.periodo,
        creadaPorId: user.id,
        expiraEn: new Date(fecha.getTime() + 15 * 60 * 1000),
        vehiculos: { create: detalles },
      },
      include: cotizacionInclude,
    });
    this.logs.info('cotizaciones.crear', user.id);
    return this.serializarCotizacion(cotizacion);
  }

  async crearCompra(cotizacionId: number, modalidad: ModalidadPago, idempotencyKey: string, user: UsuarioAutenticado) {
    try {
      const compra = await this.db.$transaction(async (tx) => {
        const existente = await tx.compra.findUnique({
          where: { creadaPorId_idempotencyKey: { creadaPorId: user.id, idempotencyKey } },
          include: compraInclude,
        });
        if (existente) {
          this.validarAccesoCompra(existente, user);
          return existente;
        }

        const cotizacion = await tx.cotizacion.findUnique({ where: { id: cotizacionId }, include: cotizacionInclude });
        if (!cotizacion) throw new AppError(404, 'No se encontró la cotización.');
        await this.validarAccesoCliente(tx, cotizacion.clienteId, user);
        if (cotizacion.expiraEn <= new Date()) throw new AppError(409, 'La cotización expiró. Solicite una nueva.');
        if (cotizacion.usada) throw new AppError(409, 'La cotización ya fue utilizada.');

        await this.clientes.validarVehiculosDelCliente(
          cotizacion.clienteId,
          cotizacion.vehiculos.map((v) => v.vehiculoId),
          cotizacion.periodo,
          user.id,
          tx,
        );

        // Claim the quote inside this transaction so concurrent requests cannot spend it twice.
        const claim = await tx.cotizacion.updateMany({ where: { id: cotizacion.id, usada: false, expiraEn: { gt: new Date() } }, data: { usada: true } });
        if (claim.count !== 1) throw new AppError(409, 'La cotización expiró o ya fue utilizada.');

        const totalCLP = cotizacion.vehiculos.reduce((sum, row) => sum + row.totalCLP, 0);
        const cuotas = modalidad === ModalidadPago.TOTAL
          ? [{ numero: 1, montoCLP: totalCLP }]
          : [{ numero: 1, montoCLP: Math.floor(totalCLP / 2) }, { numero: 2, montoCLP: totalCLP - Math.floor(totalCLP / 2) }];
        const creada = await tx.compra.create({
          data: {
            clienteId: cotizacion.clienteId,
            municipalidadId: cotizacion.municipalidadId,
            periodo: cotizacion.periodo,
            modalidad,
            estado: EstadoCompra.PENDIENTE_DE_PAGO,
            totalCLP,
            montoPagadoCLP: 0,
            creadaPorId: user.id,
            idempotencyKey,
            detalles: { create: cotizacion.vehiculos.map((row) => ({
              vehiculoId: row.vehiculoId,
              periodo: cotizacion.periodo,
              valorBaseCLP: row.valorBaseCLP,
              totalCargosCLP: row.totalCargosCLP,
              totalDescuentosCLP: row.totalDescuentosCLP,
              totalCLP: row.totalCLP,
              cargosAplicados: {
                create: [...this.leerCargos(row.cargos), ...this.leerCargos(row.descuentos)].map((cargo) => ({
                  descripcion: cargo.descripcion,
                  naturaleza: cargo.naturaleza,
                  tipo: cargo.tipo,
                  valor: cargo.valor,
                  montoCLP: cargo.montoCLP,
                })),
              },
            })) },
            cuotas: { create: cuotas },
          },
          include: compraInclude,
        });
        return creada;
      });
      this.logs.info('compras.crear', user.id);
      return this.serializarCompra(compra);
    } catch (error) {
      if (this.esP2002(error)) {
        const existente = await this.db.compra.findUnique({
          where: { creadaPorId_idempotencyKey: { creadaPorId: user.id, idempotencyKey } },
          include: compraInclude,
        });
        if (existente) {
          this.validarAccesoCompra(existente, user);
          this.logs.info('compras.idempotente', user.id);
          return this.serializarCompra(existente);
        }
        const target = String((error as Prisma.PrismaClientKnownRequestError).meta?.target ?? '');
        if (target.includes('detalle_vehiculo_periodo_activo_uq') || target.includes('vehiculoId') || target.includes('periodo')) {
          throw new AppError(409, 'Uno o más vehículos ya tienen una compra activa para ese período.');
        }
        throw new AppError(409, 'La compra entra en conflicto con un registro existente.');
      }
      throw error;
    }
  }

  async obtenerCompra(id: number, user: UsuarioAutenticado) {
    const compra = await this.db.compra.findUnique({ where: { id }, include: compraInclude });
    if (!compra) throw new AppError(404, 'No se encontró la compra.');
    await this.validarAccesoCliente(this.db, compra.clienteId, user);
    this.logs.info('compras.obtener', user.id);
    return this.serializarCompra(compra);
  }

  private async validarAccesoCliente(db: PrismaClient | Prisma.TransactionClient, clienteId: number, user: UsuarioAutenticado): Promise<{ id: number; municipalidadId: number }> {
    const cliente = await db.cliente.findUnique({ where: { id: clienteId }, select: { id: true, municipalidadId: true } });
    if (!cliente) throw new AppError(404, 'No se encontró el cliente.');
    if (user.rol === 'CLIENTE' && user.clienteId !== cliente.id) throw new AppError(403, 'No tiene permiso para acceder a este cliente.');
    if (user.rol === 'FUNCIONARIO' && user.municipalidadId !== cliente.municipalidadId) throw new AppError(403, 'Solo puede operar con clientes de su municipalidad.');
    return cliente;
  }

  private validarAccesoCompra(compra: { clienteId: number; municipalidadId: number }, user: UsuarioAutenticado) {
    if (user.rol === 'CLIENTE' && user.clienteId !== compra.clienteId) throw new AppError(403, 'No tiene permiso para acceder a esta compra.');
    if (user.rol === 'FUNCIONARIO' && user.municipalidadId !== compra.municipalidadId) throw new AppError(403, 'Solo puede acceder a compras de su municipalidad.');
  }

  private leerCargos(value: Prisma.JsonValue): Array<{ descripcion: string; naturaleza: 'CARGO' | 'DESCUENTO'; tipo: 'MONTO_FIJO' | 'PORCENTAJE'; valor: number; montoCLP: number }> {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Prisma.JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)).map((item) => ({
      descripcion: String(item.descripcion),
      naturaleza: item.naturaleza as 'CARGO' | 'DESCUENTO',
      tipo: item.tipo as 'MONTO_FIJO' | 'PORCENTAJE',
      valor: Number(item.valor),
      montoCLP: Number(item.montoCLP),
    }));
  }

  private serializarCotizacion(cotizacion: Prisma.CotizacionGetPayload<{ include: typeof cotizacionInclude }>) {
    return {
      id: cotizacion.id,
      clienteId: cotizacion.clienteId,
      periodo: cotizacion.periodo,
      creadaEn: cotizacion.creadaEn,
      expiraEn: cotizacion.expiraEn,
      usada: cotizacion.usada,
      vehiculos: cotizacion.vehiculos.map((v) => ({ ...v, cargos: v.cargos, descuentos: v.descuentos })),
      totalCLP: cotizacion.vehiculos.reduce((sum, v) => sum + v.totalCLP, 0),
    };
  }

  private serializarCompra(compra: Prisma.CompraGetPayload<{ include: typeof compraInclude }>) {
    return {
      id: compra.id,
      clienteId: compra.clienteId,
      municipalidadId: compra.municipalidadId,
      periodo: compra.periodo,
      modalidad: compra.modalidad,
      estado: compra.estado,
      totalCLP: compra.totalCLP,
      montoPagadoCLP: compra.montoPagadoCLP,
      saldoCLP: compra.totalCLP - compra.montoPagadoCLP,
      creadaEn: compra.creadaEn,
      vehiculos: compra.detalles.map((d) => ({
        vehiculoId: d.vehiculoId,
        patente: d.vehiculo.patente,
        tipo: d.vehiculo.tipo,
        marca: d.vehiculo.marca,
        modelo: d.vehiculo.modelo,
        anio: d.vehiculo.anio,
        periodo: d.periodo,
        valorBaseCLP: d.valorBaseCLP,
        totalCargosCLP: d.totalCargosCLP,
        totalDescuentosCLP: d.totalDescuentosCLP,
        totalCLP: d.totalCLP,
        cargosAplicados: d.cargosAplicados,
      })),
      cuotas: compra.cuotas,
    };
  }

  private esP2002(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
