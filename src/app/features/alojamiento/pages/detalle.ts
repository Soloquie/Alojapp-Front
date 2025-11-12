import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import {
  AlojamientoService,
  AlojamientoDetalle as AlojamientoDTO
} from '../../../core/services/alojamiento.service';

import { ReservasService } from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs/operators';

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
  calificacionPromedio?: number | null;
  cantidadComentarios?: number | null;
};

@Component({
  selector: 'app-detalle-alojamiento',
  templateUrl: './detalle.html',
  styleUrls: ['./detalle.scss'],
  standalone: false
})
export class DetalleAlojamientoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

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
        },
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
