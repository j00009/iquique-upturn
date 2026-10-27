import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Busqueda } from './pages/busqueda/busqueda';
import { Detalle } from './pages/detalle/detalle';
import { Formulario } from './pages/formulario/formulario';
import { Pagar } from './pages/pagar/pagar';
import { Comprobante } from './pages/comprobante/comprobante';
import { Historial } from './pages/historial/historial';

export const routes: Routes = [
  { path: '', component: Inicio, title: 'Inicio' },
  { path: 'busqueda', component: Busqueda, title: 'Buscar permiso' },
  { path: 'permiso/:patente', component: Detalle, title: 'Detalle del permiso' },
  { path: 'permiso/:patente/datos', component: Formulario, title: 'Completar datos' },
  { path: 'pago/:permisoId', component: Pagar, title: 'Pago' },
  { path: 'comprobante/:pagoId', component: Comprobante, title: 'Comprobante' },
  { path: 'historial', component: Historial, title: 'Historial de pagos' },
  { path: '**', redirectTo: '' },
];