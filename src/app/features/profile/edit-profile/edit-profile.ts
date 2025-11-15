import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.html',
  styleUrls: ['./edit-profile.scss'],
  standalone: false
})
export class EditProfileComponent implements OnInit {

  user?: Usuario;

  nombre = '';
  email = '';
  telefono = '';
  fechaNacimiento = '';

  fotoActual?: string | null;
  fotoPreview?: string | null;
  archivoFoto?: File | null;

  cargando = false;
  guardando = false;
  error?: string;
  exito?: string;

  constructor(
    private usuarioSvc: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.usuarioSvc.me().subscribe({
      next: u => {
        this.user = u;
        this.nombre = u.nombre || '';
        this.email = u.email || '';
        this.telefono = u.telefono || '';
        if (u.fechaNacimiento) {
          this.fechaNacimiento = u.fechaNacimiento.substring(0, 10);
        }
        this.fotoActual = u.fotoPerfilUrl || null;
        this.cargando = false;
      },
      error: _ => {
        this.error = 'No se pudo cargar tu perfil.';
        this.cargando = false;
      }
    });
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.archivoFoto = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  guardar(): void {
    this.error = undefined;
    this.exito = undefined;

    if (!this.nombre.trim()) {
      this.error = 'El nombre es obligatorio.';
      return;
    }

    this.guardando = true;

    const perfil = {
      nombre: this.nombre.trim(),
      telefono: this.telefono.trim() || null,
      fechaNacimiento: this.fechaNacimiento || null
    };

    this.usuarioSvc.actualizarMiPerfil(perfil, this.archivoFoto).subscribe({
      next: u => {
        this.guardando = false;
        this.exito = 'Perfil actualizado correctamente.';
        this.router.navigate(['/perfil']);
      },
      error: err => {
        this.guardando = false;
        this.error = err?.error?.message || 'No se pudo actualizar el perfil.';
      }
    });
  }

  back(): void {
    this.router.navigate(['/perfil']);
  }

  avatar(): string {
    return this.fotoPreview || this.fotoActual || 'assets/avatar-placeholder.jpg';
  }
}
