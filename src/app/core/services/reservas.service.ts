import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Observable, map } from 'rxjs';
import { Reserva } from '../models/reserva.models';

export interface CrearReservaPayload {
  alojamientoId: number;
  fechaCheckin: string;   // yyyy-MM-dd
  fechaCheckout: string;  // yyyy-MM-dd
  numeroHuespedes: number;
  metodoPago?: string;
}

export interface ReservaResponse {
  id: number;
  estado?: string;
  total?: number;
}

export interface ReservaHostRow {
  id: number;
  alojamientoTitulo: string;
  alojamientoCiudad?: string;
  huespedNombre: string;
  fechaCheckin: string;   // ISO
  fechaCheckout: string;  // ISO
  precioTotal: number;
  estado: string;
}
@Injectable({ providedIn: 'root' })
export class ReservasService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  listarMias(): Observable<Reserva[]> {
    return this.http.get<any[]>(`${this.base}/reservas`).pipe(
      map(arr => (arr || []).map(this.mapReserva))
    );
  }

  private mapReserva = (r: any): Reserva => ({
    id: r.id ?? r.reservaId ?? 0,
    estado: r.estado ?? 'PENDIENTE',
      alojamientoId: r.alojamiento?.id
    ?? r.alojamientoId
    ?? r.alojamiento?.alojamientoId
    ?? 0,
    fechaCheckin: r.fechaCheckin ?? r.checkin ?? r.fechaInicio ?? '',
    fechaCheckout: r.fechaCheckout ?? r.checkout ?? r.fechaFin ?? '',
    alojamientoTitulo: r.alojamiento?.titulo ?? r.alojamientoTitulo ?? r.alojamientoNombre ?? 'Alojamiento',
    alojamientoImagen:
      r.alojamiento?.portadaUrl ??
      r.portadaUrl ??
      r.alojamiento?.imagenes?.[0]?.url ??
      null
  });

crearReserva(body: CrearReservaPayload): Observable<ReservaResponse> {
  return this.http.post<ReservaResponse>(`${this.base}/reservas`, body);
}

getReservaCompletadaParaAlojamiento(alojamientoId: number) {
  return this.listarMias().pipe(
    map(reservas =>
      reservas.find(r =>
        r.alojamientoId === alojamientoId 
      ) ?? null
    )
  );
}

 obtenerPorId(id: number): Observable<Reserva> {
    return this.http.get<any>(`${this.base}/reservas/${id}`).pipe(
      map(r => this.mapReserva(r))
    );
  }
  
cancelar(id: number, motivo: string): Observable<string> {
  const body = { motivoCancelacion: motivo || 'Cancelación solicitada por el usuario' };

  return this.http.put(
    `${this.base}/reservas/${id}/cancelar`,
    body,
    { responseType: 'text' }   
  );
}

  private mapReservaHost = (r: any): ReservaHostRow => ({
    id: r.id ?? 0,
    alojamientoTitulo:
      r.alojamientoNombre ??
      r.alojamientoTitulo ??
      r.alojamiento?.titulo ??
      'Alojamiento',
    alojamientoCiudad:
      r.ciudadAlojamiento ??
      r.alojamientoCiudad ??
      r.alojamiento?.ciudad ??
      '',
    huespedNombre: r.huespedNombre ?? r.huesped ?? 'Huésped',
    fechaCheckin: r.fechaCheckin ?? '',
    fechaCheckout: r.fechaCheckout ?? '',
    precioTotal: r.precioTotal ?? r.total ?? 0,
    estado: r.estado ?? 'PENDIENTE'
  });

  listarComoAnfitrion(estado?: string): Observable<ReservaHostRow[]> {
    let url = `${this.base}/reservas/anfitrion`;
    let params = new HttpParams()
      .set('pagina', '0')
      .set('tamano', '100');

    if (estado) {
      url = `${this.base}/reservas/anfitrion/filtrar`;
      params = params.set('estado', estado);
    }

    return this.http.get<any[]>(url, { params }).pipe(
      map(arr => (arr || []).map(this.mapReservaHost))
    );
  }

}
