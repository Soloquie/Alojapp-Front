import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HostDashboardRoutingModule } from './host-dashboard-routing-module';
import { Dashboard } from './pages/dashboard/dashboard';
import { Lista } from './pages/alojamientos/lista/lista';
import { Nuevo } from './pages/alojamientos/nuevo/nuevo';


@NgModule({
  declarations: [
    Dashboard,
    Lista,
    Nuevo
  ],
  imports: [
    CommonModule,
    HostDashboardRoutingModule
  ]
})
export class HostDashboardModule { }
