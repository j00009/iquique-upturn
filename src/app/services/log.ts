import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LogService {
  info(operacion: string): void {
    console.info({ operacion, fecha_hora: new Date().toISOString() });
  }
  warning(operacion: string): void {
    console.warn({ operacion, fecha_hora: new Date().toISOString() });
  }
  error(operacion: string): void {
    console.error({ operacion, fecha_hora: new Date().toISOString() });
  }
}
