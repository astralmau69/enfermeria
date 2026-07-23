/**
 * Interconsultas por especialidad.
 *
 * Un servicio de hospitalización (donde está internado el paciente) solicita la
 * valoración de otra especialidad. Enfermería registra la solicitud, la agenda,
 * coordina y hace seguimiento del estado hasta que el especialista responde.
 *
 * Flujo: SOLICITADA → PROGRAMADA → REALIZADA (o ANULADA).
 */

export type EstadoInterconsulta = 'SOLICITADA' | 'PROGRAMADA' | 'REALIZADA' | 'ANULADA';
export type PrioridadInterconsulta = 'RUTINA' | 'URGENTE';

export interface Interconsulta {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    servicioOrigen: string;        // servicio donde está internado (ej. CIRUGIA)
    especialidadDestino: string;   // especialidad a la que se pide valoración
    cama?: string;
    motivo: string;                // motivo de la interconsulta
    prioridad: PrioridadInterconsulta;
    estado: EstadoInterconsulta;
    fechaSolicitud: string;        // YYYY-MM-DD
    horaSolicitud?: string;        // HH:mm
    fechaProgramada?: string;      // YYYY-MM-DD
    gestionadaPor?: string;        // enfermera que gestiona
    respuesta?: string;            // hallazgo / recomendación del especialista
}
