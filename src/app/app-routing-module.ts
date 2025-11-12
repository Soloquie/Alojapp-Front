import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guards';

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
  { path: '**', redirectTo: 'home' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
