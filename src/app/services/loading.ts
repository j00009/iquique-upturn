import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendientes = signal(0);
  readonly cargando = this.pendientes.asReadonly();
  iniciar(): void { this.pendientes.update((n) => n + 1); }
  terminar(): void { this.pendientes.update((n) => Math.max(0, n - 1)); }
}
