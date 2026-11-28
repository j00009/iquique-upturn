import { Router } from 'express';
import { ClientesController } from '../controllers/clientes.controller';
import { authRequired, requireRole } from '../middlewares/autenticar';

export function crearRutasClientes(controller: ClientesController): Router {
  const router = Router();
  router.use(authRequired, requireRole('CLIENTE', 'FUNCIONARIO', 'ADMIN'));
  router.get('/', controller.listar);
  router.get('/:id/vehiculos', controller.listarVehiculos);
  router.get('/:id', controller.obtenerFicha);
  return router;
}
