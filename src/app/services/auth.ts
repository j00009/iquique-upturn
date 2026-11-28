import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioSesion } from '../models/api';

interface RespuestaLogin { token: string; usuario: UsuarioSesion }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'muni-iquique.jwt';
  private readonly usuarioActual = signal<UsuarioSesion | null>(null);

  login(correo: string, password: string): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${environment.apiUrl}/auth/login`, { correo, password }).pipe(
      tap((respuesta) => {
        localStorage.setItem(this.tokenKey, respuesta.token);
        this.usuarioActual.set(respuesta.usuario);
      }),
    );
  }

  token(): string | null { return localStorage.getItem(this.tokenKey); }
  usuario(): UsuarioSesion | null { return this.usuarioActual(); }
  autenticado(): boolean { return this.token() !== null; }

  cerrarSesion(redirigir = true): void {
    localStorage.removeItem(this.tokenKey);
    this.usuarioActual.set(null);
    if (redirigir) void this.router.navigate(['/login']);
  }
}
