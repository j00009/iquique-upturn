import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Tramite } from '../../models/tramite';

@Component({
  selector: 'app-tramite-card',
  imports: [],
  templateUrl: './tramite-card.html',
  styleUrl: './tramite-card.css',
})
export class TramiteCard {
  private router = inject(Router);
  tramite = input.required<Tramite>();

  abrir(): void {
    const ruta = this.tramite().ruta;
    if (ruta) this.router.navigateByUrl(ruta);
  }
}