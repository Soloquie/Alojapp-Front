import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  AlojamientoService,
  AlojamientoCard,
  SearchFilters
} from '../../../../core/services/alojamiento.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-search-results',
  standalone: false,
  templateUrl: './results.html',
  styleUrls: ['./results.scss']
})
export class SearchResultsComponent implements OnInit {
  isHost$!: Observable<boolean>;

  results$!: Observable<AlojamientoCard[]>;
  filtrosActuales: Partial<SearchFilters> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alojSrv: AlojamientoService,
    private auth: AuthService
    
  ) {}

    openAlojamiento(id: number): void {
    if (!id) return;
    this.router.navigate(['/alojamientos', id]);
  }

  ngOnInit(): void {
    this.isHost$=this.auth.isHost$;
    this.results$ = this.route.queryParams.pipe(
      map(params => {
        const f: SearchFilters = {
          q: params['q'] || undefined,
          ciudad: params['ciudad'] || undefined,
          checkin: params['checkin'] || undefined,
          checkout: params['checkout'] || undefined,
          huespedes: params['huespedes'] ? Number(params['huespedes']) : undefined,
          minPrecio: params['minPrecio'] ? Number(params['minPrecio']) : undefined,
          maxPrecio: params['maxPrecio'] ? Number(params['maxPrecio']) : undefined,
          servicios: params['servicios'] ? String(params['servicios']).split(',') : undefined
        };

        this.filtrosActuales = f;
        return f;
      }),
      switchMap(f => this.alojSrv.buscar(f))
    );
  }

  ubicacion(a: AlojamientoCard): string {
    if (!a.ciudad && !a.pais) return '';
    if (!a.pais) return a.ciudad ?? '';
    if (!a.ciudad) return a.pais ?? '';
    return `${a.ciudad}, ${a.pais}`;
  }

  precio(a: AlojamientoCard): string {
    const p = a.precioNoche ?? 0;
    return `$${p.toFixed(0)}`;
  }

  rating(a: AlojamientoCard): string {
    const r = a.rating ?? 0;
    return r ? r.toFixed(1) : '—';
  }

  foto(a: AlojamientoCard): string {
    return a.portadaUrl || 'assets/placeholder.jpg';
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
