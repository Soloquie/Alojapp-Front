import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Observable } from 'rxjs';

export type ConvertirmeAnfitrionReq = {
  descripcionPersonal: string;
  documentosLegalesUrl?: string | null;
  fechaRegistro?: string | null; // yyyy-MM-dd
};

@Injectable({ providedIn: 'root' })
export class AnfitrionService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  convertirme(body: ConvertirmeAnfitrionReq): Observable<any> {
    return this.http.post<any>(`${this.base}/usuarios/me/anfitrion`, body);
  }

}
