import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cama } from '../models/piso.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class PisoService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/camas`;

    /** Camas de un piso (mapa de camas). */
    getCamasByPiso(pisoNumero: number): Observable<Cama[]> {
        return this.http.get<Cama[]>(`${this.baseUrl}/piso/${pisoNumero}`);
    }

    /** Todas las camas (para elegir destino de un traslado entre sectores). */
    getTodas(): Observable<Cama[]> {
        return this.http.get<Cama[]>(this.baseUrl);
    }

    /** Actualiza el estado/ocupante de una cama. */
    actualizarCama(id: number, cama: Partial<Cama>): Observable<Cama> {
        return this.http.put<Cama>(`${this.baseUrl}/${id}`, cama);
    }
}
