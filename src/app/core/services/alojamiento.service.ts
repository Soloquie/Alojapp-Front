import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environments'; // ajusta si tu ruta es distinta

export interface AlojamientoCard {
  id: number;
  titulo: string;
  ciudad?: string;
  pais?: string;
  precioNoche: number | null;
  rating?: number | null;
  portadaUrl?: string | null;
}

export interface AlojamientoDetail {
  id: number;
  titulo: string;
  descripcion?: string;
  ciudad?: string;
  pais?: string;
  precioNoche?: number;
  capacidad?: number;
  // Ajusta a tu DTO real:
  anfitrionId?: number;
  anfitrionNombre?: string;
  anfitrionFotoUrl?: string;
  servicios?: { id: number; nombre: string; descripcion?: string; iconoUrl?: string }[];
}

export interface ImagenDTO { id: number; url: string; descripcion?: string; orden?: number; }
export interface ComentarioDTO {
  id: number; autorNombre: string; calificacion: number; comentario: string; fechaCreacion?: string;
}
export interface StatsComentarios { promedio: number; total: number; }

export interface CrearComentarioPayload {
  reservaId?: number;
  alojamientoId?: number;
  calificacion: number;
  comentarioTexto: string;
}

export interface SearchFilters {
  q?: string;
  ciudad?: string;
  checkin?: string;   // yyyy-MM-dd
  checkout?: string;  // yyyy-MM-dd
  huespedes?: number;
  servicios?: string[];
  minPrecio?: number;
  maxPrecio?: number;
}

@Injectable({ providedIn: 'root' })
export class AlojamientoService {
  private base = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  /** Toma el array desde distintas envolturas comunes: contenido/content/data o arreglo plano */
  private pickArray = (res: any): any[] =>
    Array.isArray(res) ? res : (res?.contenido ?? res?.content ?? res?.data ?? []);

  /** Normaliza las propiedades a la tarjeta que usa el Home */
  private toCard = (it: any): AlojamientoCard => ({
    id: it.id ?? it.alojamientoId ?? 0,
    titulo: it.titulo ?? it.nombre ?? 'Alojamiento',
    ciudad: typeof it.ciudad === 'string' ? it.ciudad : (it.ciudad?.nombre ?? ''),
    pais: it.pais ?? it.ciudad?.pais ?? '',
    precioNoche: it.precioNoche ?? it.precioPorNoche ?? it.precio ?? null,
    rating: it.rating ?? it.calificacion ?? it.calificacionPromedio ?? null,
    portadaUrl:
      it.portadaUrl ??
      it.imagenPrincipalUrl ??
      it.imagenPrincipal ??
      it.imagenPortada ??
      it.coverUrl ??
      it.imagenes?.[0] ??
      null
  });

  /** Populares (ajusta la URL si en tu API es diferente) */
  getPopulares(limit = 12): Observable<AlojamientoCard[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<any>(`${this.base}/alojamientos`, { params }).pipe(
      map(this.pickArray),
      map(arr => arr.map(this.toCard)),
      catchError(() => of([]))
    );
  }

   getById(id: number): Observable<AlojamientoDetail> {
    return this.http.get<AlojamientoDetail>(`${this.base}/alojamientos/${id}`);
  }

  getImagenes(id: number): Observable<ImagenDTO[]> {
    return this.http.get<ImagenDTO[]>(`${this.base}/imagenes/alojamiento/${id}`);
  }

    crearComentario(payload: CrearComentarioPayload) {
    return this.http.post<ComentarioDTO>(`${this.base}/comentarios`, payload);
  }

  getComentariosTop(id: number): Observable<ComentarioDTO[]> {
    return this.http.get<ComentarioDTO[]>(`${this.base}/comentarios/alojamiento/${id}/top`);
  }

  getComentariosStats(id: number): Observable<StatsComentarios> {
    return this.http.get<StatsComentarios>(`${this.base}/comentarios/alojamiento/${id}/stats`);
  }

private toDetalle = (it: any): AlojamientoDetalle => ({
  id: it.id ?? it.alojamientoId ?? 0,
  titulo: it.titulo ?? it.nombre ?? 'Alojamiento',

  latitud: it.latitud ?? it.latitude ?? null,
  longitud: it.longitud ?? it.longitude ?? null,

  descripcion: it.descripcion ?? it.detalle ?? '',
  ciudad: typeof it.ciudad === 'string' ? it.ciudad : (it.ciudad?.nombre ?? ''),
  pais: it.pais ?? it.ciudad?.pais ?? '',

  precioNoche: it.precioNoche ?? it.precioPorNoche ?? it.precio ?? null,
  rating: it.rating ?? it.calificacion ?? it.calificacionPromedio ?? null,
  totalResenas: it.totalResenas ?? it.cantidadResenas ?? it.resenas ?? 0,

  portadaUrl:
    it.portadaUrl ??
    it.imagenPrincipalUrl ??
    it.imagenPortada ??
    it.coverUrl ??
    it.imagenes?.[0] ??
    null,

  imagenes: it.imagenes ?? it.fotos ?? it.galeria ?? [],

  anfitrion: {
    id: it.anfitrion?.id ?? it.hostId,
    nombre: it.anfitrion?.nombre ?? it.hostNombre,
    fotoUrl: it.anfitrion?.fotoUrl ?? it.hostFotoUrl ?? null,
    respuestaRapida: it.anfitrion?.respuestaRapida ?? it.hostRespuestaRapida ?? false
  },

  servicios: Array.isArray(it.servicios)
    ? it.servicios
    : (it.amenities?.map((a: any) => a.nombre) ?? []),

  politicas: it.politicas ?? []
});


  /** Búsqueda con filtros */
  buscar(f: SearchFilters): Observable<AlojamientoCard[]> {
    let params = new HttpParams();
    if (f.q) params = params.set('q', f.q);
    if (f.ciudad) params = params.set('ciudad', f.ciudad);
    if (f.checkin) params = params.set('checkin', f.checkin);
    if (f.checkout) params = params.set('checkout', f.checkout);
    if (f.huespedes) params = params.set('huespedes', String(f.huespedes));
    if (f.servicios?.length) params = params.set('servicios', f.servicios.join(','));
    if (f.minPrecio != null) params = params.set('minPrecio', String(f.minPrecio));
    if (f.maxPrecio != null) params = params.set('maxPrecio', String(f.maxPrecio));

    return this.http.get<any>(`${this.base}/alojamientos`, { params }).pipe(
      map(this.pickArray),
      map(arr => arr.map(this.toCard)),
      catchError(() => of([]))
    );
  }

  getDetalle(id: number): Observable<AlojamientoDetalle> {
  return this.http
    .get<any>(`${this.base}/alojamientos/${id}`)
    .pipe(map(this.toDetalle));
}



}

export interface AlojamientoDetalle {
  id: number;
  titulo: string;

  descripcion?: string;
  ciudad?: string;
  pais?: string;
  longitud?: number;
  latitud?: number;

  precioNoche?: number | null;
  rating?: number | null;
  totalResenas?: number;

  portadaUrl?: string | null;
  imagenes?: string[];           

  anfitrion?: {
    id?: number;
    nombre?: string;
    fotoUrl?: string | null;
    respuestaRapida?: boolean;
  };

  servicios?: string[];           // “Cocina, Wi-Fi, Parqueadero…”
  politicas?: string[];           
}


