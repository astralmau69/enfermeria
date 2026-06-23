import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdmisionHospitalaria, InformeEstadistico, ConsentimientoInformado } from '../models/historia-clinica.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api`;

    // Admisión Hospitalaria
    getAdmisionesByPaciente(pacienteId: number): Observable<AdmisionHospitalaria[]> {
        return this.http.get<AdmisionHospitalaria[]>(`${this.baseUrl}/admision/paciente/${pacienteId}`);
    }

    createAdmision(admision: AdmisionHospitalaria): Observable<AdmisionHospitalaria> {
        return this.http.post<AdmisionHospitalaria>(`${this.baseUrl}/admision`, admision);
    }

    updateAdmision(id: number, admision: AdmisionHospitalaria): Observable<AdmisionHospitalaria> {
        return this.http.put<AdmisionHospitalaria>(`${this.baseUrl}/admision/${id}`, admision);
    }

    // Informe Estadístico
    getEstadisticoByPaciente(pacienteId: number): Observable<InformeEstadistico> {
        return this.http.get<InformeEstadistico>(`${this.baseUrl}/estadistico/paciente/${pacienteId}`);
    }

    saveEstadistico(informe: InformeEstadistico): Observable<InformeEstadistico> {
        return this.http.post<InformeEstadistico>(`${this.baseUrl}/estadistico`, informe);
    }

    // Consentimiento Informado
    getConsentimientoByPaciente(pacienteId: number): Observable<ConsentimientoInformado> {
        return this.http.get<ConsentimientoInformado>(`${this.baseUrl}/consentimiento/paciente/${pacienteId}`);
    }

    saveConsentimiento(consentimiento: ConsentimientoInformado): Observable<ConsentimientoInformado> {
        return this.http.post<ConsentimientoInformado>(`${this.baseUrl}/consentimiento`, consentimiento);
    }
}
