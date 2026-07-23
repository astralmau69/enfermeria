import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcedimientoAmbulatorio } from '../models/procedimiento-ambulatorio.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ProcedimientoAmbulatorioService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/procedimientos-ambulatorios`;

    getTodos(): Observable<ProcedimientoAmbulatorio[]> {
        return this.http.get<ProcedimientoAmbulatorio[]>(this.baseUrl);
    }

    crear(proc: ProcedimientoAmbulatorio): Observable<ProcedimientoAmbulatorio> {
        return this.http.post<ProcedimientoAmbulatorio>(this.baseUrl, proc);
    }

    actualizar(id: number, proc: Partial<ProcedimientoAmbulatorio>): Observable<ProcedimientoAmbulatorio> {
        return this.http.put<ProcedimientoAmbulatorio>(`${this.baseUrl}/${id}`, proc);
    }
}
