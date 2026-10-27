import { Injectable, inject } from '@angular/core';
import { Almacenamiento } from './almacenamiento';
import {
  CLAVES,
  PAGOS_INICIALES,
  PERMISOS_INICIALES,
  PROPIETARIOS_INICIALES,
  VEHICULOS_INICIALES,
} from '../data/datos-iniciales';

@Injectable({ providedIn: 'root' })
export class Datos {
  private almacenamiento = inject(Almacenamiento);

  /** Carga los datos de prueba solo si todavía no existen. */
  inicializar(): void {
    this.sembrar(CLAVES.vehiculos, VEHICULOS_INICIALES);
    this.sembrar(CLAVES.propietarios, PROPIETARIOS_INICIALES);
    this.sembrar(CLAVES.permisos, PERMISOS_INICIALES);
    this.sembrar(CLAVES.pagos, PAGOS_INICIALES);
  }

  /** Borra todo y vuelve a los datos de prueba originales. */
  reiniciar(): void {
    Object.values(CLAVES).forEach((clave) => this.almacenamiento.remove(clave));
    this.inicializar();
  }

  private sembrar<T>(clave: string, datos: T[]): void {
    if (!this.almacenamiento.existe(clave)) {
      this.almacenamiento.set(clave, datos);
    }
  }
}