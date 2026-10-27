import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Antecedentes } from '../../models/antecedentes';

@Component({
  selector: 'app-resumen-permiso',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './resumen-permiso.html',
  styleUrl: './resumen-permiso.css',
})
export class ResumenPermiso {
  antecedentes = input.required<Antecedentes>();
}