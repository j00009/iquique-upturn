import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { PrismaClient } from '@prisma/client';
import { AuthController } from './controllers/auth.controller';
import { ClientesController } from './controllers/clientes.controller';
import { ValoresController } from './controllers/valores.controller';
import { ComprasController } from './controllers/compras.controller';
import { crearErrorHandler } from './middlewares/error-handler';
import { ClientesService } from './services/clientes.service';
import { ValoresService } from './services/valores.service';
import { LogService } from './services/log.service';
import { crearRutasClientes } from './routes/clientes.routes';
import { crearRutasAuth } from './routes/auth.routes';
import { crearRutasCargos, crearRutasTarifas } from './routes/valores.routes';
import { crearRutasCompras, crearRutasCotizaciones } from './routes/compras.routes';
import { ComprasService } from './services/compras.service';
import { PagosController } from './controllers/pagos.controller';
import { PagosService } from './services/pagos.service';
import { prisma } from './db/prisma';

export interface AppDependencies {
  prisma?: PrismaClient;
  logs?: LogService;
}

export function crearApp(dependencias: AppDependencies = {}) {
  const db = dependencias.prisma ?? prisma;
  const logs = dependencias.logs ?? new LogService();
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({
    origin: 'http://localhost:4200',
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));
  app.use(express.json());
  app.get('/health', (_req, res) => res.status(200).json({ estado: 'ok' }));
  app.get('/ping', (req, res) => {
    logs.info('ping', req.usuario?.id ?? null);
    res.status(200).type('text/plain').send('pong');
  });
  app.use('/auth', crearRutasAuth(new AuthController(db, logs)));
  const clientes = new ClientesService(db, logs);
  const valoresService = new ValoresService(db, logs, clientes);
  const valores = new ValoresController(valoresService);
  const compras = new ComprasController(new ComprasService(db, logs, clientes, valoresService));
  const pagos = new PagosController(new PagosService(db, logs));
  app.use('/clientes', crearRutasClientes(new ClientesController(clientes)));
  app.use('/tarifas', crearRutasTarifas(valores));
  app.use('/cargos', crearRutasCargos(valores));
  app.use('/cotizaciones', crearRutasCotizaciones(compras));
  app.use('/compras', crearRutasCompras(compras, pagos));
  app.use(crearErrorHandler(logs));
  return app;
}
