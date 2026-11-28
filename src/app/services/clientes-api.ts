import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ClienteApi, PaginaClientesApi, VehiculoApi } from '../models/api';

@Injectable({ providedIn: 'root' })
export class ClientesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clientes`;

  buscar(q: string, page: number, limit = 10) {
    const params = new HttpParams().set('q', q).set('page', page).set('limit', limit);
    return this.http.get<PaginaClientesApi>(this.base, { params });
  }
  ficha(id: number) { return this.http.get<ClienteApi>(`${this.base}/${id}`); }
  vehiculos(id: number, periodo = new Date().getFullYear()) {
    return this.http.get<VehiculoApi[]>(`${this.base}/${id}/vehiculos`, { params: { periodo } });
  }
}
