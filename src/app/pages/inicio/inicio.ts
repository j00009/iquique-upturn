import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type Situacion = 'vehicle' | 'business' | 'family';
interface TramiteHome { titulo: string; descripcion: string; dato: string; boton: string; }

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio {
  readonly situacion = signal<Situacion>('vehicle');
  readonly busqueda = signal('');
  readonly feriadoTexto = signal('[Nombre y fecha del próximo feriado, según el calendario nacional]');
  private readonly tramites: Record<Situacion, { titulo: string; color: string; items: TramiteHome[] }> = {
    vehicle: { titulo: 'Trámites para tu vehículo', color: '#1F5FA8', items: [
      { titulo: 'Permiso de circulación', descripcion: 'Paga en línea, consulta multas no empadronadas, solicita traslado de comuna y descarga el duplicado oficial.', dato: 'Se hace 100 % en línea', boton: 'Pagar en línea' },
      { titulo: 'Licencia de conducir', descripcion: 'Agenda tu hora para primera licencia, control psicotécnico, renovación de todas las clases o duplicado por extravío.', dato: 'Atención en el Edificio Consistorial', boton: 'Reservar hora' },
    ] },
    business: { titulo: 'Trámites para tu negocio', color: '#3F7D4E', items: [
      { titulo: 'Patentes municipales', descripcion: 'Pago semestral de patentes comerciales, industriales, profesionales y de alcoholes, y certificados tributarios digitales.', dato: 'Pago con WebPay', boton: 'Pagar patente' },
    ] },
    family: { titulo: 'Trámites para tu familia y tu barrio', color: '#8A5A00', items: [
      { titulo: 'DIDECO y subsidios sociales', descripcion: 'Registro Social de Hogares, subsidio de agua potable, becas de educación superior.', dato: 'Atención presencial/web', boton: 'Consultar ayudas' },
      { titulo: 'Farmacia municipal popular', descripcion: 'Vademécum a precio de costo, reserva de medicamentos crónicos.', dato: 'Ahorro de hasta 70 %', boton: 'Ver catálogo' },
      { titulo: 'Aseo y tolvas comunitarias', descripcion: 'Cuadrillas, retiro de enseres voluminosos, tolvas para juntas vecinales.', dato: 'Rutas por cuadrante', boton: 'Ver calendario' },
    ] },
  };
  readonly panel = computed(() => this.tramites[this.situacion()]);

  iconoTramite(titulo: string): string {
    if (titulo.toLocaleLowerCase('es').includes('licencia')) return 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM5 21v-2a7 7 0 0 1 14 0v2M8 13l4 3 4-3';
    if (titulo.toLocaleLowerCase('es').includes('permiso')) return 'M3 11l1.5-5h15L21 11v7h-2v-2H5v2H3zM5 11h14M7 14h.01M17 14h.01';
    if (titulo.toLocaleLowerCase('es').includes('patente')) return 'M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M10 20v-6h4v6';
    if (titulo.toLocaleLowerCase('es').includes('farmacia')) return 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z';
    if (titulo.toLocaleLowerCase('es').includes('aseo')) return 'M4 20h16M7 16l2-8h6l2 8M10 8V4h4v4M9 12h6';
    return 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z';
  }

  buscar(): void {
    const term = this.busqueda().toLocaleLowerCase('es');
    if (term.includes('patente')) this.situacion.set('business');
    else if (term.includes('subsidio') || term.includes('farmacia') || term.includes('aseo')) this.situacion.set('family');
    else this.situacion.set('vehicle');
    document.getElementById('situaciones')?.scrollIntoView({ behavior: 'smooth' });
  }

  constructor() {
    void this.cargarFeriado();
  }

  private async cargarFeriado(): Promise<void> {
    try {
      const response = await fetch('/data/feriados.json');
      if (!response.ok) return;
      const data = await response.json();
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
      const next = (data?.data ?? []).filter((item: { scope?: string; date: string }) => item.scope !== 'Regional' && item.date >= today).sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))[0];
      if (next) this.feriadoTexto.set(`${next.title}, ${new Date(`${next.date}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', timeZone: 'America/Santiago' })}`);
    } catch { /* El texto de referencia queda disponible si no carga el calendario. */ }
  }
}
