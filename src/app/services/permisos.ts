import { Injectable, inject } from '@angular/core';
import { Almacenamiento } from './almacenamiento';
import { CLAVES } from '../data/datos-iniciales';
import { Vehiculo } from '../models/vehiculo';
import { Propietario } from '../models/propietario';
import { Permiso } from '../models/permiso';
import { Antecedentes } from '../models/antecedentes';

const VIGENCIA_RENOVADA = '2027-03-31';

@Injectable({ providedIn: 'root' })
export class Permisos {
  private almacenamiento = inject(Almacenamiento);

  /** Deja la patente en mayúsculas y sin espacios, puntos ni guiones. */
  normalizarPatente(valor: string): string {
    return valor.toUpperCase().replace(/[\s.\-]/g, '');
  }

  buscarPorPatente(patente: string): Antecedentes | null {
    const buscada = this.normalizarPatente(patente);
    const permiso = this.leerPermisos().find((p) => p.patente === buscada);
    return permiso ? this.armar(permiso) : null;
  }

  obtenerPorId(id: string): Antecedentes | null {
    const permiso = this.leerPermisos().find((p) => p.id === id);
    return permiso ? this.armar(permiso) : null;
  }

  datosCompletos(propietario: Propietario | null): boolean {
    return !!propietario && !!propietario.nombre && !!propietario.email && !!propietario.telefono;
  }

  /** Actualiza los datos del propietario; si quedan completos, el permiso pasa de "incompleto" a "impago". */
  actualizarPropietario(rut: string, cambios: Partial<Omit<Propietario, 'rut'>>): void {
    const propietarios = this.leerPropietarios().map((p) => (p.rut === rut ? { ...p, ...cambios } : p));
    this.almacenamiento.set(CLAVES.propietarios, propietarios);

    const propietario = propietarios.find((p) => p.rut === rut) ?? null;
    if (!this.datosCompletos(propietario)) return;

    const patentes = this.leerVehiculos().filter((v) => v.propietarioRut === rut).map((v) => v.patente);
    const permisos = this.leerPermisos().map((p) =>
      patentes.includes(p.patente) && p.estado === 'incompleto' ? { ...p, estado: 'impago' as const } : p,
    );
    this.almacenamiento.set(CLAVES.permisos, permisos);
  }

  /** Lo llama el servicio de pagos cuando una transacción se aprueba. */
  marcarPagado(permisoId: string): void {
    const permisos = this.leerPermisos().map((p) =>
      p.id === permisoId ? { ...p, estado: 'pagado' as const, vigencia: VIGENCIA_RENOVADA } : p,
    );
    this.almacenamiento.set(CLAVES.permisos, permisos);
  }

  private armar(permiso: Permiso): Antecedentes | null {
    const vehiculo = this.leerVehiculos().find((v) => v.patente === permiso.patente);
    if (!vehiculo) return null;
    const propietario = this.leerPropietarios().find((p) => p.rut === vehiculo.propietarioRut) ?? null;
    return { vehiculo, propietario, permiso };
  }

  private leerPermisos(): Permiso[] {
    return this.almacenamiento.get<Permiso[]>(CLAVES.permisos, []);
  }
  private leerVehiculos(): Vehiculo[] {
    return this.almacenamiento.get<Vehiculo[]>(CLAVES.vehiculos, []);
  }
  private leerPropietarios(): Propietario[] {
    return this.almacenamiento.get<Propietario[]>(CLAVES.propietarios, []);
  }
}