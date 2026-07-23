/**
 * Procedimientos de enfermería en Consulta Externa (ambulatorio).
 *
 * Lo que la enfermera realiza en el área ambulatoria sin internación:
 * inyectables, nebulizaciones, curaciones ambulatorias e inmunizaciones/vacunas.
 * Cada procedimiento es un registro independiente del día.
 */

export type TipoProcedimiento = 'INYECTABLE' | 'NEBULIZACION' | 'CURACION' | 'VACUNA';
export type EstadoProcedimiento = 'PENDIENTE' | 'REALIZADO';

export interface ProcedimientoAmbulatorio {
    id?: number;
    pacienteId?: number;
    pacienteNombre: string;    // se guarda plano para la lista del día
    carnetAsegurado?: string;
    tipo: TipoProcedimiento;
    detalle: string;           // ej. "Ceftriaxona 1g IM", "Salbutamol + bromuro"
    fecha: string;             // YYYY-MM-DD
    hora?: string;             // HH:mm
    estado: EstadoProcedimiento;
    enfermera?: string;
    observacion?: string;
}

/** Catálogo de tipos con etiqueta e ícono (para KPIs y selects). */
export const TIPOS_PROCEDIMIENTO: { value: TipoProcedimiento; label: string; icon: string }[] = [
    { value: 'INYECTABLE', label: 'Inyectable', icon: 'pi-bolt' },
    { value: 'NEBULIZACION', label: 'Nebulización', icon: 'pi-cloud' },
    { value: 'CURACION', label: 'Curación', icon: 'pi-plus-circle' },
    { value: 'VACUNA', label: 'Vacuna / Inmunización', icon: 'pi-shield' }
];
