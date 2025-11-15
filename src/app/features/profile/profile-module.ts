import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './pages/profile';
import { AuthGuard } from '../../core/guards/auth.guards';
import { EditProfileComponent } from './edit-profile/edit-profile';
import { FormsModule } from '@angular/forms';
import { ReservaDetalleComponent } from './pages/reserva-detalle/reserva-detalle';

const routes: Routes = [
  { path: '', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'editar', component: EditProfileComponent, canActivate: [AuthGuard] },
  { path: 'reservas/:id', component: ReservaDetalleComponent, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [ProfileComponent, EditProfileComponent, ReservaDetalleComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ]
})
export class ProfileModule {}

