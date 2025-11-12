import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { AnfitrionService, ConvertirmeAnfitrionReq } from '../../../core/services/anfitrion';
import { ActivatedRoute } from '@angular/router';
// ...

@Component({
  selector: 'app-ser-anfitrion',
  templateUrl: './ser-anfitrion.html',
    styleUrls: ['./ser-anfitrion.scss'],
  standalone:false
})
export class SerAnfitrionComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private anfitrionSrv = inject(AnfitrionService);
  private route = inject(ActivatedRoute);

  cargando = false;
  error?: string;
  okMsg?: string;

  docLinks: string[] = [];

  form = this.fb.group({
    descripcionPersonal: ['', [Validators.required, Validators.maxLength(1000)]],
    // lo llenaremos automáticamente con el primer link si existe
    documentosLegalesUrl: [''],
    // opcional; por defecto hoy
    fechaRegistro: [this.today()]
  });

  ngOnInit(): void {
    this.auth.loggedIn$.pipe(take(1)).subscribe(isLogged => {
      if (!isLogged) {
        const redirect = encodeURIComponent('/ser-anfitrion');
        this.router.navigate(['/auth/login'], { queryParams: { redirect } });
      }
    });
  }

  private today(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
    }

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    this.docLinks = [];

    if (!files || !files.length) {
      this.form.patchValue({ documentosLegalesUrl: '' });
      return;
    }

    // Convertimos a links locales (no se suben)
    for (const f of Array.from(files)) {
      const url = URL.createObjectURL(f);
      this.docLinks.push(url);
    }

    this.form.patchValue({ documentosLegalesUrl: this.docLinks[0] || '' });
  }

  submit() {
    this.error = undefined;
    this.okMsg = undefined;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const body: ConvertirmeAnfitrionReq = {
      descripcionPersonal: this.form.value.descripcionPersonal!,
      documentosLegalesUrl: this.form.value.documentosLegalesUrl || null,
      fechaRegistro: this.form.value.fechaRegistro || null
    };

    this.cargando = true;
    this.anfitrionSrv.convertirme(body).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.okMsg = '¡Listo! Ya eres anfitrión.';
        this.router.navigate(['./exito'], { relativeTo: this.route });
      },
      error: (e) => {
        this.cargando = false;
        this.error = e?.error?.message || 'No se pudo completar la solicitud.';
      }
    });
  }
}
