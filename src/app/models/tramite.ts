export interface Tramite {
  id: string;
  color: 'blue' | 'orange';
  icono: string;
  badgeTexto: string;
  badgeClase: 'blue-badge' | 'gray-badge' | 'orange-badge';
  titulo: string;
  descripcion: string;
  infoIcono: string;
  infoTexto: string;
  infoDestacada: boolean;
  botonTexto: string;
  botonOscuro: boolean;
  ruta?: string; // si existe, el botón navega a esa ruta
}