import jwt from 'jsonwebtoken';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { crearApp } from '../app';
import { LogService } from '../services/log.service';

const secreto = 'secreto-de-pruebas-con-32-caracteres-minimo';
const cliente = { id: 1, rut: '12345678-5', nombre: 'María González Rojas', correo: 'maria@example.cl', telefono: '+56912345678', municipalidadId: 1, municipalidad: 'Municipalidad de Iquique', cantidadVehiculos: 3 };

function token(rol = 'ADMIN', clienteId: number | null = null, municipalidadId: number | null = null): string {
  return jwt.sign({ id: 99, correo: 'admin@muni.cl', rol, clienteId, municipalidadId }, secreto, { expiresIn: '5m' });
}

function setup(rows: typeof cliente[] = [cliente]) {
  process.env.JWT_SECRET = secreto;
  const db = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 1 }]),
    cliente: {
      findMany: jest.fn().mockResolvedValue(rows.map((fila) => ({
        id: fila.id,
        rut: fila.rut,
        nombre: fila.nombre,
        correo: fila.correo,
        telefono: fila.telefono,
        municipalidadId: fila.municipalidadId,
        municipalidad: { nombre: fila.municipalidad },
        _count: { vehiculos: fila.cantidadVehiculos },
      }))),
      count: jest.fn().mockResolvedValue(rows.length),
      findFirst: jest.fn().mockResolvedValue({ id: 1, nombre: cliente.nombre, rut: cliente.rut, correo: cliente.correo, telefono: cliente.telefono, municipalidad: { id: 1, nombre: 'Municipalidad de Iquique' }, _count: { vehiculos: 3 } }),
    },
    vehiculo: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as PrismaClient;
  return { app: crearApp({ prisma: db, logs: new LogService() }), db };
}

describe('rutas GET /clientes', () => {
  test.each(['12.345.678-5', '123456785', 'González'])('busca parcialmente por %s', async (q) => {
    const { app } = setup();
    const response = await request(app).get('/clientes').query({ q }).set('Authorization', `Bearer ${token()}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ data: [expect.objectContaining({ id: 1, rut: '12345678-5' })], total: 1, page: 1, limit: 10 });
  });

  test('responde lista vacía cuando no hay coincidencias', async () => {
    const { app } = setup([]);
    const response = await request(app).get('/clientes').query({ q: 'sin coincidencias' }).set('Authorization', `Bearer ${token()}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  test('el cliente autenticado queda limitado a su ficha', async () => {
    const { app, db } = setup();
    const response = await request(app).get('/clientes').set('Authorization', `Bearer ${token('CLIENTE', 1)}`);
    expect(response.status).toBe(200);
    expect(db.cliente.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 1 }),
    }));
  });

  test('GET /clientes/:id/vehiculos devuelve los cuatro estados de permiso', async () => {
    process.env.JWT_SECRET = secreto;
    const estados = ['PENDIENTE_DE_PAGO', 'PARCIALMENTE_PAGADO', 'PAGADO'] as const;
    const db = {
      $queryRaw: jest.fn(),
      cliente: {
        findFirst: jest.fn().mockResolvedValue({
          vehiculos: [
            { id: 1, patente: 'AB1234', tipo: 'auto', marca: 'Toyota', modelo: 'Yaris', anio: 2020, municipalidad: { id: 1, nombre: 'Iquique' }, detallesCompra: [] },
            ...estados.map((estado, index) => ({
              id: index + 2,
              patente: `ABCD${index + 1}0`,
              tipo: 'auto', marca: null, modelo: null, anio: 2020,
              municipalidad: { id: 1, nombre: 'Iquique' },
              detallesCompra: [{ compra: { estado } }],
            })),
          ],
        }),
        findMany: jest.fn(), count: jest.fn(),
      },
      vehiculo: { findMany: jest.fn() },
    } as unknown as PrismaClient;
    const app = crearApp({ prisma: db, logs: new LogService() });
    const response = await request(app).get('/clientes/1/vehiculos?periodo=2026').set('Authorization', `Bearer ${token()}`);
    expect(response.status).toBe(200);
    expect(response.body.map((item: { estadoPermiso: string }) => item.estadoPermiso)).toEqual([
      'sin_permiso', 'pendiente_de_pago', 'parcialmente_pagado', 'pagado',
    ]);
    expect(db.cliente.findFirst).toHaveBeenCalledTimes(1);
  });

  test('rechaza petición sin JWT y limita el máximo de página a 50', async () => {
    const { app } = setup();
    const sinToken = await request(app).get('/clientes');
    expect(sinToken.status).toBe(401);
    expect(sinToken.body).toMatchObject({ codigo: 401, mensaje: expect.any(String), detalle: null });
    const limit = await request(app).get('/clientes?limit=51').set('Authorization', `Bearer ${token()}`);
    expect(limit.status).toBe(400);
  });
});
