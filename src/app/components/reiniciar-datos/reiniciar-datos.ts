import { Component, inject, output } from '@angular/core';
import { Datos } from '../../services/datos';

@Component({
  selector: 'app-reiniciar-datos',
  imports: [],
  templateUrl: './reiniciar-datos.html',
  styleUrl: './reiniciar-datos.css',
})
export class ReiniciarDatos {
  private datos = inject(Datos);
  reiniciado = output<void>();

  reiniciar(): void {
    if (!confirm('Se borrarán los pagos simulados y se restaurarán los datos de prueba originales. ¿Continuar?')) return;
    this.datos.reiniciar();
    this.reiniciado.emit();
  }
}