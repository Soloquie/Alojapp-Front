import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  ReservasService,
  ReservaHostRow
} from '../../../../../core/services/reservas.service';

@Component({
  selector: 'app-host-reservas',
  templateUrl: './host-reservas.html',
  styleUrls: ['./host-reservas.scss'],
  standalone: false
})
export class HostReservasComponent implements OnInit {

  cargando = true;
  error?: string;

  reservas: ReservaHostRow[] = [];
  filtroEstado = ''; // '', 'CONFIRMADA', 'PENDIENTE', 'CANCELADA'

  constructor(
    private reservasSrv: ReservasService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(estado?: string): void {
    this.cargando = true;
    this.error = undefined;

    this.reservasSrv.listarComoAnfitrion(estado).subscribe({
      next: (rows) => {
        this.reservas = rows;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las reservaciones.';
        this.cargando = false;
      }
    });
  }

  onEstadoChange(value: string): void {
    this.filtroEstado = value;
    this.cargar(value || undefined);
  }

  back(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/anfitrion']);
  }

  estadoBadgeClase(estado?: string | null): string {
    const e = (estado ?? '').toUpperCase();
    if (['CONFIRMADO', 'CONFIRMADA', 'ACTIVO', 'APROBADO'].includes(e))
      return 'bg-green-100 text-green-800';
    if (['PENDIENTE', 'EN_REVISION', 'EN PROCESO'].includes(e))
      return 'bg-yellow-100 text-yellow-800';
    if (['CANCELADO', 'CANCELADA', 'RECHAZADO', 'INACTIVO'].includes(e))
      return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-700';
  }

  verDetalle(id: number): void {
    this.router.navigate(['/perfil', 'reservas', id]);
  }

  contactarHuesped(id: number): void {
    console.log('Contactar huésped reserva', id);
  }

  modificarReserva(id: number): void {
    this.verDetalle(id);
  }
}
