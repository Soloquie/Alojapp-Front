import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface ServicioDTO { id: number; nombre: string; descripcion?: string; }

const FALLBACK_SERVICIOS: ServicioDTO[] = [
  { id: 101, nombre: 'Wi-Fi' },
  { id: 102, nombre: 'Piscina' },
  { id: 103, nombre: 'Cocina' },
  { id: 104, nombre: 'Aire acondicionado' },
  { id: 105, nombre: 'Parqueadero' }
];

export interface ServicioDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  iconoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll$() {
    return this.http.get<any[]>(`${this.base}/servicios`).pipe(
      map(arr => (arr ?? []).map(x => ({
        id: Number(x.id ?? x.codigo ?? 0),
        nombre: String(x.nombre ?? x.titulo ?? 'Servicio')
      } as ServicioDTO))),
      catchError(() => of(FALLBACK_SERVICIOS)),
      shareReplay(1)
    );
  }

    create$(payload: { nombre: string; descripcion?: string; iconoUrl?: string | null }) {
    return this.http.post<ServicioDTO>(`${this.base}/servicios`, payload);
  }
}
