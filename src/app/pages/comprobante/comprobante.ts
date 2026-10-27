import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Pagos } from '../../services/pagos';

@Component({
  selector: 'app-comprobante',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './comprobante.html',
  styleUrl: './comprobante.css',
})
export class Comprobante {
  private ruta = inject(ActivatedRoute);
  private pagos = inject(Pagos);

  pagoId = this.ruta.snapshot.paramMap.get('pagoId') ?? '';
  pago = this.pagos.obtener(this.pagoId);

  imprimir(): void {
    window.print();
  }
}