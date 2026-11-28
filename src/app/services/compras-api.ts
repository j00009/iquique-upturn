import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { CompraApi, CotizacionApi, ModalidadPago } from '../models/compras';

@Injectable({ providedIn: 'root' })
export class ComprasApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  cotizar(clienteId: number, vehiculoIds: number[], periodo: number) {
    return this.http.post<CotizacionApi>(`${this.base}/cotizaciones`, { clienteId, vehiculoIds, periodo });
  }

  comprar(cotizacionId: number, modalidad: ModalidadPago, idempotencyKey: string) {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<CompraApi>(`${this.base}/compras`, { cotizacionId, modalidad }, { headers });
  }

  obtenerCompra(id: number) {
    return this.http.get<CompraApi>(`${this.base}/compras/${id}`);
  }
}
