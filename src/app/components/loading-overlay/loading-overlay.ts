import { Component, inject } from '@angular/core';
import { LoadingService } from '../../services/loading';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  template: `
    @if (loading.cargando() > 0) {
      <div class="loading" role="status" aria-live="polite" aria-label="Cargando; espera a que termine la solicitud" aria-busy="true">
        <span class="loading__rueda" aria-hidden="true"></span><span>Procesando…</span>
      </div>
    }
  `,
  styles: [`
    .loading { position:fixed; inset:0; z-index:110; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.85rem; background:#FAFAF7CC; color:var(--ink); font-weight:700; }
    .loading__rueda { width:2.5rem; height:2.5rem; border:.25rem solid var(--vehicle-soft); border-top-color:var(--vehicle); border-radius:50%; animation:girar .8s linear infinite; }
    @keyframes girar { to { transform:rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .loading__rueda { animation:none; border-color:var(--vehicle); } }
  `],
})
export class LoadingOverlay {
  readonly loading = inject(LoadingService);
}
