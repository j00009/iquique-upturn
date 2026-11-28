import { Prisma, PrismaClient, EstadoCompra } from '@prisma/client';
import { AppError } from '../errors/app-error';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';
import { normalizarRutBusqueda } from '../utils/rut';
import { LogService } from './log.service';

export interface PaginacionClientes {
  data: Array<{
    id: number;
    rut: string;
    nombre: string;
    correo: string | null;
    telefono: string | null;
    municipalidadId: number;
    municipalidad: string;
    cantidadVehiculos: number;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface VehiculoCliente {
  id: number;
  patente: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  anio: number;
  municipalidad: { id: number; nombre: string };
  estadoPermiso: 'sin_permiso' | 'pendiente_de_pago' | 'parcialmente_pagado' | 'pagado';
}

export interface DetalleNoElegible {
  vehiculoId: number;
  patente?: string;
  motivo: 'no pertenece al cliente' | 'permiso ya pagado' | 'compra en curso' | 'no existe';
}

export class ClientesService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logs: LogService,
  ) {}

  async listar(
    query: { q: string; page: number; limit: number },
    usuario: UsuarioAutenticado,
  ): Promise<PaginacionClientes> {
    this.logs.info('clientes.listar', usuario.id);
    const { q, page, limit } = query;
    const alcance: Prisma.ClienteWhereInput = {};
    if (usuario.rol === 'CLIENTE') {
      if (usuario.clienteId === null) throw new AppError(403, 'La cuenta no está asociada a un cliente.');
      alcance.id = usuario.clienteId;
    } else if (usuario.rol === 'FUNCIONARIO') {
      if (usuario.municipalidadId === null) throw new AppError(403, 'La cuenta no está asociada a una municipalidad.');
      alcance.municipalidadId = usuario.municipalidadId;
    }

    let where: Prisma.ClienteWhereInput = alcance;
    if (q) {
      const rut = normalizarRutBusqueda(q);
      const ids: number[] = /^\d+$/.test(q)
        ? (await this.buscarIdsParciales(q, usuario)).map(({ id }) => id)
        : [];
      where = {
        AND: [
          alcance,
          {
            OR: [
              { rut: { contains: rut.canonico, mode: 'insensitive' } },
              { rut: { contains: rut.compacto, mode: 'insensitive' } },
              { nombre: { contains: q, mode: 'insensitive' } },
              { id: { in: ids } },
            ],
          },
        ],
      };
    }

    const offset = (page - 1) * limit;
    const [filas, conteo] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        select: {
          id: true,
          rut: true,
          nombre: true,
          correo: true,
          telefono: true,
          municipalidadId: true,
          municipalidad: { select: { nombre: true } },
          _count: { select: { vehiculos: true } },
        },
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return {
      data: filas.map((fila) => ({
        id: fila.id,
        rut: fila.rut,
        nombre: fila.nombre,
        correo: fila.correo,
        telefono: fila.telefono,
        municipalidadId: fila.municipalidadId,
        municipalidad: fila.municipalidad.nombre,
        cantidadVehiculos: fila._count.vehiculos,
      })),
      total: conteo,
      page,
      limit,
    };
  }

