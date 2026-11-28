import { Router } from 'express';
import { ComprasController } from '../controllers/compras.controller';
import { authRequired } from '../middlewares/autenticar';
import { PagosController } from '../controllers/pagos.controller';

export function crearRutasCotizaciones(controller: ComprasController): Router {
  const router = Router();
  router.use(authRequired);
  router.post('/', controller.cotizar);
  return router;
}

export function crearRutasCompras(controller: ComprasController, pagos: PagosController): Router {
  const router = Router();
  router.use(authRequired);
  router.post('/:id/cuotas/:numero/pagar', pagos.pagar);
  router.get('/:id/estado', pagos.estado);
  router.post('/', controller.comprar);
  router.get('/:id', controller.obtener);
  return router;
}
