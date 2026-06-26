import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConsultaExterna } from '../models/consulta-externa.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ConsultaExternaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/consulta-externa`;

    /** Cola/turnos de consulta externa (del día). */
    getTodas(): Observable<ConsultaExterna[]> {
        return this.http.get<ConsultaExterna[]>(this.baseUrl);
    }

    getById(id: number): Observable<ConsultaExterna> {
        return this.http.get<ConsultaExterna>(`${this.baseUrl}/${id}`);
    }

    /** Recepción: registra un paciente en la cola. */
    crear(consulta: ConsultaExterna): Observable<ConsultaExterna> {
        return this.http.post<ConsultaExterna>(this.baseUrl, consulta);
    }

    /** Actualiza constantes / estado de la consulta. */
    actualizar(id: number, consulta: Partial<ConsultaExterna>): Observable<ConsultaExterna> {
        return this.http.put<ConsultaExterna>(`${this.baseUrl}/${id}`, consulta);
    }
}
