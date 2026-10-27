export type EstadoPermiso = 'impago' | 'pagado' | 'incompleto';

export interface Permiso {
  id: string;
  patente: string;
  municipalidad: string;
  anio: number;
  monto: number;
  vigencia: string; // "vigente hasta", fecha ISO
  estado: EstadoPermiso;
}