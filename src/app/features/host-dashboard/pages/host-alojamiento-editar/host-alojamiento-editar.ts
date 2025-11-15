import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import {
  AlojamientoService,
  AlojamientoDetalle,
  ActualizarAlojamientoPayload,
  ServicioAlojamientoDTO
} from '../../../../core/services/alojamiento.service';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-host-alojamiento-editar',
  templateUrl: './host-alojamiento-editar.html',
  styleUrls: ['./host-alojamiento-editar.scss'],
  standalone: false
})
export class HostAlojamientoEditarComponent implements OnInit {

  id!: number;
  mapUrl?: SafeResourceUrl;
  cargando = true;
  guardando = false;
  error?: string;
  exito?: string;
  latitud: number | null = null;
  longitud: number | null = null;

  // campos del formulario
  titulo = '';
  descripcion = '';
  ciudad = '';
  direccion = '';
  precioNoche: number | null = null;
  capacidadMaxima: number | null = null;

  // imagen
  imagenActual?: string | null;
  imagenPreview?: string | null;
  archivoImagen?: File | null = null;

  // servicios
  todosServicios: ServicioAlojamientoDTO[] = [];
  serviciosSeleccionados = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private alojSrv: AlojamientoService,
    private sanitizer: DomSanitizer          
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.id) {
      this.error = 'ID de alojamiento inválido.';
      this.cargando = false;
      return;
    }

    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando = true;

    forkJoin({
      alojamiento: this.alojSrv.getDetalle(this.id),
      servicios: this.alojSrv.listarServicios()
    }).subscribe({
      next: ({ alojamiento, servicios }) => {
        this.todosServicios = servicios || [];

        this.titulo = alojamiento.titulo;
        this.descripcion = alojamiento.descripcion ?? '';
        this.ciudad = alojamiento.ciudad ?? '';
        this.updateMapUrl(); 
        this.direccion = (alojamiento as any).direccion ?? '';
        this.latitud  = alojamiento.latitud  ?? null;
        this.longitud = alojamiento.longitud ?? null;


        this.precioNoche = alojamiento.precioNoche ?? null;
        this.capacidadMaxima =
          (alojamiento as any).capacidadMaxima ??
          (alojamiento as any).capacidad ??
          null;

        this.imagenActual = alojamiento.portadaUrl || alojamiento.imagenes?.[0] || null;

        // marcar servicios seleccionados
        const servs: any[] = (alojamiento as any).servicios ?? [];
        const ids = servs
          .map(s => s.id)
          .filter((id: any) => typeof id === 'number');
        this.serviciosSeleccionados = new Set<number>(ids);

        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el alojamiento.';
        this.cargando = false;
      }
    });
  }
private updateMapUrl(): void {
  if (this.latitud == null || this.longitud == null) {
    this.mapUrl = undefined;
    return;
  }
  const url = `https://www.google.com/maps?q=${this.latitud},${this.longitud}&z=15&output=embed`;
  this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
}

onCoordsChange(): void {
  this.updateMapUrl();
}

onUbicacionChange(): void {
  this.updateMapUrl();
}


  back(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/anfitrion/dashboard']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.archivoImagen = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  toggleServicio(id: number, checked: boolean): void {
    if (checked) this.serviciosSeleccionados.add(id);
    else this.serviciosSeleccionados.delete(id);
  }

  guardar(): void {
    this.error = undefined;
    this.exito = undefined;

    if (!this.titulo.trim()) {
      this.error = 'El título es obligatorio.';
      return;
    }
    if (this.precioNoche == null || this.precioNoche <= 0) {
      this.error = 'El precio por noche debe ser mayor que 0.';
      return;
    }
    if (this.capacidadMaxima == null || this.capacidadMaxima <= 0) {
      this.error = 'La capacidad máxima debe ser mayor que 0.';
      return;
    }

    const body: ActualizarAlojamientoPayload = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      ciudad: this.ciudad.trim(),
      direccion: this.direccion.trim(),
      precioNoche: this.precioNoche,
      capacidadMaxima: this.capacidadMaxima,
      serviciosIds: Array.from(this.serviciosSeleccionados)
    };

    this.guardando = true;

    this.alojSrv.updateMiAlojamiento(this.id, body).pipe(
      switchMap(dto =>
        this.archivoImagen
          ? this.alojSrv.reemplazarImagenPrincipal(this.id, this.archivoImagen).pipe(
              // después de subir, actualizamos la imagen actual
              switchMap(imgs => {
                if (imgs && imgs.length) {
                  this.imagenActual = imgs[0].url;
                  this.imagenPreview = null;
                }
                return of(dto);
              })
            )
          : of(dto)
      )
    ).subscribe({
      next: _ => {
        this.guardando = false;
        this.exito = 'Alojamiento actualizado correctamente.';
        this.router.navigate(['/anfitrion/dashboard']);
      },
      error: e => {
        this.guardando = false;
        this.error = e?.error?.message || 'No se pudo actualizar el alojamiento.';
      }
    });
  }

  imagenParaMostrar(): string {
    return this.imagenPreview || this.imagenActual || 'assets/placeholder.jpg';
  }
}
