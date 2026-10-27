export interface Pago {
  id: string;
  permisoId: string;
  fecha: string; // ISO
  patente: string;
  municipalidad: string;
  monto: number;
  estado: 'aprobado' | 'rechazado';
}