import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { loginSchema } from '../schemas/auth.schema';
import { LogService } from '../services/log.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

export class AuthController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logs: LogService,
  ) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const datos = loginSchema.safeParse(req.body);
    if (!datos.success) {
      this.logs.warning('auth.login_fallido', null);
      throw new AppError(400, 'Los datos de acceso no son válidos.', datos.error.issues);
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: datos.data.correo },
      select: {
        id: true,
        correo: true,
        hashContrasena: true,
        rol: true,
        clienteId: true,
        municipalidadId: true,
      },
    });

    const contrasenaValida = usuario
      ? await bcrypt.compare(datos.data.password, usuario.hashContrasena)
      : false;
    if (!usuario || !contrasenaValida) {
      this.logs.warning('auth.login_fallido', null);
      throw new AppError(401, 'Credenciales inválidas');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError(500, 'La autenticación no está configurada.');
    const identidad = {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      clienteId: usuario.clienteId,
      municipalidadId: usuario.municipalidadId,
    } satisfies UsuarioAutenticado;
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'];
    const token = jwt.sign(identidad, secret, { expiresIn });

    this.logs.info('auth.login_exitoso', usuario.id);
    res.status(200).json({ token, usuario: identidad });
  };

  me = (req: Request, res: Response): void => {
    if (!req.usuario) throw new AppError(401, 'Se requiere autenticación.');
    res.status(200).json({ usuario: req.usuario });
  };
}
