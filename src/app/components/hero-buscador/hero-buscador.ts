import { Component, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero-buscador',
  imports: [ReactiveFormsModule],
  templateUrl: './hero-buscador.html',
  styleUrl: './hero-buscador.css',
})
export class HeroBuscador {
  searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
  });

  /** Emite el texto cada vez que el usuario escribe. */
  buscar = output<string>();

  constructor() {
    // Filtrado en vivo mientras se escribe
    this.searchForm.controls.query.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((valor) => this.buscar.emit(valor));
  }

  /** Submit del buscador: aplica el filtro y baja a la sección de trámites. */
  onBuscarSubmit(): void {
    this.buscar.emit(this.searchForm.controls.query.value);
    document.getElementById('tramites-titulo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}