import pino from 'pino';

export type NivelLog = 'info' | 'warning' | 'error';

export interface EventoLog {
  operacion: string;
  fecha_hora: string;
  usuario_id: number | null;
  nivel: NivelLog;
  mensaje?: string;
  stack?: string;
}

/** Emite eventos estructurados sin incluir parámetros, RUT, tokens ni datos personales. */
export class LogService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
    redact: {
      paths: [
        'password', '*.password', 'body.password', 'req.body.password',
        'token', '*.token', 'authorization', '*.authorization',
        'req.headers.authorization', 'headers.authorization',
      ],
      censor: '[REDACTADO]',
    },
  });

  info(operacion: string, usuarioId: number | null, mensaje?: string): void {
    this.escribir('info', operacion, usuarioId, mensaje);
  }

  warning(operacion: string, usuarioId: number | null, mensaje?: string): void {
    this.escribir('warning', operacion, usuarioId, mensaje);
  }

  error(operacion: string, usuarioId: number | null, mensaje?: string, stack?: string): void {
    this.escribir('error', operacion, usuarioId, mensaje, stack);
  }

  private escribir(nivel: NivelLog, operacion: string, usuarioId: number | null, mensaje?: string, stack?: string): void {
    const evento: EventoLog = {
      nivel,
      operacion,
      fecha_hora: new Date().toISOString(),
      usuario_id: usuarioId,
      ...(mensaje ? { mensaje: redactar(mensaje) } : {}),
      ...(stack ? { stack: redactar(stack) } : {}),
    };
    if (nivel === 'error') this.logger.error(evento);
    else if (nivel === 'warning') this.logger.warn(evento);
    else this.logger.info(evento);
  }
}

function redactar(texto: string): string {
  return texto
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [REDACTADO]')
    .replace(/(["']?(?:password|contrase(?:na|ña)|access[_-]?token|refresh[_-]?token|token|authorization|secret|jwt_secret|DATABASE_URL)["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1[REDACTADO]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[CONEXIÓN REDACTADA]');
}
