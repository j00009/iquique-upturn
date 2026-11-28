import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRequired } from '../middlewares/autenticar';

export function crearRutasAuth(controller: AuthController): Router {
  const router = Router();
  router.post('/login', controller.login);
  router.get('/me', authRequired, controller.me);
  return router;
}
