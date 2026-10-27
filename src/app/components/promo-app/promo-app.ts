import { Component } from '@angular/core';
import { TiendaApp } from '../../models/tienda-app';

@Component({
  selector: 'app-promo-app',
  imports: [],
  templateUrl: './promo-app.html',
  styleUrl: './promo-app.css',
})
export class PromoApp {
    tiendasApp: TiendaApp[] = [
    {
      icono: 'fa-brands fa-google-play',
      textoSuperior: 'Disponible en',
      textoInferior: 'Google Play',
      url: 'https://play.google.com/store',
    },
    {
      icono: 'fa-brands fa-app-store-ios',
      textoSuperior: 'Disponible en',
      textoInferior: 'App Store',
      url: 'https://apps.apple.com',
    },
    {
      icono: 'fa-solid fa-mobile-screen-button',
      textoSuperior: 'Explóralo en',
      textoInferior: 'AppGallery',
      url: 'https://appgallery.huawei.com',
    },
  ];
}