  private async buscarIdsParciales(q: string, usuario: UsuarioAutenticado): Promise<Array<{ id: number }>> {
    const alcance: Prisma.Sql[] = [];
    if (usuario.rol === 'CLIENTE') {
      if (usuario.clienteId === null) throw new AppError(403, 'La cuenta no está asociada a un cliente.');
      alcance.push(Prisma.sql`c."id" = ${usuario.clienteId}`);
    } else if (usuario.rol === 'FUNCIONARIO') {
      if (usuario.municipalidadId === null) throw new AppError(403, 'La cuenta no está asociada a una municipalidad.');
      alcance.push(Prisma.sql`c."municipalidadId" = ${usuario.municipalidadId}`);
    }
    alcance.push(Prisma.sql`c."id"::text ILIKE ${`%${q}%`}`);
    return this.prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
      SELECT c."id" FROM "Cliente" c
      WHERE ${Prisma.join(alcance, ' AND ')}
    `);
  }

  async obtenerFicha(id: number, usuario: UsuarioAutenticado) {
    this.logs.info('clientes.obtener_ficha', usuario.id);
    const where: Prisma.ClienteWhereInput = { id };
    this.aplicarAlcance(where, usuario);
    const cliente = await this.prisma.cliente.findFirst({
      where,
      select: {
        id: true,
        nombre: true,
        rut: true,
        correo: true,
        telefono: true,
        municipalidad: { select: { id: true, nombre: true } },
        _count: { select: { vehiculos: true } },
      },
    });
    if (!cliente) throw new AppError(404, 'No se encontró el cliente.');
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      rut: cliente.rut,
      correo: cliente.correo,
      telefono: cliente.telefono,
      municipalidad: cliente.municipalidad,
      cantidadVehiculos: cliente._count.vehiculos,
    };
  }

  async listarVehiculos(id: number, periodo: number, usuario: UsuarioAutenticado): Promise<VehiculoCliente[]> {
    this.logs.info('clientes.listar_vehiculos', usuario.id);
    const alcance: Prisma.ClienteWhereInput = { id };
    this.aplicarAlcance(alcance, usuario);
    const cliente = await this.prisma.cliente.findFirst({
      where: alcance,
      select: {
        vehiculos: {
          orderBy: [{ patente: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            patente: true,
            tipo: true,
            marca: true,
            modelo: true,
            anio: true,
            municipalidad: { select: { id: true, nombre: true } },
            detallesCompra: {
              where: {
                periodo,
                activo: true,
                compra: { is: { estado: { not: EstadoCompra.ANULADO } } },
              },
              select: { compra: { select: { estado: true } } },
            },
          },
        },
      },
    });
    if (!cliente) throw new AppError(404, 'No se encontró el cliente.');

    return cliente.vehiculos.map((vehiculo) => ({
      id: vehiculo.id,
      patente: vehiculo.patente,
      tipo: vehiculo.tipo,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      municipalidad: vehiculo.municipalidad,
      estadoPermiso: estadoPermiso(vehiculo.detallesCompra[0]?.compra.estado),
    }));
  }

  async validarVehiculosDelCliente(
    clienteId: number,
    vehiculoIds: number[],
    periodo: number,
    usuarioId: number | null = null,
    db: PrismaClient | Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    this.logs.info('clientes.validar_vehiculos_elegibles', usuarioId);
    if (vehiculoIds.length === 0) {
      throw new AppError(422, 'Debe indicar al menos un vehículo.', [{ motivo: 'lista vacía' }]);
    }
    const repetidos = vehiculoIds.filter((id, index) => vehiculoIds.indexOf(id) !== index);
    if (repetidos.length) {
      throw new AppError(422, 'La lista contiene vehículos repetidos.', [...new Set(repetidos)].map((vehiculoId) => ({ vehiculoId, motivo: 'id duplicado' })));
    }

    const vehiculos = await db.vehiculo.findMany({
      where: { id: { in: vehiculoIds } },
      select: {
        id: true,
        patente: true,
        clienteId: true,
        detallesCompra: {
          where: {
            periodo,
            activo: true,
            compra: { is: { estado: { not: EstadoCompra.ANULADO } } },
          },
          select: { compra: { select: { estado: true } } },
        },
      },
    });
    const porId = new Map(vehiculos.map((vehiculo) => [vehiculo.id, vehiculo]));
    const noElegibles: DetalleNoElegible[] = [];

    for (const vehiculoId of vehiculoIds) {
      const vehiculo = porId.get(vehiculoId);
      if (!vehiculo) {
        noElegibles.push({ vehiculoId, motivo: 'no existe' });
        continue;
      }
      if (vehiculo.clienteId !== clienteId) {
        noElegibles.push({ vehiculoId, patente: vehiculo.patente, motivo: 'no pertenece al cliente' });
        continue;
      }
      const compra = vehiculo.detallesCompra[0]?.compra;
      if (compra) {
        noElegibles.push({
          vehiculoId,
          patente: vehiculo.patente,
          motivo: compra.estado === EstadoCompra.PAGADO ? 'permiso ya pagado' : 'compra en curso',
        });
      }
    }

    if (noElegibles.length) {
      const hayVehiculoAjeno = noElegibles.some((detalle) => detalle.motivo === 'no pertenece al cliente');
      const codigo = hayVehiculoAjeno ? 403 : 409;
      const mensaje = hayVehiculoAjeno
        ? 'Uno o más vehículos no pertenecen al cliente.'
        : 'Uno o más vehículos no están disponibles para la compra.';
      throw new AppError(codigo, mensaje, noElegibles);
    }
  }

  private aplicarAlcance(where: Prisma.ClienteWhereInput, usuario: UsuarioAutenticado): void {
    if (usuario.rol === 'CLIENTE') {
      if (usuario.clienteId === null) throw new AppError(403, 'La cuenta no está asociada a un cliente.');
      if (where.id !== undefined && where.id !== usuario.clienteId) {
        throw new AppError(403, 'No tiene permiso para consultar este cliente.');
      }
      where.id = usuario.clienteId;
    } else if (usuario.rol === 'FUNCIONARIO') {
      if (usuario.municipalidadId === null) throw new AppError(403, 'La cuenta no está asociada a una municipalidad.');
      where.municipalidadId = usuario.municipalidadId;
    }
  }
}

function estadoPermiso(estado?: EstadoCompra): VehiculoCliente['estadoPermiso'] {
  if (!estado || estado === EstadoCompra.ANULADO) return 'sin_permiso';
  if (estado === EstadoCompra.PAGADO) return 'pagado';
  if (estado === EstadoCompra.PARCIALMENTE_PAGADO) return 'parcialmente_pagado';
  return 'pendiente_de_pago';
}
