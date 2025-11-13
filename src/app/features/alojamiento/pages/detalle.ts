import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import * as L from 'leaflet';

import {
  AlojamientoService,
  AlojamientoDetalle as AlojamientoDTO
} from '../../../core/services/alojamiento.service';

import { ReservasService } from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs/operators';
import { Observable } from 'rxjs';

type ComentarioVM = {
  id: number;
  autor: string;
  avatarUrl?: string | null;
  calificacion: number; // 0..5
  texto: string;
  fecha?: string | Date;
};

type HostVM = {
  id?: number;
  nombre?: string;
  avatarUrl?: string | null;
  respuestaRapida?: boolean;
};



type AlojamientoVM = AlojamientoDTO & {
  imagenPrincipalUrl?: string | null;
  portadaUrl?: string | null;
  imagenes?: string[];
  host?: HostVM;
  servicios?: string[];
  comentarios?: ComentarioVM[];
  longitud?: number | null;
  latitud?: number | null;
  calificacionPromedio?: number | null;
  cantidadComentarios?: number | null;
};

@Component({
  selector: 'app-detalle-alojamiento',
  templateUrl: './detalle.html',
  styleUrls: ['./detalle.scss'],
  standalone: false
})
export class DetalleAlojamientoComponent implements OnInit, AfterViewInit  {
  private readonly route = inject(ActivatedRoute);

loggedIn$!: Observable<boolean>;
  
@ViewChild('mapElement') mapElement?: ElementRef<HTMLDivElement>;

private map?: L.Map;
private marker?: L.Marker;
private mapPendingInit = false;

