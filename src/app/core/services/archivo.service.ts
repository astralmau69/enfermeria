import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ArchivoResponseDTO {
  idArchivo: number;
  nombreArchivo: string;
  nombreArchivoOriginal: string;
  tipoArchivo: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  private apiUrl = `${environment.apiUrl}/archivos`;

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<ArchivoResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ArchivoResponseDTO>(`${this.apiUrl}/upload`, formData);
  }

  getDownloadUrl(id: number): string {
    return `${this.apiUrl}/download/${id}`;
  }
}
