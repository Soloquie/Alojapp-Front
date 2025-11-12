// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { RegistroUsuarioRequest, UsuarioDTO } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;
  private readonly AUTH_BASE = `${this.base}/auth`;
  private readonly tokenKey = 'alj_token';

  private _loggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem(this.tokenKey));
  loggedIn$ = this._loggedIn.asObservable();

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  login(dto: { email: string; password: string }): Observable<void> {
    return this.http.post(`${this.base}/auth/login`, dto, { observe: 'response' })
      .pipe(
        map((res: HttpResponse<any>) => {
          let token = (res.body as any)?.token;
          if (!token) {
            const authHeader = res.headers.get('Authorization') || res.headers.get('authorization');
            token = authHeader?.replace(/^Bearer\s+/i, '');
          }

          if (!token) throw new Error('No token recibido del servidor');

          localStorage.setItem(this.tokenKey, token);
          this._loggedIn.next(true);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this._loggedIn.next(false);
    this.router.navigateByUrl('/auth/login');
  }

  register(body: RegistroUsuarioRequest): Observable<HttpResponse<UsuarioDTO>> {
  return this.http.post<UsuarioDTO>(`${this.AUTH_BASE}/registro-huesped`, body, { observe: 'response' });
}

registerMultipart(request: RegistroUsuarioRequest, foto?: File): Observable<HttpResponse<UsuarioDTO>> {
  const fd = new FormData();
  fd.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (foto) fd.append('foto', foto);
  return this.http.post<UsuarioDTO>(`${this.AUTH_BASE}/registro-huesped`, fd, { observe: 'response' });
}
}
