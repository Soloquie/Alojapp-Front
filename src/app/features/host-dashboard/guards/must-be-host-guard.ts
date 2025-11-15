import { NgModule, inject } from '@angular/core';
import { Router, RouterModule, Routes, CanActivateFn } from '@angular/router';
import { combineLatest, map, take } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { HostDashboardComponent } from '../pages/dashboard/dashboard';

export const mustBeHostGuard: CanActivateFn = (_r, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return combineLatest([auth.loggedIn$, auth.role$]).pipe(
    take(1),
    map(([logged, role]) => {
      const isHost = (role ?? '').toUpperCase() === 'ANFITRION';
      return (logged && isHost)
        ? true
        : router.createUrlTree(['/auth/login'], { queryParams: { redirect: state.url } });
    })
  );
};

const routes: Routes = [
  { path: '', component: HostDashboardComponent, canActivate: [mustBeHostGuard], title: 'Dashboard de Anfitrión' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HostDashboardRoutingModule {}
