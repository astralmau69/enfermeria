/**
 * Emergencias — Área de urgencias con clasificación de triage (Manchester).
 *
 * La enfermera de triage recibe al paciente, clasifica su gravedad por nivel
 * (color + nombre + tiempo objetivo de atención), toma signos vitales y hace el
 * seguimiento hasta el destino final (alta, observación o internación).
 *
 * IMPORTANTE (accesibilidad): el nivel NUNCA se muestra solo por color; siempre
 * acompañado de su nombre y un ícono.
 */

export type NivelTriage = 'ROJO' | 'NARANJA' | 'AMARILLO' | 'VERDE' | 'AZUL';
export type EstadoEmergencia = 'EN_TRIAGE' | 'EN_ATENCION' | 'OBSERVACION' | 'ALTA' | 'INTERNACION';

/** Signos vitales tomados en emergencias. */
export interface SignosEmergencia {
    paSistolica?: number;
    paDiastolica?: number;
    fc?: number;          // frecuencia cardíaca
    fr?: number;          // frecuencia respiratoria
    temperatura?: number; // °C
    saturacion?: number;  // SatO2 %
    glucemia?: number;    // mg/dL
    glasgow?: number;     // 3–15
    dolor?: number;       // EVA 0–10
}

export interface PacienteEmergencia {
    id?: number;
    pacienteId?: number;
    pacienteNombre: string;
    carnetAsegurado?: string;
    edad?: number;
    sexo?: 'M' | 'F';
    motivo: string;                 // motivo de consulta
    nivelTriage: NivelTriage;
    estado: EstadoEmergencia;
    fecha: string;                  // YYYY-MM-DD
    horaLlegada: string;            // HH:mm
    signos?: SignosEmergencia;
    enfermera?: string;
    observaciones?: string;
    destino?: string;               // servicio/UTI si se interna, o nota de alta
}

/** Catálogo de niveles de triage Manchester (color + nombre + tiempo). */
export const NIVELES_TRIAGE: {
    nivel: NivelTriage; label: string; descripcion: string; tiempo: string; icon: string; orden: number;
}[] = [
    { nivel: 'ROJO', label: 'Rojo — Reanimación', descripcion: 'Atención inmediata, riesgo vital', tiempo: 'Inmediato', icon: 'pi-exclamation-triangle', orden: 0 },
    { nivel: 'NARANJA', label: 'Naranja — Emergencia', descripcion: 'Muy urgente', tiempo: '≤ 10 min', icon: 'pi-exclamation-circle', orden: 1 },
    { nivel: 'AMARILLO', label: 'Amarillo — Urgente', descripcion: 'Urgente', tiempo: '≤ 60 min', icon: 'pi-clock', orden: 2 },
    { nivel: 'VERDE', label: 'Verde — Menos urgente', descripcion: 'Estándar', tiempo: '≤ 120 min', icon: 'pi-check-circle', orden: 3 },
    { nivel: 'AZUL', label: 'Azul — No urgente', descripcion: 'No urgente', tiempo: '≤ 240 min', icon: 'pi-info-circle', orden: 4 }
];

export function nivelInfo(n: NivelTriage) {
    return NIVELES_TRIAGE.find((x) => x.nivel === n)!;
}
