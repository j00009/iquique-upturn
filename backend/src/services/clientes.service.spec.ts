import { EstadoCompra, PrismaClient } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { ClientesService } from './clientes.service';
import { LogService } from './log.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

const admin: UsuarioAutenticado = { id: 99, correo: 'admin@muni.cl', rol: 'ADMIN', clienteId: null, municipalidadId: null };
const usuarioCliente: UsuarioAutenticado = { id: 7, correo: 'cliente@muni.cl', rol: 'CLIENTE', clienteId: 1, municipalidadId: 1 };
const cliente1 = { id: 1, rut: '12345678-5', nombre: 'María González', correo: 'maria@example.cl', telefono: '+56912345678', municipalidadId: 1, municipalidad: 'Municipalidad de Iquique', cantidadVehiculos: 3 };
const clientPrismaRow = {
  id: cliente1.id,
  rut: cliente1.rut,
  nombre: cliente1.nombre,
  correo: cliente1.correo,
  telefono: cliente1.telefono,
  municipalidadId: cliente1.municipalidadId,
  municipalidad: { nombre: cliente1.municipalidad },
  _count: { vehiculos: cliente1.cantidadVehiculos },
};

function setup() {
  const db = {
    $queryRaw: jest.fn(),
    cliente: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
    vehiculo: { findMany: jest.fn() },
  } as unknown as PrismaClient;
  return { db, service: new ClientesService(db, new LogService()) };
}

describe('ClientesService.listar', () => {
  const casos = [
    ['RUT formateado', '12.345.678-5'],
    ['RUT sin separadores', '123456785'],
    ['nombre parcial', 'González'],
    ['sin resultados', 'No existe'],
  ];

  test.each(casos)('busca por %s', async (_nombre, q) => {
    const { db, service } = setup();
    const filas = q === 'No existe' ? [] : [clientPrismaRow];
    (db.$queryRaw as jest.Mock).mockResolvedValue([{ id: 1 }]);
    (db.cliente.findMany as jest.Mock).mockResolvedValue(filas);
    (db.cliente.count as jest.Mock).mockResolvedValue(filas.length);

    const resultado = await service.listar({ q, page: 1, limit: 10 }, admin);
    expect(resultado.data).toEqual(q === 'No existe' ? [] : [cliente1]);
    expect(resultado.total).toBe(filas.length);
    const where = (db.cliente.findMany as jest.Mock).mock.calls[0]?.[0].where;
    const serializado = JSON.stringify(where);
    expect(serializado).toContain('insensitive');
    const fragmentoEsperado = q === '12.345.678-5' || q === '123456785'
      ? '12345678-5'
      : q === 'No existe' ? 'No existe' : 'González';
    expect(serializado).toContain(fragmentoEsperado);
  });
});

describe('ClientesService.listarVehiculos', () => {
  test('calcula estados permiso con una sola consulta de vehículos', async () => {
    const { db, service } = setup();
    (db.cliente.findFirst as jest.Mock).mockResolvedValue({ vehiculos: [
      { id: 1, patente: 'AB1234', tipo: 'auto', marca: 'Toyota', modelo: 'Yaris', anio: 2020, municipalidad: { id: 1, nombre: 'Iquique' }, detallesCompra: [] },
      { id: 2, patente: 'CD1234', tipo: 'moto', marca: null, modelo: null, anio: 2021, municipalidad: { id: 1, nombre: 'Iquique' }, detallesCompra: [{ compra: { estado: EstadoCompra.PENDIENTE_DE_PAGO } }] },
      { id: 3, patente: 'EF1234', tipo: 'auto', marca: 'Kia', modelo: 'Rio', anio: 2022, municipalidad: { id: 1, nombre: 'Iquique' }, detallesCompra: [{ compra: { estado: EstadoCompra.PARCIALMENTE_PAGADO } }] },
      { id: 4, patente: 'GH1234', tipo: 'camioneta', marca: 'Ford', modelo: 'Ranger', anio: 2023, municipalidad: { id: 1, nombre: 'Iquique' }, detallesCompra: [{ compra: { estado: EstadoCompra.PAGADO } }] },
    ] });

    const resultado = await service.listarVehiculos(1, 2026, admin);
    expect(resultado.map(({ estadoPermiso }) => estadoPermiso)).toEqual([
      'sin_permiso', 'pendiente_de_pago', 'parcialmente_pagado', 'pagado',
    ]);
    expect(db.cliente.findFirst).toHaveBeenCalledTimes(1);
    expect(db.cliente.findFirst).toHaveBeenCalledWith(expect.objectContaining({ select: expect.objectContaining({ vehiculos: expect.any(Object) }) }));
  });
});

