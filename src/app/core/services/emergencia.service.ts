import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PacienteEmergencia } from '../models/emergencia.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class EmergenciaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/emergencias`;

    getTodas(): Observable<PacienteEmergencia[]> {
        return this.http.get<PacienteEmergencia[]>(this.baseUrl);
    }

    /** Registra una nueva llegada a emergencias (triage). */
    crear(p: PacienteEmergencia): Observable<PacienteEmergencia> {
        return this.http.post<PacienteEmergencia>(this.baseUrl, p);
    }

    /** Actualiza estado / signos / destino. */
    actualizar(id: number, p: Partial<PacienteEmergencia>): Observable<PacienteEmergencia> {
        return this.http.put<PacienteEmergencia>(`${this.baseUrl}/${id}`, p);
    }
}
