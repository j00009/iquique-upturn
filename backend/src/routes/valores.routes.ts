import { Router } from 'express';
import { ValoresController } from '../controllers/valores.controller';
import { authRequired, requireRole } from '../middlewares/autenticar';

export function crearRutasTarifas(controller: ValoresController): Router {
  const router = Router();
  router.use(authRequired, requireRole('ADMIN', 'FUNCIONARIO'));
  router.post('/calcular', controller.calcular);
  router.get('/', controller.listarTarifas);
  router.post('/', controller.crearTarifa);
  router.put('/:id', controller.actualizarTarifa);
  router.patch('/:id/estado', controller.estadoTarifa);
  return router;
}

export function crearRutasCargos(controller: ValoresController): Router {
  const router = Router();
  router.use(authRequired, requireRole('ADMIN', 'FUNCIONARIO'));
  router.get('/', controller.listarCargos);
  router.post('/', controller.crearCargo);
  router.put('/:id', controller.actualizarCargo);
  router.patch('/:id/estado', controller.estadoCargo);
  return router;
}
