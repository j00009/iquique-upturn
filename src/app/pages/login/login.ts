import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { LoadingService } from '../../services/loading';
import { LogService } from '../../services/log';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly logs = inject(LogService);
  readonly loading = inject(LoadingService);
  readonly mensajeError = signal('');
  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  enviar(): void {
    if (this.form.invalid || this.loading.cargando() > 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.mensajeError.set('');
    const { correo, password } = this.form.getRawValue();
    this.logs.info('login.intento');
    this.auth.login(correo, password).subscribe({
      next: () => {
        this.logs.info('login.exitoso');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/clientes';
        void this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.logs.warning('login.fallido');
        this.mensajeError.set('Correo o contraseña incorrectos');
      },
    });
  }
}
