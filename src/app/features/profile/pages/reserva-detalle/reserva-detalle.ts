import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservasService } from '../../../../core/services/reservas.service';
import { Reserva } from '../../../../core/models/reserva.models';
import { Location } from '@angular/common';
import { AlojamientoService } from '../../../../core/services/alojamiento.service';

type ReservaVM = Reserva & {
  direccion?: string;
  ciudad?: string;
  anfitrionNombre?: string;
  anfitrionFotoUrl?: string | null;
  alojamientoImagen?: string | null;   
};

@Component({
  selector: 'app-reserva-detalle',
  templateUrl: './reserva-detalle.html',
  styleUrls: ['./reserva-detalle.scss'],
  standalone: false
})
export class ReservaDetalleComponent implements OnInit {

  reserva?: ReservaVM;
  cargando = true;
  error?: string;
  motivoCancelacion = '';
  cancelando = false;

  constructor(
    private route: ActivatedRoute,
    private reservasSrv: ReservasService,
    private router: Router,
    private location: Location,
    private alojamientoSrv: AlojamientoService    
  ) {}

  ngOnInit(): void {
  const id = Number(this.route.snapshot.paramMap.get('id'));
  if (!id) {
    this.error = 'ID de reserva inválido';
    this.cargando = false;
    return;
  }

  this.reservasSrv.obtenerPorId(id).subscribe({
    next: r => {
      const anyR: any = r;

      this.reserva = {
        ...r,
        direccion: anyR.alojamiento?.direccion ?? anyR.direccionAlojamiento ?? '',
        ciudad: anyR.alojamiento?.ciudad ?? anyR.ciudadAlojamiento ?? '',
        anfitrionNombre: anyR.anfitrionNombre ?? anyR.alojamiento?.anfitrionNombre ?? 'Anfitrión',
        anfitrionFotoUrl: anyR.anfitrionFotoUrl ?? null,
        alojamientoImagen: null   
      };

      if (this.reserva.alojamientoId) {
        this.alojamientoSrv.getDetalle(this.reserva.alojamientoId).subscribe({
          next: det => {
            this.reserva = {
              ...this.reserva!,
              alojamientoImagen:
                det.portadaUrl ||
                det.imagenes?.[0] ||
                null
            };
          },
          error: _ => {
          }
        });
      }

      this.cargando = false;
    },
    error: () => {
      this.error = 'No se pudo cargar la reserva.';
      this.cargando = false;
    }
  });
}


  back(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/perfil']);
  }

  cancelar(): void {
  if (!this.reserva?.id) return;
  if (!this.motivoCancelacion.trim()) {
    this.motivoCancelacion = 'Cancelación solicitada por el usuario';
  }
  this.cancelando = true;

  this.reservasSrv.cancelar(this.reserva.id, this.motivoCancelacion).subscribe({
    next: (msg) => {
      this.cancelando = false;
      this.router.navigate(['/perfil'], { queryParams: { cancelOk: 1 }});
    },
    error: (e) => {
      this.cancelando = false;
      this.error = e?.error?.message || 'No se pudo cancelar la reserva.';
    }
  });
}


  noches(): number {
    if (!this.reserva?.fechaCheckin || !this.reserva?.fechaCheckout) return 0;
    const ci = new Date(this.reserva.fechaCheckin);
    const co = new Date(this.reserva.fechaCheckout);
    const ms = co.getTime() - ci.getTime();
    return ms > 0 ? Math.round(ms / 86400000) : 0;
  }
}
