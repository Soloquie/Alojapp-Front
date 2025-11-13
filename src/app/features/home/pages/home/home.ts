// src/app/features/home/pages/home/home.ts
import { Component, OnInit } from '@angular/core';
import { Observable, startWith, map, take } from 'rxjs';
import { Router } from '@angular/router';
import { AlojamientoService, AlojamientoCard, SearchFilters } from '../../../../core/services/alojamiento.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  standalone: false
})
export class HomeComponent implements OnInit {
  populares$!: Observable<AlojamientoCard[]>;
  isLoggedIn$!: Observable<boolean>;
  isHost$!: Observable<boolean>;
  role$!:  Observable<string | null>;


  constructor(
    private aloj: AlojamientoService,
    private auth: AuthService,
    private router: Router
  ) {}

  destinos = [
    { titulo: 'París, Francia',  desc: 'La ciudad del amor y las luces.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIsh-tA5Jb93mqw2t4Qln7qyRRdMSu5KRlFOLfiC3uLpvZ6Xxn13pzuiwF0JljyORpj6BUn9TgMVD5e8Gn0yVdCTYVsJko1s3IYiXSqaAEvx-mdmS4uBVqlJQ7YnT6_L_hpDnpsjGBzn29_9ZZU4PPoVTByeMZfJK6bHNzo-oCLEgYMXnTYqfBM9Y9dEntEhA0o4y6UFJCHgj01rvjob5T4uUHi4kHIGMy-hOBdfhV3d8g1XGPOkaT3IoeVWM9uU7gozjCaAUpuQ8' },
    { titulo: 'Kyoto, Japón',   desc: 'El corazón cultural de Japón.',   img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZtLRRIgr-xkw3nXiXLjxdOxcjU2Y3DqNaClnDJQGT5mlqeYrP3AaVE_Zz98B2kaW9_sph75hEZSKWXcgM2ZzvDUvB3Fzjiw8Pskikbq9DK_OqDiArcM-r47q1WLdb6fJeB7i4ltTfxPWKaFNVf0UTuhKBq6_xsI1ueU-vb-5iF9puCJRcp5goFUyZ-NBXKNGYXE3vjl6qxiiKts8eB__QAW_P0lJiEDw5lIaee_zIo4arZlyP8bgGrrYxTBpOWQkudVxYMy-ybss' },
    { titulo: 'Roma, Italia',   desc: 'Historia y pasta en cada esquina.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcTygOZa380tZhKR4olQyMQCsu7UYxo1D-EN68L6Udc_gR6Lk3aQIOj6fV7NwbFLg9vE91O3XOqQoUeNrmBOWYhwS4Ep2k4v2eeQ9R1LEsVg2p3k-KYHahuTfz_lWU9LSel33I29fkhZcu1juqjnZSXFQC0axIFjJB1d5TbTwPOyWtI9ZZT9hFlZeSNp7UE8IGg3hhR9GeC-YC_2u5hLDnVC7Z2wYpNeeGKfMH5KXJVwJJfUnikVt9EpbFnSRcGxT-EfYRkqdDkOI' },
    { titulo: 'Nueva York, USA', desc: 'La ciudad que nunca duerme.',     img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnCNmO5MKPyy0hIjHo9lbQlkuthed9mwlujuhwLGaJawlGF3539YcbO7hxIiXcJWoY0hPwfO_vrpGKZd0-LeqeSroaP8CBWOrxf2tmPWoaWTsM2HcF86apwhc6cEVOnAmQ82_dSCbthuuIjlOAgguAz3ElzYPw7oom-UPN-OaI6R_pogby0ugpQdd_i2eob-HPbTmBzK-P-D9wLLH6ufEUweoStV_kxyqZBas2mT0dnWROGlPE5VMN804_Lba1ae6noCv4PrOoeZ4' }
  ];

    private buildFilters(from: 'header' | 'form'): SearchFilters {
    const f: SearchFilters = {};

    if (from === 'header') {
      if (this.q?.trim()) f.q = this.q.trim();
      return f;
    }

    // desde el formulario grande
    if (this.ciudad?.trim()) f.ciudad = this.ciudad.trim();
    if (this.checkin) f.checkin = this.checkin;
    if (this.checkout) f.checkout = this.checkout;
    if (this.huespedes != null && this.huespedes > 0) f.huespedes = this.huespedes;

    return f;
  }

    private goToSearch(from: 'header' | 'form'): void {
    const filtros = this.buildFilters(from);

    // creamos la URL destino (/buscar?... )
    const tree = this.router.createUrlTree(['/buscar'], { queryParams: filtros });
    const targetUrl = tree.toString();   // ej: /buscar?ciudad=Armenia&huespedes=2

    this.auth.loggedIn$.pipe(take(1)).subscribe(isLogged => {
      if (!isLogged) {
        this.router.navigate(['/auth/login'], {
          queryParams: { redirect: targetUrl }
        });
        return;
      }

      // si ya está logueado, vamos directo a /buscar
      this.router.navigateByUrl(targetUrl);
    });
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.loggedIn$;

    this.isHost$=this.auth.isHost$;
    this.role$=this.auth.role$;
    this.populares$ = this.aloj.getPopulares().pipe(startWith([]));
  }

  foto(a: AlojamientoCard)      { return (a as any).portadaUrl || 'assets/placeholder.jpg'; }
  ubicacion(a: AlojamientoCard) { return [(a as any).ciudad, (a as any).pais].filter(Boolean).join(', '); }
  precio(a: AlojamientoCard)    { const p = (a as any).precioNoche; return p != null ? `$${p}` : '—'; }
  rating(a: AlojamientoCard)    { const r = (a as any).rating; return r != null ? Number(r).toFixed(1) : '—'; }

  logout() { this.auth.logout(); }

  q = '';
  ciudad = '';
  checkin = '';
  checkout = '';
  huespedes?: number;

  goSearchFromHeader(): void {
    this.goToSearch('header');
  }

  /** usado por el botón "Buscar" del formulario */
  onSubmit(event: Event): void {
    event.preventDefault();
    this.goToSearch('form');
  }

  openDetalle(a: AlojamientoCard) {
    const id = this.getId(a);
    if (!id) { console.warn('Alojamiento sin id'); return; }
    this.router.navigate(['/alojamiento', id]);
  }

  private getId(a: AlojamientoCard): string | number | null {
    return (a as any).id ?? (a as any).alojamientoId ?? (a as any).codigo ?? (a as any).uuid ?? null;
  }

  openAlojamiento(id?: number) {
    if (!id) return;
    this.router.navigate(['/alojamientos', id]);
  }
}
