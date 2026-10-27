import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResumenPermiso } from '../../components/resumen-permiso/resumen-permiso';
import { Pagos } from '../../services/pagos';
import { Permisos } from '../../services/permisos';

@Component({
  selector: 'app-detalle',
  imports: [RouterLink, DatePipe, ResumenPermiso],
  templateUrl: './detalle.html',
  styleUrl: './detalle.css',
})
export class Detalle {
  private ruta = inject(ActivatedRoute);
  private permisos = inject(Permisos);
  private pagos = inject(Pagos);

  patente = this.ruta.snapshot.paramMap.get('patente') ?? '';
  antecedentes = this.permisos.buscarPorPatente(this.patente);
  pago = this.antecedentes ? this.pagos.obtenerPorPermiso(this.antecedentes.permiso.id) : undefined;
}