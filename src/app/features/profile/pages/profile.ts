import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { Usuario } from '../../../core/models/usuario.models';
import { Reserva } from '../../../core/models/reserva.models';
import { AlojamientoService } from '../../../core/services/alojamiento.service';
import { Router } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';

type Tab = 'proximas'|'pasadas'|'canceladas';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  standalone: false
})
export class ProfileComponent implements OnInit {
  user?: Usuario;
  reservas: Reserva[] = [];
  loadingUser = false;
  loadingRes = false;
  tab: Tab = 'proximas';
  today = new Date();

  constructor(private usuarioSvc: UsuarioService, private reservasSvc: ReservasService,private router: Router, private alojamientoSrvc: AlojamientoService) {}

  ngOnInit(): void {
    this.cargarPerfil();
    this.cargarReservas();
  }

  private cargarPerfil() {
    this.loadingUser = true;
    this.usuarioSvc.me().subscribe({
      next: u => { this.user = u; this.loadingUser = false; },
      error: _ => { this.loadingUser = false; }
    });
  }

  private cargarReservas() {
  this.loadingRes = true;

  this.reservasSvc.listarMias().pipe(
    switchMap(rs => {
      this.reservas = rs;

      const ids = Array.from(new Set(
        rs.map(r => r.alojamientoId).filter(id => !!id)
      ));

      if (!ids.length) {
        return of([] as { id: number; portada: string | null }[]);
      }

      return forkJoin(
        ids.map(id =>
          this.alojamientoSrvc.getById(id).pipe(   
            map(aloj => ({
              id,
              portada:
                aloj.portadaUrl ||
                aloj.imagenes?.[0] ||
                null
            }))
          )
        )
      );
    })
  ).subscribe({
    next: mapas => {
      mapas.forEach(({ id, portada }) => {
        this.reservas
          .filter(r => r.alojamientoId === id)
          .forEach(r => (r.alojamientoImagen = portada));
      });
      this.loadingRes = false;
    },
    error: _ => {
      this.loadingRes = false;
    }
  });
}



  setTab(t: Tab) { this.tab = t; }

  get filtradas(): Reserva[] {
    const now = this.today;
    return this.reservas.filter(r => {
      const ci = r.fechaCheckin ? new Date(r.fechaCheckin) : null;
      const co = r.fechaCheckout ? new Date(r.fechaCheckout) : null;
      const estado = (r.estado || '').toUpperCase();

      if (this.tab === 'canceladas') return estado === 'CANCELADA';
      if (this.tab === 'proximas') {
        if (estado === 'CANCELADA') return false;
        if (ci) {
          const ciD = new Date(ci.getFullYear(), ci.getMonth(), ci.getDate());
          const todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return ciD >= todayD;
        }
        return false;
      }
      if (this.tab === 'pasadas') {
        if (estado === 'COMPLETADA') return true;
        if (co) {
          const coD = new Date(co.getFullYear(), co.getMonth(), co.getDate());
          const todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return coD < todayD;
        }
        return false;
      }

      return true;
    });
  }

  rangoFechas(r: Reserva) {
    const f = (s?: string) => s ? new Date(s).toLocaleDateString() : '—';
    return `${f(r.fechaCheckin)} - ${f(r.fechaCheckout)}`;
  }

    back(): void {
    this.router.navigate(['/home']);
  }

  abrirReserva(r: Reserva) {
    if (!r.id) return;
    this.router.navigate(['/perfil/reservas', r.id]);
  }

  avatar(): string {
    return this.user?.fotoPerfilUrl || 'assets/avatar-placeholder.jpg';
  }
}
