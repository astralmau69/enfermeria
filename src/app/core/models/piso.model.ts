/**
 * Estructura del hospital — Pisos (servicios), camas y turnos.
 *
 * El Hospital Militar Central tiene 9 pisos de hospitalización; cada piso es un
 * servicio. Se simula a fondo el PISO 1 — CIRUGÍA (mapa de camas con pacientes
 * quirúrgicos y día post-operatorio). El trabajo se organiza en 3 turnos.
 */

export type EstadoCama = 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'LIMPIEZA' | 'BLOQUEADA';
export type TurnoNombre = 'MANANA' | 'TARDE' | 'NOCHE';

export interface Piso {
    numero: number;   // 1..9
    nombre: string;   // 'Cirugía'
    sigla: string;    // 'CIR'
    icon: string;     // ícono PrimeNG
}

export interface Cama {
    id: number;
    pisoNumero: number;
    codigo: string;             // 'C-101'
    estado: EstadoCama;
    pacienteId?: number;        // ocupante (enlaza a sus hojas)
    procedimiento?: string;     // cirugía / diagnóstico
    diaPostOp?: number;         // POD; 0 = día de cirugía / pre-op
    preOp?: boolean;            // programado, aún sin operar
    observacion?: string;
    reservaNota?: string;       // motivo de la reserva (cama RESERVADA)
}

export interface TurnoInfo {
    key: TurnoNombre;
    label: string;
    horario: string;
    icon: string;
}

/** Los 9 pisos del hospital (Piso 1 = Cirugía, definido por el usuario). */
export const PISOS: Piso[] = [
    { numero: 1, nombre: 'Cirugía', sigla: 'CIR', icon: 'pi-plus-circle' },
    { numero: 2, nombre: 'Medicina Interna', sigla: 'MIN', icon: 'pi-briefcase' },
    { numero: 3, nombre: 'Traumatología', sigla: 'TRA', icon: 'pi-wrench' },
    { numero: 4, nombre: 'Ginecología y Obstetricia', sigla: 'GIN', icon: 'pi-users' },
    { numero: 5, nombre: 'Pediatría', sigla: 'PED', icon: 'pi-star' },
    { numero: 6, nombre: 'Cardiología', sigla: 'CAR', icon: 'pi-heart-fill' },
    { numero: 7, nombre: 'Oncología', sigla: 'ONC', icon: 'pi-shield' },
    { numero: 8, nombre: 'Neurología', sigla: 'NEU', icon: 'pi-bolt' },
    { numero: 9, nombre: 'Terapia Intensiva (UCI)', sigla: 'UCI', icon: 'pi-exclamation-triangle' }
];

/** Los 3 turnos de enfermería. */
export const TURNOS: TurnoInfo[] = [
    { key: 'MANANA', label: 'Mañana', horario: '07:00 – 14:00', icon: 'pi-sun' },
    { key: 'TARDE', label: 'Tarde', horario: '14:00 – 21:00', icon: 'pi-cloud' },
    { key: 'NOCHE', label: 'Noche', horario: '21:00 – 07:00', icon: 'pi-moon' }
];

/** Rol de turno (enfermera + auxiliar) por piso y turno — datos demo. */
export interface RolTurno {
    enfermera: string;
    auxiliar: string;
}

const ROSTER: Record<number, Record<TurnoNombre, RolTurno>> = {
    1: {
        MANANA: { enfermera: 'Lic. Jacquelin Silva Quispe', auxiliar: 'Aux. Rosa Mamani C.' },
        TARDE: { enfermera: 'Lic. María Fernanda Rocha V.', auxiliar: 'Aux. Juan Pérez T.' },
        NOCHE: { enfermera: 'Lic. Pedro Gutiérrez Lima', auxiliar: 'Aux. Ana Condori Q.' }
    }
};

/** Devuelve la enfermera/auxiliar de turno para un piso (genérico si no hay roster). */
export function rolDeTurno(pisoNumero: number, turno: TurnoNombre): RolTurno {
    return ROSTER[pisoNumero]?.[turno] ?? { enfermera: 'Por asignar', auxiliar: 'Por asignar' };
}

/** Turno actual según la hora (07–14 Mañana · 14–21 Tarde · resto Noche). */
export function turnoActual(d: Date = new Date()): TurnoNombre {
    const h = d.getHours();
    if (h >= 7 && h < 14) return 'MANANA';
    if (h >= 14 && h < 21) return 'TARDE';
    return 'NOCHE';
}
