import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Permisos } from '../../services/permisos';
import { Antecedentes } from '../../models/antecedentes';

@Component({
  selector: 'app-busqueda',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './busqueda.html',
  styleUrl: './busqueda.css',
})
export class Busqueda {
  private permisos = inject(Permisos);

  // Formato chileno: 4 letras + 2 números (KJBH45) o 2 letras + 4 números (CD1234)
  form = new FormGroup({
    patente: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(?:[A-Za-z]{4}\d{2}|[A-Za-z]{2}\d{4})$/)],
    }),
  });

  buscado = signal(false);
  patenteConsultada = signal('');
  resultado = signal<Antecedentes | null>(null);

  patenteInvalida(): boolean {
    const control = this.form.controls.patente;
    return control.invalid && (control.touched || control.dirty);
  }

  buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.buscado.set(false);
      return;
    }
    const patente = this.permisos.normalizarPatente(this.form.controls.patente.value);
    this.patenteConsultada.set(patente);
    this.resultado.set(this.permisos.buscarPorPatente(patente));
    this.buscado.set(true);
  }
}