import { Vehiculo } from './vehiculo';
import { Propietario } from './propietario';
import { Permiso } from './permiso';

export interface Antecedentes {
  vehiculo: Vehiculo;
  propietario: Propietario | null;
  permiso: Permiso;
}