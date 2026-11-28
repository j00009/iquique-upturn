import jwt from 'jsonwebtoken';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { crearApp } from '../app';
import { LogService } from '../services/log.service';

const secret = 'jwt-secret-values-tests-at-least-32-characters';
function auth(rol: 'ADMIN' | 'CLIENTE') {
  return jwt.sign({ id: rol === 'ADMIN' ? 1 : 2, correo: `${rol.toLowerCase()}@muni.cl`, rol, clienteId: rol === 'CLIENTE' ? 1 : null, municipalidadId: 1 }, secret);
}

describe('rutas tarifas y cargos', () => {
  beforeEach(() => { process.env.JWT_SECRET = secret; });

  test('CLIENTE no puede acceder al mantenedor (403)', async () => {
    const db = {} as PrismaClient;
    const app = crearApp({ prisma: db, logs: new LogService() });
    const res = await request(app).get('/tarifas').set('Authorization', `Bearer ${auth('CLIENTE')}`);
    expect(res.status).toBe(403);
  });

  test('ADMIN puede calcular vista previa sin persistir cotización', async () => {
    const db = {
      vehiculo: { findMany: jest.fn()
        .mockResolvedValueOnce([
          { id: 1, patente: 'ABCD12', clienteId: 1, detallesCompra: [] },
          { id: 2, patente: 'EFGH34', clienteId: 1, detallesCompra: [] },
        ])
        .mockResolvedValueOnce([
          { id: 1, patente: 'ABCD12', tipo: 'auto', marca: 'Toyota', modelo: 'Yaris', anio: 2020, municipalidadId: 1 },
          { id: 2, patente: 'EFGH34', tipo: 'moto', marca: 'Honda', modelo: 'CB', anio: 2021, municipalidadId: 1 },
        ]) },
      tarifaPermiso: { findFirst: jest.fn().mockResolvedValue({ valorBaseCLP: 10_000 }) },
      cargoAdicional: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient;
    const app = crearApp({ prisma: db, logs: new LogService() });
    const res = await request(app).post('/tarifas/calcular').set('Authorization', `Bearer ${auth('ADMIN')}`).send({ clienteId: 1, vehiculoIds: [1, 2], periodo: 2026 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ clienteId: 1, periodo: 2026, totalCLP: 20_000, vehiculos: [{ totalCLP: 10_000 }, { totalCLP: 10_000 }] });
    expect(db.tarifaPermiso.findFirst).toHaveBeenCalledTimes(2);
  });
});
