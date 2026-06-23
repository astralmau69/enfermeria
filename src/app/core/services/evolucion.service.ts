import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EvolucionTratamiento, EntradaEvolucion, ExamenComplementario, EntradaExamen } from '../models/evolucion.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class EvolucionService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api`;

    getEvolucionByPaciente(pacienteId: number): Observable<EvolucionTratamiento> {
        return this.http.get<EvolucionTratamiento>(`${this.baseUrl}/evolucion/paciente/${pacienteId}`);
    }

    addEntradaEvolucion(pacienteId: number, entrada: EntradaEvolucion): Observable<EntradaEvolucion> {
        return this.http.post<EntradaEvolucion>(`${this.baseUrl}/evolucion/paciente/${pacienteId}`, entrada);
    }

    getExamenesByPaciente(pacienteId: number): Observable<ExamenComplementario> {
        return this.http.get<ExamenComplementario>(`${this.baseUrl}/examenes/paciente/${pacienteId}`);
    }

    addEntradaExamen(pacienteId: number, entrada: EntradaExamen): Observable<EntradaExamen> {
        return this.http.post<EntradaExamen>(`${this.baseUrl}/examenes/paciente/${pacienteId}`, entrada);
    }
}
