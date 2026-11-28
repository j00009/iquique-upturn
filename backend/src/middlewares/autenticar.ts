import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from '../errors/app-error';
import type { Rol, UsuarioAutenticado } from '../types/usuario-autenticado';

const payloadSchema = z.object({
  id: z.number().int().positive(),
  correo: z.string().email(),
  rol: z.enum(['CLIENTE', 'FUNCIONARIO', 'ADMIN']),
  clienteId: z.number().int().positive().nullable().optional(),
  municipalidadId: z.number().int().positive().nullable().optional(),
});

export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  const secret = process.env.JWT_SECRET;
  if (!token) return next(new AppError(401, 'Se requiere autenticación.'));
  if (!secret) return next(new AppError(500, 'La autenticación no está configurada.'));

  try {
    const payload = jwt.verify(token, secret);
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) return next(new AppError(401, 'El token no contiene una identidad válida.'));
    req.usuario = {
      id: parsed.data.id,
      correo: parsed.data.correo,
      rol: parsed.data.rol,
      clienteId: parsed.data.clienteId ?? null,
      municipalidadId: parsed.data.municipalidadId ?? null,
    } satisfies UsuarioAutenticado;
    next();
  } catch {
    next(new AppError(401, 'El token es inválido o ha expirado.'));
  }
}

/** Alias conservado para los consumidores existentes del middleware. */
export const autenticar = authRequired;

export function requireRole(...roles: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) return next(new AppError(401, 'Se requiere autenticación.'));
    if (!roles.includes(req.usuario.rol)) return next(new AppError(403, 'No tiene permisos para realizar esta operación.'));
    next();
  };
}
