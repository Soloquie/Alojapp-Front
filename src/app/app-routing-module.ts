import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guards';
import { HostAlojamientoEditarComponent } from './features/host-dashboard/pages/host-alojamiento-editar/host-alojamiento-editar';
import { HostReservasComponent } from './features/host-dashboard/pages/reservas/host-reservas/host-reservas';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () =>
      import('./features/home/home-module').then(m => m.HomeModule) },
  { path: 'auth', loadChildren: () =>
      import('./features/auth/auth-module').then(m => m.AuthModule) },
  { path: 'perfil', loadChildren: () =>
  import('./features/profile/profile-module').then(m => m.ProfileModule) },
  { path: 'buscar', loadChildren: () =>
  import('./features/search/search-module').then(m => m.SearchModule) },
  { path: 'alojamientos', loadChildren: () =>
    import('./features/alojamiento/alojamiento-module').then(m => m.AlojamientoModule) },
  { path: 'alojamientos/:id', loadChildren: () => import('./features/alojamiento/alojamiento-module').then(m => m.AlojamientoModule) },
  { path: 'ser-anfitrion', loadChildren: () => import('./features/anfitrion/anfitrion-module').then(m => m.AnfitrionModule) },
  { path: 'anfitrion', loadChildren: () => import('./features/host-dashboard/host-dashboard-module').then(m => m.HostDashboardModule) },
  { path: 'anfitrion/alojamientos/:id/editar', component: HostAlojamientoEditarComponent },
  { path: 'anfitrion/reservas', component: HostReservasComponent },
  { path: '**', redirectTo: 'home' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