  estrellas = [1, 2, 3, 4, 5];
  nuevaCalificacion = 0;
  nuevoComentario = '';
  enviandoComentario = false;
  errorComentario?: string;
  exitoComentario?: string;


ngAfterViewInit(): void {
  // Si el alojamiento ya está cargado cuando se pinta la vista, inicializamos aquí
  if (this.aloj && this.mapElement) {
    this.initMap();
  }
}

private tryInitMap(): void {
  // Solo queremos inicializar si se ha pedido
  if (!this.mapPendingInit) return;
  if (!this.aloj) return;
  if (this.aloj.latitud == null || this.aloj.longitud == null) return;
  if (!this.mapElement) return;

  // ya tenemos todo
  this.mapPendingInit = false;
  this.initMap();
}

private initMap(): void {
  if (!this.mapElement || !this.aloj) return;

  const lat = this.aloj?.latitud ?? 4.53389;   // default Armenia
  const lng = this.aloj?.longitud ?? -75.68111;

  if (!this.map) {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [lat, lng],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng]).addTo(this.map);
  } else {
    this.map.setView([lat, lng], this.map.getZoom());
    this.marker?.setLatLng([lat, lng]);
  }

  // Muy importante para evitar el mapa “recortado”
  setTimeout(() => {
    this.map?.invalidateSize();
  }, 200);

  this.tryInitMap();

}


  constructor(
    private alojSrv: AlojamientoService,
    private reservasSrv: ReservasService,
    private auth: AuthService,
    private router: Router,
    private location: Location
  ) {}
  readonly Math = Math;

  cargando = true;
  reservando = false;
  error?: string;
  errorReserva?: string;

  aloj: AlojamientoVM | null = null;

  // Reserva
  checkin = '';
  checkout = '';
  huespedes?: number;
  readonly feeLimpieza = 25;
  readonly feePlataforma = 15;

  // Fees (ajústalos si tu backend los calcula distinto)
  cleaningFee = 25;
  platformFee = 15;

  /** Noches calculadas a partir de checkin/checkout */
  get noches(): number {
    const inD = this.checkin ? new Date(this.checkin) : null;
    const outD = this.checkout ? new Date(this.checkout) : null;
    if (!inD || !outD) return 0;
    const ms = outD.getTime() - inD.getTime();
    return ms > 0 ? Math.ceil(ms / 86400000) : 0;
  }
  get subtotal(): number {
    const pn = this.aloj?.precioNoche ?? 0;
    return this.noches * pn;
  }
  get total(): number {
    return this.subtotal + this.cleaningFee + this.platformFee;
  }
  recalc(): void {/* Getters se recalculan solos; esto sólo triggea change detection */}

  ngOnInit(): void {
    this.loggedIn$ = this.auth.loggedIn$;
    this.route.paramMap.subscribe(pm => {
      const id = Number(pm.get('id'));
      if (!id) { this.error = 'Id inválido'; return; }

      this.cargando = true;
      this.alojSrv.getDetalle(id).subscribe({
        next: (dto) => {
          const d: any = dto;

          this.aloj = {
            ...dto,
            imagenPrincipalUrl: d.imagenPrincipalUrl ?? d.portadaUrl ?? null,
            portadaUrl: d.portadaUrl ?? d.imagenPrincipalUrl ?? null,
            imagenes: Array.isArray(d.imagenes) ? d.imagenes : [],
            host: {
              id: d.anfitrionId ?? d.hostId ?? undefined,
              nombre: d.anfitrionNombre ?? d.hostNombre ?? 'Anfitrión',
              avatarUrl: d.anfitrionFotoUrl ?? d.hostFotoUrl ?? null,
              respuestaRapida: d.hostRespuestaRapida ?? false
            },
            servicios: Array.isArray(d.servicios)
              ? d.servicios.map((s: any) => typeof s === 'string' ? s : (s?.nombre ?? 'Servicio'))
              : [],
            comentarios: Array.isArray(d.comentarios) ? d.comentarios.map((c: any) => ({
              id: c.id ?? 0,
              autor: c.autorNombre ?? c.autor ?? 'Usuario',
              avatarUrl: c.autorFotoUrl ?? null,
              calificacion: Number(c.calificacion ?? c.rating ?? 0),
              texto: c.comentario ?? c.texto ?? '',
              fecha: c.fechaCreacion
            })) : [],
            calificacionPromedio: d.calificacionPromedio ?? d.rating ?? null,
            cantidadComentarios: d.cantidadComentarios ?? d.totalResenas ?? 0
          };

          this.cargando = false;
this.mapPendingInit = true;
this.tryInitMap();        },
        error: () => {
          this.error = 'No se pudo cargar el alojamiento.';
          this.cargando = false;
        }
      });
    });
  }

  // Ícono material para cada servicio (string)
  iconFor(raw?: string): string {
    const s = (raw || '').toLowerCase();
    if (s.includes('cocina')) return 'kitchen';
    if (s.includes('wifi') || s.includes('wi-fi')) return 'wifi';
    if (s.includes('parque')) return 'local_parking';
    if (s.includes('baño')) return 'bathtub';
    if (s.includes('soporte') || s.includes('24')) return 'support_agent';
    return 'check_circle';
  }

    seleccionarEstrellas(valor: number): void {
    this.nuevaCalificacion = valor;
    this.errorComentario = undefined;
    this.exitoComentario = undefined;
  }

  enviarComentario(): void {
    this.errorComentario = undefined;
    this.exitoComentario = undefined;

    if (!this.aloj?.id) {
      this.errorComentario = 'Alojamiento inválido.';
      return;
    }

    if (this.nuevaCalificacion < 1 || this.nuevaCalificacion > 5) {
      this.errorComentario = 'Selecciona una calificación entre 1 y 5 estrellas.';
      return;
    }

    if (!this.nuevoComentario.trim()) {
      this.errorComentario = 'Escribe un comentario.';
      return;
    }

    this.auth.loggedIn$.pipe(take(1)).subscribe(isLogged => {
      if (!isLogged) {
        // Igual que en reservarAhora: redirigir a login
        const redirect = encodeURIComponent(this.router.url);
        this.router.navigate(['/auth/login'], { queryParams: { redirect } });
        return;
      }

      this.enviandoComentario = true;

      // ⚠️ TODO: AJUSTA ESTE PAYLOAD A TU CrearComentarioRequest REAL ⚠️
      const payload = {
        // si tu backend usa reservaId, ponlo aquí
        // reservaId: ???,

        // si tu backend admite alojamientoId directamente:
        alojamientoId: this.aloj!.id as any,

        calificacion: this.nuevaCalificacion,
        comentario: this.nuevoComentario.trim()
      };

      this.alojSrv.crearComentario(payload as any).pipe(take(1)).subscribe({
        next: (resp) => {
          this.enviandoComentario = false;
          this.exitoComentario = '¡Gracias por tu reseña!';

          // Mapear la respuesta a tu ComentarioVM para añadirlo a la lista
          const nuevoVM: ComentarioVM = {
            id: resp.id ?? 0,
            autor: resp.autorNombre ?? 'Tú',
            avatarUrl: null,
            calificacion: Number(resp.calificacion ?? this.nuevaCalificacion),
            texto: resp.comentario ?? this.nuevoComentario.trim(),
            fecha: resp.fechaCreacion ?? new Date().toISOString().substring(0, 10)
          };

          if (!this.aloj!.comentarios) {
            this.aloj!.comentarios = [];
          }
          this.aloj!.comentarios.unshift(nuevoVM);

          // Actualizar contador y promedio “al vuelo”
          const antes = this.aloj!.cantidadComentarios ?? 0;
          const promedioAntes = this.aloj!.calificacionPromedio ?? 0;

          const sumaAntes = promedioAntes * antes;
          const ahoraCantidad = antes + 1;
          const ahoraPromedio = (sumaAntes + this.nuevaCalificacion) / ahoraCantidad;

          this.aloj!.cantidadComentarios = ahoraCantidad;
          this.aloj!.calificacionPromedio = ahoraPromedio;

          // reset form
          this.nuevaCalificacion = 0;
          this.nuevoComentario = '';
        },
        error: (e) => {
          this.enviandoComentario = false;
          this.errorComentario =
            e?.error?.message ||
            'No se pudo enviar tu reseña. Verifica que tengas una reserva completada para este alojamiento.';
        }
      });
    });
  }


  trackByIndex(i: number): number { return i; }
  trackById(_: number, it: { id: number }): number { return it.id; }

  back(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigateByUrl('/home');
  }

  private toYYYYMMDD(s: string): string {
  const d = new Date(s);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

reservarAhora(): void {
  this.errorReserva = undefined;

  if (!this.aloj?.id) { this.errorReserva = 'Alojamiento inválido.'; return; }
  if (!this.checkin || !this.checkout) { this.errorReserva = 'Selecciona check-in y check-out.'; return; }
  if (this.noches <= 0) { this.errorReserva = 'El check-out debe ser después del check-in.'; return; }

  this.auth.loggedIn$.pipe(take(1)).subscribe(isLogged => {
    if (!isLogged) {
      const redirect = encodeURIComponent(this.router.url);
      this.router.navigate(['/auth/login'], { queryParams: { redirect } });
      return;
    }

    this.reservando = true;

    const payload = {
      alojamientoId: this.aloj!.id,
      fechaCheckin:  this.toYYYYMMDD(this.checkin),
      fechaCheckout: this.toYYYYMMDD(this.checkout),
      numeroHuespedes: this.huespedes ?? 1,
      metodoPago: 'TARJETA_CREDITO' // opcional, cambia si tienes selector
    };

    this.reservasSrv.crearReserva(payload).pipe(take(1)).subscribe({
      next: (resp) => {
        this.reservando = false;
        this.router.navigate(['/perfil', 'reservas'], { queryParams: { ok: 1, id: resp.id }});
      },
      error: (e) => {
        this.reservando = false;
        this.errorReserva = e?.error?.message || 'No se pudo crear la reserva. Intenta de nuevo.';
      }
    });
  });

  
  
}



}
