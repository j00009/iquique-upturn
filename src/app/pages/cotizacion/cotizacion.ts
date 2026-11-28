import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComprasApiService } from '../../services/compras-api';
import { CotizacionApi, ModalidadPago } from '../../models/compras';
import { LoadingService } from '../../services/loading';
import { AlertService } from '../../services/alert';
import { LogService } from '../../services/log';

@Component({
  selector: 'app-cotizacion', standalone: true,
  imports: [RouterLink],
  templateUrl: './cotizacion.html', styleUrl: './cotizacion.css'
})
export class CotizacionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ComprasApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly alerts = inject(AlertService);
  private readonly logs = inject(LogService);
  readonly loading = inject(LoadingService);

  readonly cotizacion = signal<CotizacionApi | null>(this.router.getCurrentNavigation()?.extras.state?.['cotizacion'] ?? null);
  readonly modalidad = signal<ModalidadPago>('TOTAL');
  readonly faltan = signal('');
  readonly vencida = signal(false);
  readonly confirmando = signal(false);
  private readonly idempotencyKey = globalThis.crypto.randomUUID();
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const state = history.state as { cotizacion?: CotizacionApi };
    if (state?.cotizacion) this.cotizacion.set(state.cotizacion);
    if (!this.cotizacion()) {
      void this.router.navigate(['/clientes']);
      return;
    }
    this.actualizarTiempo();
    this.timer = setInterval(() => this.actualizarTiempo(), 1000);
    this.destroyRef.onDestroy(() => { if (this.timer) clearInterval(this.timer); });
  }

  seleccionarModalidad(modalidad: ModalidadPago): void { this.modalidad.set(modalidad); }
  primeraCuota(): number { return this.modalidad() === 'DOS_CUOTAS' ? Math.floor((this.cotizacion()?.totalCLP ?? 0) / 2) : this.cotizacion()?.totalCLP ?? 0; }
  segundaCuota(): number { const total = this.cotizacion()?.totalCLP ?? 0; return this.modalidad() === 'DOS_CUOTAS' ? total - Math.floor(total / 2) : 0; }

  confirmar(): void {
    const cotizacion = this.cotizacion();
    if (!cotizacion || this.confirmando() || this.vencida()) return;
    this.confirmando.set(true);
    this.logs.info('compras.confirmar');
    this.api.comprar(cotizacion.id, this.modalidad(), this.idempotencyKey).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (compra) => void this.router.navigate(['/compras', compra.id]),
      error: () => {
        this.confirmando.set(false);
      },
    });
  }

  volverACotizar(): void {
    const cotizacion = this.cotizacion();
    if (cotizacion) void this.router.navigate(['/clientes', cotizacion.clienteId]);
  }

  clp(monto: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto).replace('CLP', '').trim();
  }

  private actualizarTiempo(): void {
    const cotizacion = this.cotizacion();
    if (!cotizacion) return;
    const ms = new Date(cotizacion.expiraEn).getTime() - Date.now();
    this.vencida.set(ms <= 0);
    if (ms <= 0) { this.faltan.set('00:00'); return; }
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    this.faltan.set(`${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`);
  }
}
