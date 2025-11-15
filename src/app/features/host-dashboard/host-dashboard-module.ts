import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostDashboardRoutingModule } from './host-dashboard-routing-module';
import { HostDashboardComponent } from './pages/dashboard/dashboard';
import { Routes } from '@angular/router';
import { CreateListingComponent } from './pages/create-listing/create-listing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HostAlojamientoEditarComponent } from './pages/host-alojamiento-editar/host-alojamiento-editar';
import { HostReservasComponent } from './pages/reservas/host-reservas/host-reservas';

const routes: Routes = [
{ path: '', component: HostDashboardComponent, /* canActivate: [mustBeHostGuard], */ title: 'Dashboard de Anfitrión' }
]

@NgModule({
  declarations: [HostDashboardComponent, CreateListingComponent, HostAlojamientoEditarComponent, HostReservasComponent],
  imports: [CommonModule, HostDashboardRoutingModule, FormsModule, ReactiveFormsModule]
})
export class HostDashboardModule {}
