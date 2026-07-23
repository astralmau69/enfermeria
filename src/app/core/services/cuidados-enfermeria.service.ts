import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BalanceHidrico, ControlDispositivos, RegistroCuraciones, ControlGlucemia } from '../models/cuidados-enfermeria.model';
import { environment } from '../../../environments/environment.development';

/**
 * Hojas de cuidados de enfermería de cabecera (1 documento por paciente):
 * balance hídrico, dispositivos (sondas/vías/catéteres), curaciones y glucometría.
 * Sigue el patrón get-or-create + upsert del cuadro de signos vitales.
 */
@Injectable({ providedIn: 'root' })
export class CuidadosEnfermeriaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/enfermeria`;

    // ── Balance hídrico ──────────────────────────────────────────────────────
    getBalance(pacienteId: number): Observable<BalanceHidrico> {
        return this.http.get<BalanceHidrico>(`${this.baseUrl}/balance/paciente/${pacienteId}`);
    }
    saveBalance(doc: BalanceHidrico): Observable<BalanceHidrico> {
        return this.http.post<BalanceHidrico>(`${this.baseUrl}/balance`, doc);
    }

    // ── Dispositivos (sondas, vías y catéteres) ──────────────────────────────
    getDispositivos(pacienteId: number): Observable<ControlDispositivos> {
        return this.http.get<ControlDispositivos>(`${this.baseUrl}/dispositivos/paciente/${pacienteId}`);
    }
    saveDispositivos(doc: ControlDispositivos): Observable<ControlDispositivos> {
        return this.http.post<ControlDispositivos>(`${this.baseUrl}/dispositivos`, doc);
    }

    // ── Curaciones / heridas ─────────────────────────────────────────────────
    getCuraciones(pacienteId: number): Observable<RegistroCuraciones> {
        return this.http.get<RegistroCuraciones>(`${this.baseUrl}/curaciones/paciente/${pacienteId}`);
    }
    saveCuraciones(doc: RegistroCuraciones): Observable<RegistroCuraciones> {
        return this.http.post<RegistroCuraciones>(`${this.baseUrl}/curaciones`, doc);
    }

    // ── Glucometría / control glucémico ──────────────────────────────────────
    getGlucemia(pacienteId: number): Observable<ControlGlucemia> {
        return this.http.get<ControlGlucemia>(`${this.baseUrl}/glucemia/paciente/${pacienteId}`);
    }
    saveGlucemia(doc: ControlGlucemia): Observable<ControlGlucemia> {
        return this.http.post<ControlGlucemia>(`${this.baseUrl}/glucemia`, doc);
    }
}
