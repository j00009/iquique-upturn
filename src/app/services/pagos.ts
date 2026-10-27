import { Injectable, inject } from '@angular/core';
import { Almacenamiento } from './almacenamiento';
import { Permisos } from './permisos';
import { CLAVES } from '../data/datos-iniciales';
import { Pago } from '../models/pago';

@Injectable({ providedIn: 'root' })
export class Pagos {
  private almacenamiento = inject(Almacenamiento);
  private permisos = inject(Permisos);

  /** Pagos realizados, el más reciente primero. */
  listar(): Pago[] {
    return [...this.leer()].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  obtener(id: string): Pago | undefined {
    return this.leer().find((p) => p.id === id);
  }
    /** Pago más reciente asociado a un permiso. */
  obtenerPorPermiso(permisoId: string): Pago | undefined {
    return this.listar().find((p) => p.permisoId === permisoId);
  }

  /** Simula el pago: guarda la transacción y actualiza el estado del permiso. */
  registrar(permisoId: string): Pago {
    const antecedentes = this.permisos.obtenerPorId(permisoId);
    if (!antecedentes) throw new Error('El permiso seleccionado no existe.');

    const { permiso } = antecedentes;
    if (permiso.estado === 'pagado') throw new Error('Este permiso ya se encuentra pagado.');
    if (permiso.estado === 'incompleto') throw new Error('Faltan datos del propietario. Complétalos antes de pagar.');

    const pago: Pago = {
      id: 'CP-' + Date.now().toString(36).toUpperCase(),
      permisoId: permiso.id,
      fecha: new Date().toISOString(),
      patente: permiso.patente,
      municipalidad: permiso.municipalidad,
      monto: permiso.monto,
      estado: 'aprobado',
    };

    this.almacenamiento.set(CLAVES.pagos, [...this.leer(), pago]);
    this.permisos.marcarPagado(permiso.id);
    return pago;
  }

  private leer(): Pago[] {
    return this.almacenamiento.get<Pago[]>(CLAVES.pagos, []);
  }
}
