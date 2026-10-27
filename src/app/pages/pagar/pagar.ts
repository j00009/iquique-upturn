import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ResumenPermiso } from '../../components/resumen-permiso/resumen-permiso';
import { Pagos } from '../../services/pagos';
import { Permisos } from '../../services/permisos';

@Component({
  selector: 'app-pagar',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, ResumenPermiso],
  templateUrl: './pagar.html',
  styleUrl: './pagar.css',
})
export class Pagar {
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
  private permisos = inject(Permisos);
  private pagos = inject(Pagos);

  permisoId = this.ruta.snapshot.paramMap.get('permisoId') ?? '';
  antecedentes = this.permisos.obtenerPorId(this.permisoId);

  form = new FormGroup({
    confirmo: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  procesando = signal(false);
  errorPago = signal('');

  confirmoInvalido(): boolean {
    const control = this.form.controls.confirmo;
    return control.invalid && control.touched;
  }

  pagar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorPago.set('');
    this.procesando.set(true);

    // Pequeña espera para simular la respuesta de una pasarela de pago
    setTimeout(() => {
      try {
        const pago = this.pagos.registrar(this.permisoId);
        this.router.navigate(['/comprobante', pago.id]);
      } catch (error) {
        this.errorPago.set(error instanceof Error ? error.message : 'No se pudo procesar el pago.');
        this.procesando.set(false);
      }
    }, 900);
  }
}