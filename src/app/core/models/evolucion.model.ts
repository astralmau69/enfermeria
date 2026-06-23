export interface EvolucionTratamiento {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    entradas: EntradaEvolucion[];
}

export interface EntradaEvolucion {
    id?: number;
    fecha: string;
    hora: string;
    subjetivo: string;
    objetivo: string;
    analisis: string;
    plan: string;
    tratamiento?: string;
    medicoId?: number;
    medicoNombre?: string;
}

export interface ExamenComplementario {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    entradas: EntradaExamen[];
}

export interface EntradaExamen {
    id?: number;
    fecha: string;
    hora: string;
    tipo: 'TEXTO' | 'ADJUNTO';
    descripcion?: string;
    archivoUrl?: string;
    archivoNombre?: string;
}
