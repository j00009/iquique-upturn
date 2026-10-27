import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Almacenamiento {
  existe(clave: string): boolean {
    return localStorage.getItem(clave) !== null;
  }

  get<T>(clave: string, porDefecto: T): T {
    try {
      const raw = localStorage.getItem(clave);
      return raw ? (JSON.parse(raw) as T) : porDefecto;
    } catch {
      return porDefecto;
    }
  }

  set<T>(clave: string, valor: T): void {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  remove(clave: string): void {
    localStorage.removeItem(clave);
  }
}