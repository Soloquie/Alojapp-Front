// src/app/features/host-dashboard/pages/create-listing/create-listing.component.ts
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiciosService, ServicioDTO } from '../../../../core/services/servicios';
import { HostDashboardService } from '../../../../core/services/host-dashboard';
import { Observable } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-create-listing',
  templateUrl: './create-listing.component.html',
  styleUrls: ['./create-listing.component.scss'],
  standalone:false
})
export class CreateListingComponent implements OnInit, AfterViewInit {
  form!: FormGroup; 
  servicios$!: Observable<ServicioDTO[]>;
  files: File[] = [];
  publicando = false;
  error?: string;
  @ViewChild('mapElement') mapElement!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private marker?: L.Marker;

 ngAfterViewInit(): void {
  const defaultLat = 4.53389;
  const defaultLng = -75.68111;

  this.map = L.map(this.mapElement.nativeElement, {
    center: [defaultLat, defaultLng],
    zoom: 13
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(this.map);

  const lat = this.form.get('latitud')?.value ?? defaultLat;
  const lng = this.form.get('longitud')?.value ?? defaultLng;

  this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
  this.map.setView([lat, lng], 13);

  // Click en el mapa → mover marcador y actualizar form
  this.map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    this.updateMarker(lat, lng);
    this.form.patchValue({ latitud: lat, longitud: lng });
  });

  this.marker.on('moveend', (e: L.LeafletEvent) => {
    const m = e.target as L.Marker;
    const pos = m.getLatLng();
    this.form.patchValue({ latitud: pos.lat, longitud: pos.lng });
  });

  // 👇 Importante: forzar a que recalculen el tamaño real del div
  setTimeout(() => {
    this.map?.invalidateSize();
    this.map?.setView([lat, lng], 13); // re-centra ya con tamaño correcto
  }, 200);
}


  private updateMarker(lat: number, lng: number) {
    if (!this.marker) {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map!);
    } else {
      this.marker.setLatLng([lat, lng]);
    }
    this.map?.setView([lat, lng], this.map.getZoom());
  }


  constructor(
    private fb: FormBuilder,
    private srvServicios: ServiciosService,
    private hostSrv: HostDashboardService
  ) {}

  ngOnInit(): void {
    this.servicios$ = this.srvServicios.getAll$(); 
    this.form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(6)]],
    descripcion: ['', [Validators.required, Validators.minLength(50)]],
    ciudad: ['', Validators.required],
    direccion: ['', Validators.required],
    latitud: [null as number | null, Validators.required],
    longitud: [null as number | null, Validators.required],
    precioNoche: [null as number | null, [Validators.required, Validators.min(1)]],
    capacidadMaxima: [1, [Validators.required, Validators.min(1)]],
    serviciosIds: [[] as number[]],
    nuevoServicioNombre: [''],
    nuevoServicioDescripcion: ['']
    
  });
    
  }

  

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files?.length) {
      this.files = Array.from(input.files);
    }
  }

  // publicar
  submit(): void {
  this.error = undefined;

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const files: File[] = this.files ?? [];

  const v = this.form.value;
  const payload = {
    titulo: String(v.titulo || '').trim(),
    descripcion: String(v.descripcion || '').trim(),
    ciudad: String(v.ciudad || '').trim(),
    direccion: String(v.direccion || '').trim(),
    latitud: v.latitud ?? null,
    longitud: v.longitud ?? null,
    precioNoche: Number(v.precioNoche ?? 0),
    capacidadMaxima: Number(v.capacidadMaxima ?? 1),
    serviciosIds: Array.isArray(v.serviciosIds) ? v.serviciosIds : []
  };

  // Validación mínima adicional (opcional)
  if (!payload.titulo || !payload.descripcion || !payload.ciudad || !payload.direccion) {
    this.error = 'Completa los campos obligatorios.';
    return;
  }

  this.publicando = true;

  this.hostSrv.getAnfitrionId().subscribe({
    next: (anfitrionId) => {
      if (!anfitrionId) {
        this.publicando = false;
        this.error = 'No se pudo resolver el anfitrión actual.';
        return;
      }

      this.hostSrv.crearAlojamiento(anfitrionId, payload, files).subscribe({
        next: (res) => {
          this.publicando = false;

          // Éxito: limpia y navega (ajusta ruta)
          this.form.reset();
          this.files = [];
        },
        error: (e) => {
          this.publicando = false;

          // Intenta leer mensaje de backend
          const msg =
            e?.error?.message ||
            e?.error?.detalle ||
            e?.error?.error ||
            'No se pudo crear el alojamiento.';
          this.error = msg;
        }
      });
    },
    error: () => {
      this.publicando = false;
      this.error = 'No se pudo obtener el usuario.';
    }
  });
}

  creandoServicio = false;

  crearServicio(): void {
    const nombreCtrl = this.form.get('nuevoServicioNombre');
    const descCtrl = this.form.get('nuevoServicioDescripcion');

    const nombre = (nombreCtrl?.value || '').trim();
    const descripcion = (descCtrl?.value || '').trim();

    if (!nombre) {
      this.error = 'Escribe un nombre para el nuevo servicio.';
      return;
    }

    this.creandoServicio = true;
    this.error = undefined;

    this.srvServicios.create$({ nombre, descripcion: descripcion || undefined, iconoUrl: null })
      .subscribe({
        next: (serv) => {
          this.creandoServicio = false;
          // limpiamos inputs
          nombreCtrl?.reset('');
          descCtrl?.reset('');

          // recargar lista de servicios
          this.servicios$ = this.srvServicios.getAll$();

          // y lo seleccionamos automáticamente
          const actuales: number[] = this.form.get('serviciosIds')?.value ?? [];
          this.form.patchValue({ serviciosIds: [...actuales, serv.id] });
        },
        error: (e) => {
          this.creandoServicio = false;
          const msg =
            e?.error?.message ||
            e?.error?.detalle ||
            e?.error?.error ||
            'No se pudo crear el servicio.';
          this.error = msg;
        }
      });
  }


}
