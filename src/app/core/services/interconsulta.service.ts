import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Interconsulta } from '../models/interconsulta.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class InterconsultaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/interconsultas`;

    getTodas(): Observable<Interconsulta[]> {
        return this.http.get<Interconsulta[]>(this.baseUrl);
    }

    getById(id: number): Observable<Interconsulta> {
        return this.http.get<Interconsulta>(`${this.baseUrl}/${id}`);
    }

    /** Solicita una nueva interconsulta. */
    crear(ic: Interconsulta): Observable<Interconsulta> {
        return this.http.post<Interconsulta>(this.baseUrl, ic);
    }

    /** Actualiza estado / programación / respuesta. */
    actualizar(id: number, ic: Partial<Interconsulta>): Observable<Interconsulta> {
        return this.http.put<Interconsulta>(`${this.baseUrl}/${id}`, ic);
    }
}
