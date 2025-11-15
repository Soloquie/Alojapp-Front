import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../../environments/environments';
import { RegistroUsuarioRequest, UsuarioDTO } from '../models/auth.models';

export interface LoginResponse {
  token: string;
  tokenType?: string;
  usuarioId?: number;
  nombre?: string;
  email?: string;
  rol?: string;          
  expiresIn?: number;
}

type UserMin = Pick<LoginResponse, 'usuarioId' | 'nombre' | 'email' | 'rol'>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;
  private readonly AUTH_BASE = `${this.base}/auth`;

  private readonly TOKEN_KEY = 'alj_token';
  private readonly ROLE_KEY  = 'alj_role';
  private readonly USER_KEY  = 'alj_user';

  private _loggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem(this.TOKEN_KEY));
  private _role     = new BehaviorSubject<string | null>(localStorage.getItem(this.ROLE_KEY));
  private _user     = new BehaviorSubject<UserMin | null>(this.readUserFromStorage());

  /** Observables públicos */
  readonly loggedIn$ = this._loggedIn.asObservable();
  readonly role$:     Observable<string | null> = this._role.asObservable();
  readonly user$ = this._user.asObservable();

  /** Helpers síncronos */
  snapshotLoggedIn(): boolean { return this._loggedIn.value; }
  snapshotRole(): string | null { return this._role.value; }

  /** Conveniencia: observable booleano de si es anfitrión */
  readonly isHost$ = this.role$.pipe(map(r => (r ?? '').toUpperCase() === 'ANFITRION'));

  get token(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  isLoggedIn(): boolean { return !!this.token; }

  login(dto: { email: string; password: string }): Observable<void> {
    return this.http.post<LoginResponse>(`${this.AUTH_BASE}/login`, dto, { observe: 'response' })
      .pipe(
        map((res: HttpResponse<LoginResponse>) => {
          const body = res.body;
          let token = body?.token;

          if (!token) {
            const authHeader = res.headers.get('Authorization') || res.headers.get('authorization');
            token = authHeader?.replace(/^Bearer\s+/i, '');
          }
          if (!token) throw new Error('No token recibido del servidor');

          const role = (body?.rol ?? '').toUpperCase() || null;
          const userMin: UserMin | null = body ? {
            usuarioId: body.usuarioId,
            nombre:    body.nombre,
            email:     body.email,
            rol:       role || undefined
          } : null;

          // Persistir
          localStorage.setItem(this.TOKEN_KEY, token);
          if (role) localStorage.setItem(this.ROLE_KEY, role); else localStorage.removeItem(this.ROLE_KEY);
          if (userMin) localStorage.setItem(this.USER_KEY, JSON.stringify(userMin));
          else localStorage.removeItem(this.USER_KEY);

          // Notificar
          this._loggedIn.next(true);
          this._role.next(role);
          this._user.next(userMin || null);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._loggedIn.next(false);
    this._role.next(null);
    this._user.next(null);
    this.router.navigateByUrl('/auth/login');
  }

  register(body: RegistroUsuarioRequest) {
    return this.http.post<UsuarioDTO>(`${this.AUTH_BASE}/registro-huesped`, body, { observe: 'response' });
  }

  registerMultipart(request: RegistroUsuarioRequest, foto?: File) {
    const fd = new FormData();
    fd.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (foto) fd.append('foto', foto);
    return this.http.post<UsuarioDTO>(`${this.AUTH_BASE}/registro-huesped`, fd, { observe: 'response' });
  }

  private readUserFromStorage(): UserMin | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserMin; } catch { return null; }
  }
}
