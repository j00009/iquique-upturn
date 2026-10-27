import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { Destacado } from '../../models/destacado';

@Component({
  selector: 'app-carrusel',
  imports: [],
  templateUrl: './carrusel.html',
  styleUrl: './carrusel.css',
})
export class Carrusel implements OnInit, OnDestroy {
  destacados: Destacado[] = [
    {
      imagenUrl: 'img/edificio-img-1.png',
      imagenAlt: 'Vista del borde costero de Iquique con el paseo peatonal y el mar de fondo',
      titulo: 'Tierra de Campeones',
      descripcion: 'Tu municipio más cerca, digital y al servicio de la comunidad de Iquique.',
      ctaTexto: 'Conoce tus trámites',
      ctaLink: '#tramites-titulo',
    },
    {
      imagenUrl: 'img/img2-trabajador.png',
      imagenAlt: 'Cámaras de seguridad municipal monitoreando el borde costero',
      titulo: 'Seguridad Ciudadana 1402',
      descripcion: 'Monitoreo permanente y patrullaje preventivo las 24 horas.',
      ctaTexto: 'Llamar ahora',
      ctaLink: 'tel:1402',
    },
    {
      imagenUrl: 'img/9526b4ef2e3216dde727466962e33acf.jpeg',
      imagenAlt: 'Persona pagando un trámite municipal desde su computador',
      titulo: 'Trámite del mes: Permiso de Circulación',
      descripcion: 'Paga en línea, sin filas, con descarga inmediata del duplicado.',
      ctaTexto: 'Pagar en línea',
      ctaLink: '/busqueda',
    },
  ];

  currentIndex = signal(0);
  // Si el usuario pidió "reducir movimiento" en su sistema, el autoplay parte pausado
  autoplayActivo = signal(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  private track = viewChild.required<ElementRef<HTMLElement>>('carruselTrack');
  private temporizador?: ReturnType<typeof setInterval>;
  private esperaScroll?: ReturnType<typeof setTimeout>;
  private readonly INTERVALO_MS = 6000;

  ngOnInit(): void {
    if (this.autoplayActivo()) this.iniciarAutoplay();
  }

  ngOnDestroy(): void {
    this.detenerAutoplay();
    clearTimeout(this.esperaScroll);
  }

  iniciarAutoplay(): void {
    this.detenerAutoplay();
    this.temporizador = setInterval(() => this.desplazar(1), this.INTERVALO_MS);
  }

  detenerAutoplay(): void {
    clearInterval(this.temporizador);
    this.temporizador = undefined;
  }

  toggleAutoplay(): void {
    this.autoplayActivo.update((activo) => !activo);
    if (this.autoplayActivo()) {
      this.iniciarAutoplay();
    } else {
      this.detenerAutoplay();
    }
  }

  /** direccion: 1 = siguiente, -1 = anterior (da la vuelta al llegar al final). */
  desplazar(direccion: number): void {
    const total = this.destacados.length;
    if (total === 0) return;
    this.irA((this.currentIndex() + direccion + total) % total);
  }

  irA(indice: number): void {
    const track = this.track().nativeElement;
    this.currentIndex.set(indice);
    track.scrollTo({ left: indice * track.clientWidth, behavior: 'smooth' });
  }

  /** Sincroniza los puntos cuando el usuario desliza a mano. Espera a que termine el scroll. */
  alScroll(): void {
    clearTimeout(this.esperaScroll);
    this.esperaScroll = setTimeout(() => {
      const track = this.track().nativeElement;
      if (track.clientWidth === 0) return;
      const indice = Math.round(track.scrollLeft / track.clientWidth);
      if (indice !== this.currentIndex()) this.currentIndex.set(indice);
    }, 120);
  }
}