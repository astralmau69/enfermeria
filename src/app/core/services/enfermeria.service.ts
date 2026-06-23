import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotaDiariaEnfermeria, EntradaNotaEnfermeria, RegistroMedicamentos, CuadroSignosVitales } from '../models/enfermeria.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class EnfermeriaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/enfermeria`;

    // Notas Diarias
    getNotasByPaciente(pacienteId: number): Observable<NotaDiariaEnfermeria> {
        return this.http.get<NotaDiariaEnfermeria>(`${this.baseUrl}/notas/paciente/${pacienteId}`);
    }

    addNota(pacienteId: number, entrada: EntradaNotaEnfermeria): Observable<EntradaNotaEnfermeria> {
        return this.http.post<EntradaNotaEnfermeria>(`${this.baseUrl}/notas/paciente/${pacienteId}`, entrada);
    }

    // Medicamentos
    getMedicamentosByPaciente(pacienteId: number): Observable<RegistroMedicamentos> {
        return this.http.get<RegistroMedicamentos>(`${this.baseUrl}/medicamentos/paciente/${pacienteId}`);
    }

    saveMedicamentos(registro: RegistroMedicamentos): Observable<RegistroMedicamentos> {
        return this.http.post<RegistroMedicamentos>(`${this.baseUrl}/medicamentos`, registro);
    }

    // Signos Vitales
    getSignosVitalesByPaciente(pacienteId: number): Observable<CuadroSignosVitales> {
        return this.http.get<CuadroSignosVitales>(`${this.baseUrl}/signos-vitales/paciente/${pacienteId}`);
    }

    saveSignosVitales(cuadro: CuadroSignosVitales): Observable<CuadroSignosVitales> {
        return this.http.post<CuadroSignosVitales>(`${this.baseUrl}/signos-vitales`, cuadro);
    }
}
