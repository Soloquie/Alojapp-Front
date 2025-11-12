import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AnfitrionRoutingModule } from './anfitrion-routing-module';
import { SerAnfitrionComponent } from './ser-anfitrion/ser-anfitrion';
import { AnfitrionExitoComponent } from './exito/exito';

@NgModule({
  declarations: [SerAnfitrionComponent, AnfitrionExitoComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AnfitrionRoutingModule
  ]
})
export class AnfitrionModule {}
