import bcrypt from 'bcryptjs';
import request from 'supertest';
import { PrismaClient, RolUsuario } from '@prisma/client';
import { crearApp } from '../app';
import { LogService } from '../services/log.service';

const secreto = 'jwt-secret-test-que-tiene-mas-de-32-caracteres';
const password = 'Clave-Demo-2026';

async function setup(rol: RolUsuario = RolUsuario.ADMIN) {
  process.env.JWT_SECRET = secreto;
  process.env.JWT_EXPIRES_IN = '8h';
  const hashContrasena = await bcrypt.hash(password, 4);
  const usuario = {
    id: 5,
    correo: rol === RolUsuario.CLIENTE ? 'cliente@muni.cl' : 'admin@muni.cl',
    hashContrasena,
    rol,
    clienteId: rol === RolUsuario.CLIENTE ? 1 : null,
    municipalidadId: 1,
  };
  const db = {
    usuario: { findUnique: jest.fn().mockResolvedValue(usuario) },
    cliente: {
      findFirst: jest.fn().mockImplementation(async (args: { select?: { vehiculos?: unknown } }) => args.select?.vehiculos
        ? { vehiculos: [] }
        : {
            id: 2,
            nombre: 'Cliente de prueba',
            rut: '12345678-5',
            correo: 'persona@example.cl',
            telefono: '+56912345678',
            municipalidad: { id: 1, nombre: 'Municipalidad de Iquique' },
            _count: { vehiculos: 2 },
          }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    vehiculo: { findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  } as unknown as PrismaClient;
  return { app: crearApp({ prisma: db, logs: new LogService() }), db };
}

describe('autenticación', () => {
  test('login correcto devuelve JWT y GET /auth/me reconoce el token', async () => {
    const { app } = await setup();
    const login = await request(app).post('/auth/login').send({ correo: 'admin@muni.cl', password });
    expect(login.status).toBe(200);
    expect(login.body).toMatchObject({
      token: expect.any(String),
      usuario: { id: 5, correo: 'admin@muni.cl', rol: 'ADMIN', clienteId: null, municipalidadId: 1 },
    });

    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.usuario).toMatchObject({ id: 5, correo: 'admin@muni.cl', rol: 'ADMIN' });
  });

  test('contraseña incorrecta devuelve 401 con mensaje genérico', async () => {
    const { app } = await setup();
    const response = await request(app).post('/auth/login').send({ correo: 'admin@muni.cl', password: 'incorrecta' });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ codigo: 401, mensaje: 'Credenciales inválidas', detalle: null });
  });

  test('correo inexistente devuelve el mismo error que contraseña incorrecta', async () => {
    const { app, db } = await setup();
    (db.usuario.findUnique as jest.Mock).mockResolvedValue(null);
    const response = await request(app).post('/auth/login').send({ correo: 'noexiste@muni.cl', password });
    expect(response.status).toBe(401);
    expect(response.body.mensaje).toBe('Credenciales inválidas');
  });

  test('ruta de clientes sin token devuelve 401', async () => {
    const { app } = await setup();
    const response = await request(app).get('/clientes/1');
    expect(response.status).toBe(401);
    expect(response.body.codigo).toBe(401);
  });

  test('CLIENTE no puede consultar la ficha de otra persona (403)', async () => {
    const { app } = await setup(RolUsuario.CLIENTE);
    const login = await request(app).post('/auth/login').send({ correo: 'cliente@muni.cl', password });
    const response = await request(app).get('/clientes/2').set('Authorization', `Bearer ${login.body.token}`);
    expect(response.status).toBe(403);
    expect(response.body.codigo).toBe(403);
  });

  test('ADMIN puede consultar fichas de otros clientes (200)', async () => {
    const { app } = await setup();
    const login = await request(app).post('/auth/login').send({ correo: 'admin@muni.cl', password });
    const lista = await request(app).get('/clientes').set('Authorization', `Bearer ${login.body.token}`);
    const response = await request(app).get('/clientes/2').set('Authorization', `Bearer ${login.body.token}`);
    const vehiculos = await request(app).get('/clientes/2/vehiculos?periodo=2026').set('Authorization', `Bearer ${login.body.token}`);
    expect(lista.status).toBe(200);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 2, nombre: 'Cliente de prueba', cantidadVehiculos: 2 });
    expect(vehiculos.status).toBe(200);
  });

  test('GET /ping responde pong y es público', async () => {
    const { app } = await setup();
    const response = await request(app).get('/ping');
    expect(response.status).toBe(200);
    expect(response.text).toBe('pong');
  });
});
