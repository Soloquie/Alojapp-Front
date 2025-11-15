import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap, catchError } from 'rxjs';
import { environment } from '../../../environments/environments';

export type HostResumen = {
  reservasTotales: number;
  ingresosTotales: number;
  ratingPromedio: number | null;
};

export interface ServicioDTO {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface CrearAlojRequest {
  titulo: string;
  descripcion: string;
  ciudad: string;
  direccion: string;
  latitud?: number | null;
  longitud?: number | null;
  precioNoche: number;
  capacidadMaxima: number;
  serviciosIds?: number[]; 
}

export interface AlojamientoDTO {
  id: number;
  titulo: string;
  ciudad?: string;
  imagenPrincipalUrl?: string;
}

export type AlojCard = {
  id: number;
  titulo: string;
  ciudad?: string;
  pais?: string;
  portadaUrl?: string | null;
  precioNoche?: number | null;
  estado?: string | null;
};

export type ReservaItem = {
  id: number;
  estado?: string | null;
  huesped?: string | null;
  contacto?: string | null;
  fecha?: string | null;
  total?: number | null;
};

type Page<T> = {
  contenido: T[];
  paginaActual: number;
  tamanoPagina: number;
  totalElementos: number;
  totalPaginas: number;
};



@Injectable({ providedIn: 'root' })
export class HostDashboardService {
  listarServicios(): Observable<{ id:number; nombre:string }[]> {
    return this.http.get<{ id:number; nombre:string }[]>(`${this.base}/servicios`);
  }
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Usuario actual
  me(): Observable<any> {
    return this.http.get<any>(`${this.base}/usuarios/me`);
  }

    listar(): Observable<ServicioDTO[]> {
    return this.http.get<ServicioDTO[]>(`${this.base}/servicios`).pipe(
      catchError(() => of([])) 
    );
  }

  // --- Resolver anfitrionId sólo desde /me
getAnfitrionId(): Observable<number | null> {
  return this.http.get<any>(`${this.base}/usuarios/anfitrion/mi-id`).pipe(
    map(r => r?.anfitrionId ?? null),

    catchError(() => this.http.get<any>(`${this.base}/usuarios/me`).pipe(
      switchMap(u => {
        console.log('[ME]', u); 
        const directo = u?.anfitrionId ?? u?.perfilAnfitrionId ?? u?.anfitrion?.id ?? null;
        if (directo) return of(directo);

        const userId = u?.id ?? u?.usuarioId;
        if (!userId) return of(null);

        return this.http.get<any>(`${this.base}/anfitriones/by-usuario/${userId}`).pipe(
          map(r => r?.id ?? r?.anfitrionId ?? null),
          catchError(() =>
            this.http.get<any>(`${this.base}/anfitriones/usuario/${userId}`).pipe(
              map(r => r?.id ?? r?.anfitrionId ?? null),
              catchError(() =>
                this.http.get<any>(`${this.base}/anfitriones/por-usuario/${userId}`).pipe( 
                  map(r => r?.id ?? r?.anfitrionId ?? null),
                  catchError(() => of(null))
                )
              )
            )
          )
        );
      })
    ))
  );
}


  alojamientos(anfitrionId: number, pagina = 0, tamano = 12): Observable<AlojCard[]> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', tamano);

    return this.http
      .get<Page<any>>(`${this.base}/anfitriones/${anfitrionId}/alojamientos`, { params })
      .pipe(
        map(resp => (resp?.contenido ?? []).map(this.mapAloj)),
        catchError(() => of([]))
      );
  }

  reservas(anfitrionId: number, pagina = 0, tamano = 100): Observable<ReservaItem[]> {
    const params = new HttpParams()
      .set('anfitrionId', anfitrionId)
      .set('pagina', pagina)
      .set('tamano', tamano);

    return this.http
      .get<Page<any> | any[]>(`${this.base}/reservas/anfitrion`, { params })
      .pipe(
        map(resp => Array.isArray(resp) ? resp : (resp?.contenido ?? [])),
        map(arr => (arr || []).map(this.mapReserva)),
        catchError(() => of([]))
      );
  }

  // --- Comentarios -> rating promedio (ok)
  comentarios(anfitrionId: number, pagina = 0, tamano = 100): Observable<number | null> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    return this.http
      .get<Page<any> | any[]>(`${this.base}/comentarios/anfitrion/${anfitrionId}`, { params })
      .pipe(
        map(resp => Array.isArray(resp) ? resp : (resp?.contenido ?? [])),
        map(arr => {
          const nums = (arr || [])
            .map(c => Number(c.calificacion ?? c.rating ?? 0))
            .filter(n => n > 0);
          return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        }),
        catchError(() => of(null))
      );
  }

  // --- Carga agregada
  cargarTodo(anfitrionId: number) {
    return forkJoin({
      alojamientos: this.alojamientos(anfitrionId),
      reservas: this.reservas(anfitrionId),
      ratingPromedio: this.comentarios(anfitrionId)
    }).pipe(
      map(({ alojamientos, reservas, ratingPromedio }) => {
        const ingresos = reservas.reduce((acc, r) => {
          const t = Number(r.total ?? (r as any).precioTotal ?? (r as any).monto ?? 0);
          return acc + (isNaN(t) ? 0 : t);
        }, 0);

        const resumen: HostResumen = {
          reservasTotales: reservas.length,
          ingresosTotales: ingresos,
          ratingPromedio
        };

        return { resumen, alojamientos, reservas };
      })
    );
  }

  // -- mapeos seguros
  private mapAloj = (a: any): AlojCard => ({
    id: a.id ?? a.alojamientoId ?? a.codigo ?? 0,
    titulo: a.titulo ?? a.nombre ?? 'Alojamiento',
    ciudad: a.ciudad ?? a.ubicacion?.ciudad ?? undefined,
    pais: a.pais ?? a.ubicacion?.pais ?? undefined,
    portadaUrl: a.portadaUrl ?? a.imagenPrincipalUrl ?? a.imagenPrincipalURL ?? null,
    precioNoche: a.precioNoche ?? a.precio ?? null,
    estado: a.estado ?? a.status ?? null
  });

  private mapReserva = (r: any): ReservaItem => ({
    id: r.id ?? r.reservaId ?? 0,
    estado: r.estado ?? r.status ?? null,
    huesped: r.huesped?.nombre ?? r.cliente?.nombre ?? r.huespedNombre ?? null,
    contacto: r.huesped?.telefono ?? r.cliente?.telefono ?? null,
    fecha: r.fechaCreacion ?? r.fechaInicio ?? r.checkin ?? null,
    total: r.total ?? r.precioTotal ?? null
  });

  crearAlojamiento(anfitrionId: number, body: any, files: File[]): Observable<any> {
  const fd = new FormData();
  fd.append('request', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  files?.forEach((f, i) => fd.append('imagenes', f, f.name || `img_${i}.jpg`));
  return this.http.post(`${this.base}/anfitriones/${anfitrionId}/alojamientos`, fd);
}

    
}
