import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';

interface Feriado {
  nombre: string;
  fecha: string;
}

interface FeriadoApi {
  title: string;
  date: string;
  scope?: string;
}

@Component({
  selector: 'app-feriado-widget',
  imports: [DatePipe],
  templateUrl: './feriado-widget.html',
  styleUrl: './feriado-widget.css',
})
export class FeriadoWidget implements OnInit {
  cargandoFeriado = signal(true);
  errorFeriado = signal(false);
  proximoFeriado = signal<Feriado | null>(null);

  ngOnInit(): void {
    this.obtenerProximoFeriado();
  }

  /** Carga el próximo feriado nacional desde el JSON estático publicado en /data. */
  async obtenerProximoFeriado(): Promise<void> {
    this.cargandoFeriado.set(true);
    this.errorFeriado.set(false);

    try {
          const respuesta = await fetch('/data/feriados.json');
      if (!respuesta.ok) {
        throw new Error(`No se pudo consultar la API de feriados (${respuesta.status})`);
      }

      const data = await respuesta.json();
      const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

      const proximos: Feriado[] = (data?.data ?? [])
        .filter((f: FeriadoApi) => f.scope !== 'Regional')
        .map((f: FeriadoApi) => ({ nombre: f.title, fecha: f.date }))
        .filter((f: Feriado) => f.fecha >= hoy)
        .sort((a: Feriado, b: Feriado) => a.fecha.localeCompare(b.fecha));

      this.proximoFeriado.set(proximos[0] ?? null);
    } catch (error) {
      console.error('Error al cargar el archivo de feriados:', error);
      this.errorFeriado.set(true);
      this.proximoFeriado.set(null);
    } finally {
      this.cargandoFeriado.set(false);
    }
  }
}