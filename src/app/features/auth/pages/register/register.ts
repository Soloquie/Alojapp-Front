import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RegistroUsuarioRequest } from '../../../../core/models/auth.models';
import { HttpErrorResponse } from '@angular/common/http';

function minAgeValidator(minYears: number): ValidatorFn {
  return (control: AbstractControl) => {
    const v = control.value;
    if (!v) return null;
    const dob = new Date(v);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= minYears ? null : { minAge: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  form!: FormGroup;

  hide = true;
  loading = false;
  errorMsg: string | null = null;

  selectedFile: File | null = null;
  selectedFileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/) // mayúscula + número
      ]],
      phone: ['', [Validators.pattern(/^\+?[0-9]{10,20}$/)]],
      birthdate: ['', [Validators.required, minAgeValidator(18)]],
    });
  }

  get nombreCtrl(): FormControl { return this.form.get('nombre') as FormControl; }
  get emailCtrl(): FormControl { return this.form.get('email') as FormControl; }
  get passwordCtrl(): FormControl { return this.form.get('password') as FormControl; }
  get phoneCtrl(): FormControl { return this.form.get('phone') as FormControl; }
  get birthdateCtrl(): FormControl { return this.form.get('birthdate') as FormControl; }

  togglePasswordVisibility() { this.hide = !this.hide; }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    this.selectedFile = file ?? null;
    this.selectedFileName = file ? file.name : null;
  }

private toIsoDate(d: any): string {
  if (!d) return '';
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;            
    const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);        // dd/MM/yyyy
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  }
  const dt = new Date(d);
  if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return '';
}

  submit() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.loading = true; this.errorMsg = null;

  const req: RegistroUsuarioRequest = {
    nombre: this.nombreCtrl.value,
    email: this.emailCtrl.value,
    password: this.passwordCtrl.value,
    telefono: this.phoneCtrl.value || null,
    fechaNacimiento: this.toIsoDate(this.birthdateCtrl.value),
    fotoPerfilUrl: undefined
  };

  const obs = this.selectedFile
    ? this.auth.registerMultipart(req, this.selectedFile)   
    : this.auth.register(req);

  obs.subscribe({
    next: (res) => {
      this.loading = false;
      if (res.status === 200 || res.status === 201) {
        this.router.navigate(['/auth/login'], { queryParams: { registered: 1 }});
      } else {
        this.errorMsg = 'No se pudo crear la cuenta';
      }
    },
    error: (e: HttpErrorResponse) => {
  this.loading = false;
  console.error('HTTP error', {
    status: e.status,
    statusText: e.statusText,
    url: e.url,
    message: e.message,
    error: e.error
  });
  this.errorMsg =
    e?.error?.message || e?.error?.detail ||
    (e.status === 409 ? 'El email ya está registrado.' :
     e.status === 400 ? 'Datos inválidos.' :
     e.statusText || 'No se pudo crear la cuenta');
}
  });
}


}
