import { Injectable, signal } from '@angular/core';

export type TipoAlerta = 'success' | 'warning' | 'error' | 'info';
export interface Alerta { id: number; tipo: TipoAlerta; mensaje: string }

@Injectable({ providedIn: 'root' })
export class AlertService {
  readonly alertas = signal<Alerta[]>([]);
  private siguienteId = 0;
  success(mensaje: string): void { this.mostrar('success', mensaje); }
  warning(mensaje: string): void { this.mostrar('warning', mensaje); }
  error(mensaje: string): void { this.mostrar('error', mensaje); }
  info(mensaje: string): void { this.mostrar('info', mensaje); }
  quitar(id: number): void { this.alertas.update((lista) => lista.filter((a) => a.id !== id)); }
  private mostrar(tipo: TipoAlerta, mensaje: string): void {
    const id = ++this.siguienteId;
    this.alertas.update((lista) => [...lista, { id, tipo, mensaje }]);
    setTimeout(() => this.quitar(id), 6000);
  }
}
