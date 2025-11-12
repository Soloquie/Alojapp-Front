import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface CrearReservaPayload {
  alojamientoId: number;
  fechaInicio: string;   // yyyy-MM-dd
  fechaFin: string;      // yyyy-MM-dd
  huespedes?: number;
  precioNoche?: number;
  noches: number;
  total: number;
}

export interface ReservaResponse {
  id: number;
  estado?: string;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private base = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  crearReserva(body: CrearReservaPayload): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(`${this.base}/reservas`, body);
  }
}
