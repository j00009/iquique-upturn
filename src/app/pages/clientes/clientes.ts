import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClientesApiService } from '../../services/clientes-api';
import { AuthService } from '../../services/auth';
import { LoadingService } from '../../services/loading';
import { ClienteApi } from '../../models/api';
import { rutBusquedaValidator } from '../../utils/rut-validator';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class ClientesPage {
  private readonly api = inject(ClientesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  readonly loading = inject(LoadingService);
  readonly clientes = signal<ClienteApi[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 10;
  readonly form = this.fb.nonNullable.group({ q: ['', rutBusquedaValidator] });
  maxPage(): number { return Math.max(1, Math.ceil(this.total() / this.limit)); }

  ngOnInit(): void { this.buscar(); }

  buscar(page = 1): void {
    if (this.form.invalid || this.loading.cargando() > 0) {
      this.form.controls.q.markAsTouched();
      return;
    }
    this.api.buscar(this.form.controls.q.value.trim(), page, this.limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.clientes.set(respuesta.data);
          this.total.set(respuesta.total);
          this.page.set(respuesta.page);
        },
        error: () => undefined,
      });
  }

  cerrarSesion(): void { this.auth.cerrarSesion(); }
}