describe('alcance de ficha por rol', () => {
  test('un cliente recibe 403 si intenta consultar otro cliente', async () => {
    const { db, service } = setup();
    await expect(service.obtenerFicha(2, usuarioCliente)).rejects.toMatchObject({ codigo: 403 });
    expect(db.cliente.findFirst).not.toHaveBeenCalled();
  });
});

describe('ClientesService.validarVehiculosDelCliente', () => {
  test('acepta los vehículos del cliente sin compra activa', async () => {
    const { db, service } = setup();
    (db.vehiculo.findMany as jest.Mock).mockResolvedValue([{ id: 1, patente: 'AB1234', clienteId: 7, detallesCompra: [] }]);
    await expect(service.validarVehiculosDelCliente(7, [1], 2026)).resolves.toBeUndefined();
  });

  test('rechaza vehículos ajenos con 403 y detalle', async () => {
    const { db, service } = setup();
    (db.vehiculo.findMany as jest.Mock).mockResolvedValue([{ id: 1, patente: 'AB1234', clienteId: 8, detallesCompra: [] }]);
    await expect(service.validarVehiculosDelCliente(7, [1], 2026)).rejects.toMatchObject({
      codigo: 403,
      detalle: [{ vehiculoId: 1, motivo: 'no pertenece al cliente' }],
    });
  });

  test('rechaza una compra pagada con motivo específico', async () => {
    const { db, service } = setup();
    (db.vehiculo.findMany as jest.Mock).mockResolvedValue([{ id: 1, patente: 'AB1234', clienteId: 7, detallesCompra: [{ compra: { estado: EstadoCompra.PAGADO } }] }]);
    await expect(service.validarVehiculosDelCliente(7, [1], 2026)).rejects.toMatchObject({
      codigo: 409,
      detalle: [{ vehiculoId: 1, motivo: 'permiso ya pagado' }],
    });
  });

  test('rechaza compra pendiente/en curso y vehículos inexistentes con motivo específico', async () => {
    const { db, service } = setup();
    (db.vehiculo.findMany as jest.Mock).mockResolvedValue([
      { id: 1, patente: 'AB1234', clienteId: 7, detallesCompra: [{ compra: { estado: EstadoCompra.PENDIENTE_DE_PAGO } }] },
    ]);
    await expect(service.validarVehiculosDelCliente(7, [1, 2], 2026)).rejects.toMatchObject({
      codigo: 409,
      detalle: [
        { vehiculoId: 1, motivo: 'compra en curso' },
        { vehiculoId: 2, motivo: 'no existe' },
      ],
    });
  });

  test('rechaza una lista vacía y los ids duplicados antes de consultar', async () => {
    const { db, service } = setup();
    await expect(service.validarVehiculosDelCliente(7, [], 2026)).rejects.toMatchObject({ codigo: 422 });
    await expect(service.validarVehiculosDelCliente(7, [1, 1], 2026)).rejects.toMatchObject({
      codigo: 422,
      detalle: [{ vehiculoId: 1, motivo: 'id duplicado' }],
    });
    expect(db.vehiculo.findMany).not.toHaveBeenCalled();
  });
});
