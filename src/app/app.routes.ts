import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Busqueda } from './pages/busqueda/busqueda';
import { Detalle } from './pages/detalle/detalle';
import { Formulario } from './pages/formulario/formulario';
import { Pagar } from './pages/pagar/pagar';
import { Comprobante } from './pages/comprobante/comprobante';
import { Historial } from './pages/historial/historial';
import { LoginPage } from './pages/login/login';
import { ClientesPage } from './pages/clientes/clientes';
import { ClienteDetallePage } from './pages/cliente-detalle/cliente-detalle';
import { authGuard } from './guards/auth.guard';
import { CotizacionPage } from './pages/cotizacion/cotizacion';
import { CompraPage } from './pages/compra/compra';

export const routes: Routes = [
  { path: '', component: Inicio, title: 'Inicio' },
  { path: 'busqueda', component: Busqueda, title: 'Buscar permiso' },
  { path: 'permiso/:patente', component: Detalle, title: 'Detalle del permiso' },
  { path: 'permiso/:patente/datos', component: Formulario, title: 'Completar datos' },
  { path: 'pago/:permisoId', component: Pagar, title: 'Pago' },
  { path: 'comprobante/:pagoId', component: Comprobante, title: 'Comprobante' },
  { path: 'historial', component: Historial, title: 'Historial de pagos' },
  { path: 'login', component: LoginPage, title: 'Iniciar sesión' },
  { path: 'clientes', component: ClientesPage, canActivate: [authGuard], title: 'Clientes' },
  { path: 'clientes/:id', component: ClienteDetallePage, canActivate: [authGuard], title: 'Ficha de cliente' },
  { path: 'cotizacion/:id', component: CotizacionPage, canActivate: [authGuard], title: 'Cotización' },
  { path: 'compras/:id', component: CompraPage, canActivate: [authGuard], title: 'Detalle de compra' },
  { path: '**', redirectTo: '' },
];
