import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ComprasApiService } from '../../services/compras-api';
import { CompraApi } from '../../models/compras';
import { AlertService } from '../../services/alert';

@Component({
  selector: 'app-compra', standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './compra.html', styleUrl: './compra.css'
})
export class CompraPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ComprasApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly compra = signal<CompraApi | null>(null);
  readonly cargado = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.obtenerCompra(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (compra) => { this.compra.set(compra); this.cargado.set(true); },
      error: () => this.cargado.set(true),
    });
  }

  clp(monto: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto).replace('CLP', '').trim();
  }
}
