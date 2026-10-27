import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReiniciarDatos } from '../../components/reiniciar-datos/reiniciar-datos';
import { Pago } from '../../models/pago';
import { Pagos } from '../../services/pagos';

@Component({
  selector: 'app-historial',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReiniciarDatos],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class Historial {
  private pagos = inject(Pagos);

  listado = signal<Pago[]>(this.pagos.listar());
  total = computed(() => this.listado().reduce((suma, pago) => suma + pago.monto, 0));

  actualizar(): void {
    this.listado.set(this.pagos.listar());
  }
}