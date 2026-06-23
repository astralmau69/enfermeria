import { Injectable, inject, signal, effect } from '@angular/core';
import { PacienteService } from './paciente.service';
import { Paciente } from '../models/paciente.model';

const STORAGE_KEY = 'cossmil_paciente_activo';

/**
 * PacienteActivoService — Contexto de "paciente activo" (estilo historia clínica).
 *
 * Permite que las hojas se abran desde el menú sin pasar por la lista: el
 * paciente seleccionado (en el topbar o en el hub) queda activo y persiste.
 */
@Injectable({ providedIn: 'root' })
export class PacienteActivoService {
    private pacienteService = inject(PacienteService);

    /** Id del paciente activo. Por defecto el primero (siempre existe en el seed). */
    readonly pacienteId = signal<number | null>(this.loadInicial());

    /** Datos completos del paciente activo (se cargan al cambiar el id). */
    readonly paciente = signal<Paciente | null>(null);

    constructor() {
        effect(() => {
            const id = this.pacienteId();
            if (id == null) {
                this.paciente.set(null);
                return;
            }
            this.persist(id);
            this.pacienteService.getById(id).subscribe({
                next: (p) => this.paciente.set(p),
                error: () => this.paciente.set(null)
            });
        });
    }

    /** Fija el paciente activo (sin recargar si es el mismo). */
    setId(id: number): void {
        if (this.pacienteId() !== id) {
            this.pacienteId.set(id);
        }
    }

    private loadInicial(): number | null {
        if (typeof window === 'undefined' || !window.localStorage) return 1;
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? +raw : 1;
    }

    private persist(id: number): void {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(STORAGE_KEY, String(id));
        }
    }
}
