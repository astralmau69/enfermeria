/**
 * Consulta Externa — Proceso de enfermería ambulatorio.
 *
 * Flujo: Recepción (turno) → Toma de constantes vitales basales → Formulario 002
 * → pasa al médico. Cada consulta es un registro independiente del día (no es
 * 1-por-paciente como las hojas de piso).
 */
import { ESPECIALIDADES } from './especialidad.model';

export type EstadoConsulta = 'EN_ESPERA' | 'EN_PREPARACION' | 'LISTO_MEDICO' | 'ATENDIDO';
export type PrioridadConsulta = 'NORMAL' | 'PREFERENCIAL';

/** Constantes vitales basales tomadas por enfermería antes del médico. */
export interface ConstantesBasales {
    paSistolica?: number;
    paDiastolica?: number;
    fc?: number;          // frecuencia cardíaca (lpm)
    fr?: number;          // frecuencia respiratoria (rpm)
    temperatura?: number; // °C
    saturacion?: number;  // SatO2 %
    peso?: number;        // kg
    talla?: number;       // cm
    imc?: number;         // calculado
    glucemia?: number;    // mg/dL (capilar, opcional)
}

export interface ConsultaExterna {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    fecha: string;          // YYYY-MM-DD
    numeroTurno: string;    // p.ej. CE-014
    especialidad: string;   // MEDICINA INTERNA, CARDIOLOGIA, ...
    medico?: string;
    motivoConsulta?: string;
    estado: EstadoConsulta;
    prioridad: PrioridadConsulta;
    constantes?: ConstantesBasales;
    alergias?: string;
    antecedentes?: string;
    observaciones?: string;
    enfermeraNombre?: string;
    horaRecepcion?: string;   // HH:mm
    horaConstantes?: string;  // HH:mm
}

/** Especialidades disponibles en consulta externa (derivadas del catálogo COSSMIL). */
export const ESPECIALIDADES_CE: string[] = ESPECIALIDADES.map((e) => e.nombre);
