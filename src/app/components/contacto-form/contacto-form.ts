import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contacto-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contacto-form.html',
  styleUrl: './contacto-form.css',
})
export class ContactoForm {
  contactForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    asunto: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    mensaje: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
  });

  contactEnviado = signal(false);
  contactConError = signal(false);

  campoInvalido(campo: 'nombre' | 'email' | 'asunto' | 'mensaje'): boolean {
    const control = this.contactForm.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

    onContactSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.contactConError.set(true);
      this.contactEnviado.set(false);
      return;
    }

    console.log('Datos del formulario de contacto:', this.contactForm.getRawValue());

    this.contactConError.set(false);
    this.contactEnviado.set(true);
    this.contactForm.reset();

    setTimeout(() => this.contactEnviado.set(false), 5000);
  }
}