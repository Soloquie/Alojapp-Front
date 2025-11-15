import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Observable } from 'rxjs';

export interface CrearComentarioPayload {
  reservaId: number;
  calificacion: number;   // 1..5
  comentarioTexto: string;
}
export interface ComentarioDTO {
  id: number;
  comentarioId?: number;
  autorNombre?: string;
  usuarioNombre?: string;
  autorFotoUrl?: string;
  usuarioFotoUrl?: string;
  calificacion: number;
  comentarioTexto?: string;
  comentario?: string;
  fechaComentario?: string;
  fechaCreacion?: string;
  fecha?: string;
}

export interface PaginacionResponse<T> {
  contenido?: T[];      
  content?: T[];
  items?: T[];
  resultados?: T[];
  totalElementos?: number;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private base = `${environment.apiUrl}/comentarios`;

  constructor(private http: HttpClient) {}

  crear(body: CrearComentarioPayload): Observable<any> {
    return this.http.post<any>(this.base, body);
  }

  listarPorAlojamiento(
    alojamientoId: number,
    pagina = 0,
    tamano = 20
  ): Observable<PaginacionResponse<ComentarioDTO>> {
    return this.http.get<PaginacionResponse<ComentarioDTO>>(
      `${this.base}/alojamiento/${alojamientoId}`,
      { params: { pagina, tamano } }
    );
  }
}
