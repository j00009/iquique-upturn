import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Alerts } from './components/alerts/alerts';
import { LoadingOverlay } from './components/loading-overlay/loading-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Alerts, LoadingOverlay],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
