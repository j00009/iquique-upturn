import { Component, inject } from '@angular/core';
import { AlertService } from '../../services/alert';

@Component({
  selector: 'app-alerts',
  standalone: true,
  template: `
    <section class="alertas" aria-label="Notificaciones" aria-live="polite">
      @for (alerta of alerts.alertas(); track alerta.id) {
        <div class="alerta" [class]="'alerta alerta--' + alerta.tipo" role="status">
          <span>{{ alerta.mensaje }}</span>
          <button type="button" [attr.aria-label]="'Cerrar aviso: ' + alerta.mensaje" (click)="alerts.quitar(alerta.id)">×</button>
        </div>
      }
    </section>
  `,
  styles: [`
    .alertas { position: fixed; z-index: 120; inset: 1rem 1rem auto auto; display: grid; gap: .65rem; width: min(26rem, calc(100vw - 2rem)); }
    .alerta { display:flex; align-items:start; justify-content:space-between; gap:1rem; padding:.85rem 1rem; border:1px solid var(--line); border-radius:var(--radio-md); box-shadow:0 4px 18px #1A233022; font-size:var(--texto-base); background:var(--white); }
    .alerta--success { background:#E3F0E7; border-color:#3F7D4E; }
    .alerta--warning { background:#F7EBD3; border-color:#8A5A00; }
    .alerta--error { background:#F6E2DD; border-color:#B8422B; }
    .alerta--info { background:#E4EDF8; border-color:#1F5FA8; }
    button { border:0; background:transparent; color:inherit; font:inherit; font-size:1.35rem; line-height:1; cursor:pointer; }
  `],
})
export class Alerts {
  readonly alerts = inject(AlertService);
}
