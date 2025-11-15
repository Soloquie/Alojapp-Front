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
import { Observable } from 'rxjs';
import { ComentariosService } from '../../../core/services/comentarios';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';



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
export class DetalleAlojamientoComponent implements OnInit  {
  private readonly route = inject(ActivatedRoute);

loggedIn$!: Observable<boolean>;
  



  estrellas = [1, 2, 3, 4, 5];
  nuevaCalificacion = 0;
  nuevoComentario = '';
  enviandoComentario = false;
  errorComentario?: string;
  exitoComentario?: string;
  reservaElegibleId?: number;
  newRating = 0;
  newComment = '';





  constructor(
    private alojSrv: AlojamientoService,
    private reservasSrv: ReservasService,
    private auth: AuthService,
    private router: Router,
    private location: Location,
    private comentariosSrv: ComentariosService,
    private sanitizer: DomSanitizer           
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
  recalc(): void {}

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
    servicios: Array.isArray(d.servicios)
      ? d.servicios.map((s: any) => typeof s === 'string' ? s : (s?.nombre ?? 'Servicio'))
      : [],
    comentarios: Array.isArray(d.comentarios)
      ? d.comentarios.map((c: any) => ({
          id: c.id ?? c.comentarioId ?? 0,
          autor: c.autorNombre ?? c.usuarioNombre ?? c.autor ?? 'Usuario',
          avatarUrl: c.autorFotoUrl ?? c.usuarioFotoUrl ?? null,
          calificacion: Number(c.calificacion ?? c.rating ?? 0),
          texto: c.comentarioTexto ?? c.comentario ?? c.texto ?? '',
          fecha: c.fechaComentario ?? c.fechaCreacion ?? c.fecha ?? null
        }))
      : [],
    calificacionPromedio: d.calificacionPromedio ?? d.rating ?? null,
    cantidadComentarios: d.cantidadComentarios ?? d.totalResenas ?? 0
  };

  this.cargando = false;

  if (this.aloj?.id) {
    this.cargarReservaElegible(this.aloj.id);
    this.cargarComentarios(this.aloj.id);
  }
},

        error: () => {
          this.error = 'No se pudo cargar el alojamiento.';
          this.cargando = false;
        }
      });
    });
  }

  private cargarReservaElegible(alojamientoId: number): void {
  this.auth.loggedIn$.pipe(take(1)).subscribe(isLogged => {
    if (!isLogged) return;

    this.reservasSrv.getReservaCompletadaParaAlojamiento(alojamientoId)
      .pipe(take(1))
      .subscribe(reserva => {
        this.reservaElegibleId = reserva?.id;
      });
  });
}


googleMapUrl(lat?: number | null, lng?: number | null): SafeResourceUrl {
  const latV = lat ?? 0;
  const lngV = lng ?? 0;
  const url = `https://www.google.com/maps?q=${latV},${lngV}&z=15&output=embed`;
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
}


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

  if (!this.reservaElegibleId) {
    this.errorComentario = 'Necesitas una reserva completada para comentar este alojamiento.';
    return;
  }

  const rating = this.newRating;
  const texto = this.newComment.trim();

  if (rating < 1 || rating > 5) {
    this.errorComentario = 'Selecciona una calificación entre 1 y 5 estrellas.';
    return;
  }
  if (!texto) {
    this.errorComentario = 'Escribe un comentario.';
    return;
  }

  const payload = {
    reservaId: this.reservaElegibleId,
    calificacion: rating,
    comentarioTexto: texto
  };

  this.enviandoComentario = true;

  this.comentariosSrv.crear(payload).pipe(take(1)).subscribe({
    next: (dto) => {
      this.enviandoComentario = false;

      const nuevo: ComentarioVM = {
        id: dto.id ?? 0,
        autor: dto.autorNombre ?? 'Tú',
        avatarUrl: dto.autorFotoUrl ?? null,
        calificacion: dto.calificacion ?? rating,
        texto: dto.comentarioTexto ?? texto,
        fecha: dto.fechaCreacion ?? new Date(),
      };

      this.aloj!.comentarios = [nuevo, ...(this.aloj!.comentarios || [])];
      this.aloj!.cantidadComentarios = (this.aloj!.cantidadComentarios ?? 0) + 1;
      if (dto.promedioAlojamiento != null) {
        this.aloj!.calificacionPromedio = dto.promedioAlojamiento;
      }

      this.newRating = 0;
      this.newComment = '';
    },
    error: (err) => {
      this.enviandoComentario = false;
      this.errorComentario = err?.error?.message || 'No se pudo enviar el comentario.';
    }
  });
}

private cargarComentarios(alojamientoId: number): void {
  this.comentariosSrv.listarPorAlojamiento(alojamientoId, 0, 20)
    .pipe(take(1))
    .subscribe(resp => {
      const items =
        resp.contenido ??
        resp.content ??
        resp.items ??
        resp.resultados ??
        [];

      const comentarios: ComentarioVM[] = items.map((c: any) => ({
        id: c.id ?? c.comentarioId ?? 0,
        autor: c.autorNombre ?? c.usuarioNombre ?? 'Usuario',
        avatarUrl: c.autorFotoUrl ?? c.usuarioFotoUrl ?? null,
        calificacion: Number(c.calificacion ?? 0),
        texto: c.comentarioTexto ?? c.comentario ?? '',
        fecha: c.fechaComentario ?? c.fechaCreacion ?? c.fecha ?? null
      }));

      if (!this.aloj) return;

      this.aloj = {
        ...this.aloj,
        comentarios,
        cantidadComentarios:
          resp.totalElementos ?? resp.total ?? comentarios.length
      };
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
      metodoPago: 'TARJETA_CREDITO' 
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
