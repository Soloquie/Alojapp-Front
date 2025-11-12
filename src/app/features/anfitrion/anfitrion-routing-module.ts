import { NgModule, inject } from '@angular/core';
import { RouterModule, Routes, CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { SerAnfitrionComponent } from './ser-anfitrion/ser-anfitrion';
import { AuthService } from '../../core/services/auth.service';

// Guard: exige sesión; si no, redirige a /auth/login?redirect=<url>
export const mustBeLoggedInGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loggedIn$.pipe(
    take(1),
    map(isLogged =>
      isLogged
        ? true
        : router.createUrlTree(['/auth/login'], { queryParams: { redirect: state.url } })
    )
  );
};

const routes: Routes = [
  {
    path: '',
    component: SerAnfitrionComponent,
    title: 'Únete como anfitrión',
    canActivate: [mustBeLoggedInGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnfitrionRoutingModule {}
