import { Component, OnInit } from '@angular/core';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  HostDashboardService,
  AlojCard,
  ReservaItem,
  HostResumen
} from '../../../../core/services/host-dashboard';

type StatsVM = {
  reservas: number;
  ingresosTotales: number;
  promedioCalificacion: number;
};

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

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  standalone: false
})
export class HostDashboardComponent implements OnInit {
  cargando = false;
  error?: string;

  stats?: StatsVM;
  alojamientos: AlojCard[] = [];
  reservas: ReservaItem[] = [];

  constructor(private srv: HostDashboardService) {}

  ngOnInit(): void {
    this.cargando = true;

    this.srv.getAnfitrionId()
      .pipe(
        switchMap(id => (id ? this.srv.cargarTodo(id) : of(null))),
        finalize(() => (this.cargando = false))
      )
      .subscribe({
        next: data => {
          if (!data) {
            this.error = 'No se pudo cargar el dashboard.';
            return;
          }
          this.error = undefined;

          this.stats = this.toStatsVM(data.resumen);
          this.alojamientos = data.alojamientos || [];
          this.reservas = (data.reservas || []).slice(0, 5);
        },
        error: () => {
          this.error = 'No se pudo cargar el dashboard.';
        }
      });
  }

  private toStatsVM(r: HostResumen): StatsVM {
    return {
      reservas: r.reservasTotales ?? 0,
      ingresosTotales: r.ingresosTotales ?? 0,
      promedioCalificacion: r.ratingPromedio ?? 0
    };
  }

  estadoBadgeClase(estado?: string | null): string {
    const e = (estado ?? '').toUpperCase();
    if (['CONFIRMADO', 'ACTIVO', 'APROBADO'].includes(e)) return 'bg-green-100 text-green-800';
    if (['PENDIENTE', 'EN_REVISION', 'EN PROCESO'].includes(e)) return 'bg-yellow-100 text-yellow-800';
    if (['CANCELADO', 'RECHAZADO', 'INACTIVO'].includes(e)) return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-700';
  }

  
}
