import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClientesApiService } from '../../services/clientes-api';
import { ComprasApiService } from '../../services/compras-api';
import { AuthService } from '../../services/auth';
import { AlertService } from '../../services/alert';
import { LogService } from '../../services/log';
import { ClienteApi, VehiculoApi } from '../../models/api';

@Component({ selector: 'app-cliente-detalle', standalone: true, imports: [RouterLink], templateUrl: './cliente-detalle.html', styleUrl: './cliente-detalle.css' })
export class ClienteDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ClientesApiService);
  private readonly comprasApi = inject(ComprasApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly logs = inject(LogService);
  readonly cliente = signal<ClienteApi | null>(null);
  readonly vehiculos = signal<VehiculoApi[]>([]);
  readonly seleccionados = signal<number[]>([]);
  readonly cargado = signal(false);
  readonly cotizando = signal(false);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  ngOnInit(): void {
    this.api.ficha(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cliente) => { this.cliente.set(cliente); this.cargarVehiculos(); },
      error: () => this.cargado.set(true),
    });
  }
  private cargarVehiculos(): void {
    this.api.vehiculos(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (vehiculos) => { this.vehiculos.set(vehiculos); this.cargado.set(true); },
      error: () => this.cargado.set(true),
    });
  }
  puedeSeleccionar(v: VehiculoApi): boolean { return v.estadoPermiso === 'sin_permiso'; }
  motivo(v: VehiculoApi): string {
    switch (v.estadoPermiso) {
      case 'pagado': return 'Permiso ya pagado';
      case 'parcialmente_pagado': return 'Compra en curso: pago parcial';
      case 'pendiente_de_pago': return 'Compra en curso: pendiente de pago';
      default: return 'Disponible para cotizar';
    }
  }
  seleccionado(id: number): boolean { return this.seleccionados().includes(id); }
  cambiarSeleccion(id: number, checked: boolean): void {
    this.seleccionados.update((ids) => checked ? [...ids, id] : ids.filter((value) => value !== id));
  }
  cotizar(): void {
    const ids = this.seleccionados();
    if (!ids.length || this.cotizando()) return;
    this.cotizando.set(true);
    this.logs.info('cotizaciones.crear');
    this.comprasApi.cotizar(this.id, ids, new Date().getFullYear()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cotizacion) => void this.router.navigate(['/cotizacion', cotizacion.id], { state: { cotizacion } }),
      error: (error: {status?: number}) => {
        this.cotizando.set(false);
        if (error.status === 409 || error.status === 422) this.alerts.error('No se pudo crear la cotización. Revisa los vehículos seleccionados.');
      },
    });
  }
  cerrarSesion(): void { this.auth.cerrarSesion(); }
}
