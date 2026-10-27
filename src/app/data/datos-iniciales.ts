import { Vehiculo } from '../models/vehiculo';
import { Propietario } from '../models/propietario';
import { Permiso } from '../models/permiso';
import { Pago } from '../models/pago';

/** Claves de localStorage. Se usan solo desde los servicios. */
export const CLAVES = {
  vehiculos: 'muni-iquique.vehiculos',
  propietarios: 'muni-iquique.propietarios',
  permisos: 'muni-iquique.permisos',
  pagos: 'muni-iquique.pagos',
} as const;

const MUNICIPALIDAD = 'Municipalidad de Iquique';

export const PROPIETARIOS_INICIALES: Propietario[] = [
  { rut: '12.345.678-5', nombre: 'María González Rojas', email: 'maria.gonzalez@correo.cl', telefono: '+56 9 1234 5678' },
  { rut: '15.432.109-8', nombre: 'Carlos Pizarro Soto', email: 'carlos.pizarro@correo.cl', telefono: '+56 9 2345 6789' },
  { rut: '8.765.432-K', nombre: 'Ana Flores Vega' }, // sin email ni teléfono: datos incompletos
  { rut: '18.222.333-6', nombre: 'Jorge Araya Díaz', email: 'jorge.araya@correo.cl', telefono: '+56 9 3456 7890' },
  { rut: '10.111.222-5', nombre: 'Rosa Muñoz Castro', email: 'rosa.munoz@correo.cl', telefono: '+56 9 4567 8901' },
];

export const VEHICULOS_INICIALES: Vehiculo[] = [
  { patente: 'KJBH45', marca: 'Suzuki', modelo: 'Swift', anio: 2020, tipo: 'Automóvil', propietarioRut: '12.345.678-5' },
  { patente: 'PLMN78', marca: 'Chevrolet', modelo: 'Sail', anio: 2018, tipo: 'Automóvil', propietarioRut: '15.432.109-8' },
  { patente: 'RTYU23', marca: 'Kia', modelo: 'Morning', anio: 2021, tipo: 'Automóvil', propietarioRut: '8.765.432-K' },
  { patente: 'HGFD90', marca: 'Toyota', modelo: 'Hilux', anio: 2022, tipo: 'Camioneta', propietarioRut: '18.222.333-6' },
  { patente: 'CD1234', marca: 'Chevrolet', modelo: 'Spark', anio: 2012, tipo: 'Automóvil', propietarioRut: '10.111.222-5' },
];

export const PERMISOS_INICIALES: Permiso[] = [
  { id: 'PC-2026-KJBH45', patente: 'KJBH45', municipalidad: MUNICIPALIDAD, anio: 2026, monto: 85400, vigencia: '2026-03-31', estado: 'impago' },
  { id: 'PC-2026-PLMN78', patente: 'PLMN78', municipalidad: MUNICIPALIDAD, anio: 2026, monto: 62900, vigencia: '2027-03-31', estado: 'pagado' },
  { id: 'PC-2026-RTYU23', patente: 'RTYU23', municipalidad: MUNICIPALIDAD, anio: 2026, monto: 54300, vigencia: '2026-03-31', estado: 'incompleto' },
  { id: 'PC-2026-HGFD90', patente: 'HGFD90', municipalidad: MUNICIPALIDAD, anio: 2026, monto: 148700, vigencia: '2026-03-31', estado: 'impago' },
  { id: 'PC-2026-CD1234', patente: 'CD1234', municipalidad: MUNICIPALIDAD, anio: 2026, monto: 38200, vigencia: '2026-03-31', estado: 'impago' },
];

export const PAGOS_INICIALES: Pago[] = [
  {
    id: 'CP-SEED0001',
    permisoId: 'PC-2026-PLMN78',
    fecha: '2026-03-12T15:30:00.000Z',
    patente: 'PLMN78',
    municipalidad: MUNICIPALIDAD,
    monto: 62900,
    estado: 'aprobado',
  },
];