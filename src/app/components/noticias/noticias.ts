import { Component } from '@angular/core';
import { Noticia } from '../../models/noticia';

@Component({
  selector: 'app-noticias',
  
  templateUrl: './noticias.html',
  styleUrl: './noticias.css',
})
export class Noticias {
    noticias: Noticia[] = [
    {
      imagenUrl: 'img/caletacavancha.jpg',
      imagenAlt: 'Paseo peatonal remodelado en Playa Cavancha con senderos y áreas verdes',
      categoria: 'Obras Públicas',
      fecha: '18 de febrero, 2025',
      titulo: 'Inauguración de obras de remodelación y áreas verdes en Playa Cavancha',
      resumen:
        'El municipio completó la renovación de 14.000 metros cuadrados de senderos peatonales, iluminación LED sustentable con paneles solares y nuevo mobiliario con accesibilidad universal.',
      link: '#',
    },
    {
      imagenUrl: 'img/vacuanaiquiqe.jpg',
      imagenAlt: 'Profesional de salud vacunando a una paciente en un centro CESFAM',
      categoria: 'Salud Municipal',
      fecha: '16 de febrero, 2025',
      titulo: 'Campaña de vacunación comunal e inscripción en Centros de Salud Familiar',
      resumen:
        'Salud Cormudesi habilita puntos móviles en plazas comunitarias y extiende los horarios de atención preventiva en los centros Cirujano Videla, Aguirre y Guzmán.',
      link: '#',
    },
    {
      imagenUrl: 'img/iquiquedeporte.png',
      imagenAlt: 'Concierto nocturno en el borde costero de Iquique durante el festival de verano',
      categoria: 'Cultura y Deporte',
      fecha: '14 de febrero, 2025',
      titulo: 'Festival Cultural Iquique Verano y actividades deportivas en el borde costero',
      resumen:
        'Torneos abiertos de surf, voleibol playa y conciertos de artistas regionales reúnen a miles de familias iquiqueñas en Playa Brava durante todo el mes estival.',
      link: '#',
    },
  ];
}