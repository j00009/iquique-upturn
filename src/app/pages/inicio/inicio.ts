import { Component, computed, signal } from '@angular/core';
import { Carrusel } from '../../components/carrusel/carrusel';
import { HeroBuscador } from '../../components/hero-buscador/hero-buscador';
import { FeriadoWidget } from '../../components/feriado-widget/feriado-widget';
import { TramiteCard } from '../../components/tramite-card/tramite-card';
import { Seguridad } from '../../components/seguridad/seguridad';
import { FarmaciasTurno } from '../../components/farmacias-turno/farmacias-turno';
import { Noticias } from '../../components/noticias/noticias';
import { PromoApp } from '../../components/promo-app/promo-app';
import { ContactoForm } from '../../components/contacto-form/contacto-form';
import { Tramite } from '../../models/tramite';

@Component({
  selector: 'app-inicio',
  imports: [Carrusel, HeroBuscador, FeriadoWidget, TramiteCard, Seguridad, FarmaciasTurno, Noticias, PromoApp, ContactoForm],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  tramites: Tramite[] = [
    {
      id: 'permiso-circulacion', color: 'blue', icono: 'directions_car',
      badgeTexto: 'Campaña 2025', badgeClase: 'blue-badge',
      titulo: 'Permiso de Circulación',
      descripcion: 'Pago online ágil, consulta de multas no empadronadas, traslado de comuna y descarga inmediata de duplicado oficial.',
      infoIcono: 'bolt', infoTexto: 'Trámite 100% Digital', infoDestacada: true,
      botonTexto: 'Pagar en Línea', botonOscuro: false,
      ruta: '/busqueda',
    },
    {
      id: 'licencia-conducir', color: 'blue', icono: 'badge',
      badgeTexto: 'Cupos Semanales', badgeClase: 'gray-badge',
      titulo: 'Licencia de Conducir',
      descripcion: 'Agendamiento web para primera licencia, control psicotécnico, renovación de todas las clases y duplicados por extravío.',
      infoIcono: 'schedule', infoTexto: 'Edificio Consistorial', infoDestacada: false,
      botonTexto: 'Reservar Hora', botonOscuro: true,
    },
    {
      id: 'aseo-tolvas', color: 'orange', icono: 'delete_sweep',
      badgeTexto: 'Servicio Barrial', badgeClase: 'orange-badge',
      titulo: 'Aseo y Tolvas Comunitarias',
      descripcion: 'Calendarización de cuadrillas, retiro de enseres voluminosos, solicitud de tolvas para juntas vecinales y aseo urbano.',
      infoIcono: 'calendar_today', infoTexto: 'Rutas por cuadrante', infoDestacada: false,
      botonTexto: 'Ver Calendario', botonOscuro: true,
    },
    {
      id: 'patentes', color: 'blue', icono: 'storefront',
      badgeTexto: 'Comercial & PyME', badgeClase: 'blue-badge',
      titulo: 'Patentes Municipales',
      descripcion: 'Pago semestral de patentes comerciales, industriales, profesionales y de alcoholes. Certificados tributarios digitales.',
      infoIcono: 'credit_card', infoTexto: 'Pago con WebPay', infoDestacada: true,
      botonTexto: 'Pagar Patente', botonOscuro: false,
    },
    {
      id: 'dideco', color: 'orange', icono: 'diversity_1',
      badgeTexto: 'Desarrollo Social', badgeClase: 'orange-badge',
      titulo: 'DIDECO y Subsidios Sociales',
      descripcion: 'Actualización de Registro Social de Hogares (RSH), subsidio de agua potable, becas de educación superior y apoyo a familias.',
      infoIcono: 'info', infoTexto: 'Atención presencial/web', infoDestacada: false,
      botonTexto: 'Consultar Ayudas', botonOscuro: true,
    },
    {
      id: 'farmacia-popular', color: 'blue', icono: 'vaccines',
      badgeTexto: 'Salud para Todos', badgeClase: 'blue-badge',
      titulo: 'Farmacia Municipal Popular',
      descripcion: 'Consulta de vademécum de remedios a precio de costo, reserva de medicamentos crónicos y proceso de inscripción vecinal.',
      infoIcono: 'check_circle', infoTexto: 'Ahorro de hasta 70%', infoDestacada: true,
      botonTexto: 'Ver Catálogo', botonOscuro: false,
    },
  ];

  terminoBusqueda = signal('');

  // Filtrado reactivo: se recalcula solo cuando cambia el término
  tramitesFiltrados = computed(() => {
    const termino = this.normalizar(this.terminoBusqueda());
    if (!termino) return this.tramites;
    return this.tramites.filter((t) =>
      this.normalizar(`${t.titulo} ${t.descripcion} ${t.badgeTexto}`).includes(termino),
    );
  });

  /** Quita tildes y mayúsculas para que "tramite" encuentre "Trámite". */
  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}