import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { LogService } from '../services/log.service';

export function crearErrorHandler(logs: LogService): ErrorRequestHandler {
  return (error, req, res, _next) => {
    const appError = error instanceof AppError ? error : null;
    const codigo = appError?.codigo ?? 500;
    const mensaje = appError?.message ?? 'Ocurrió un error interno.';
    const detalle = appError?.detalle ?? null;
    const usuarioId = req.usuario?.id ?? null;

    if (codigo >= 500) {
      const noControlado = !(error instanceof AppError);
      const mensajeError = error instanceof Error ? error.message : String(error ?? mensaje);
      logs.error('request.error', usuarioId, noControlado ? mensajeError : mensaje, noControlado && error instanceof Error ? error.stack : undefined);
    }
    else if (codigo >= 400) logs.warning('request.rechazada', usuarioId, mensaje);

    res.status(codigo).json({ codigo, mensaje, detalle });
  };
}
