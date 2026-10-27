import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Permisos } from '../../services/permisos';

type CampoPropietario = 'nombre' | 'email' | 'telefono';

@Component({
  selector: 'app-formulario',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css',
})
export class Formulario {
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
  private permisos = inject(Permisos);

  patente = this.ruta.snapshot.paramMap.get('patente') ?? '';
  antecedentes = this.permisos.buscarPorPatente(this.patente);

  // Celular chileno: 9 1234 5678, con o sin +56 y con o sin espacios
  form = new FormGroup({
    nombre: new FormControl(this.antecedentes?.propietario?.nombre ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl(this.antecedentes?.propietario?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    telefono: new FormControl(this.antecedentes?.propietario?.telefono ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(\+?56\s?)?9\s?\d{4}\s?\d{4}$/)],
    }),
  });

  mensajeError(campo: CampoPropietario): string | null {
    const control = this.form.controls[campo];
    if (!(control.invalid && (control.touched || control.dirty))) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    switch (campo) {
      case 'nombre':
        return 'Ingresa al menos 3 caracteres.';
      case 'email':
        return 'Ingresa un correo válido, por ejemplo nombre@correo.cl.';
      case 'telefono':
        return 'Ingresa un celular chileno válido, por ejemplo +56 9 1234 5678.';
    }
  }

  guardar(): void {
    if (this.form.invalid || !this.antecedentes) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, email, telefono } = this.form.getRawValue();
    this.permisos.actualizarPropietario(this.antecedentes.vehiculo.propietarioRut, {
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
    });

    // Con los datos completos, el permiso pasa a "impago" y se puede ir directo a pagar
    const actualizado = this.permisos.buscarPorPatente(this.patente);
    if (actualizado?.permiso.estado === 'impago') {
      this.router.navigate(['/pago', actualizado.permiso.id]);
    } else {
      this.router.navigate(['/permiso', this.patente]);
    }
  }
}