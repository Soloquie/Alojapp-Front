import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Usuario } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;  

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/usuarios/me`);
  }

  actualizarMiPerfil(
    perfil: {
      nombre?: string | null;
      telefono?: string | null;
      fechaNacimiento?: string | null;
    },
    file?: File | null
  ): Observable<Usuario> {

    return this.http.put<Usuario>(`${this.base}/usuarios/me`, perfil).pipe(
      switchMap(usuarioActualizado => {
        if (!file) {
          return of(usuarioActualizado);
        }
        const fd = new FormData();
        fd.append('file', file);

        return this.http.post<string>(`${this.base}/usuarios/me/foto`, fd)
          .pipe(
            map(url => ({
              ...usuarioActualizado,
              fotoPerfilUrl: url
            }))
          );
      })
    );
  }
}
