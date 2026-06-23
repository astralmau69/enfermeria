import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class PacienteService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/pacientes`;

    getAll(): Observable<Paciente[]> {
        return this.http.get<Paciente[]>(this.baseUrl);
    }

    getById(id: number): Observable<Paciente> {
        return this.http.get<Paciente>(`${this.baseUrl}/${id}`);
    }

    create(paciente: Paciente): Observable<Paciente> {
        return this.http.post<Paciente>(this.baseUrl, paciente);
    }

    update(id: number, paciente: Paciente): Observable<Paciente> {
        return this.http.put<Paciente>(`${this.baseUrl}/${id}`, paciente);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
