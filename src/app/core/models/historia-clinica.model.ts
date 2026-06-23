import { VServicios } from './paciente.model';

export interface AdmisionHospitalaria {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    fecha: string;
    horaSolicitud: string;
    horaEntrega?: string;
    estado: string;
    servicio: string;
    cama?: string;
    vServicios: VServicios;
    diagnosticoAdmision: string;
    medicoInterna: string;
    clavemedico?: string;
    firma?: string;
}

export interface InformeEstadistico {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    establecimiento: string;
    localidad: string;
    esNuevo: boolean;
    ingreso: IngresoEstadistico;
    egreso?: EgresoEstadistico;
}

export interface IngresoEstadistico {
    tipoPrestacion: string;
    unidadSanitariaOrigen?: string;
    fechaIngreso: string;
    horaIngreso: string;
    sala: string;
    cama: string;
    piezaNumero?: string;
    diagnosticoPresuntivo: string;
    codigoDiagnostico?: string;
    tipoAdmision: 'CONSULTORIO_EXTERNO' | 'EMERGENCIA' | 'OTRO';
    medicoSolicita: string;
    claveMedico?: string;
}

export type CausaAlta = 'MEDICA' | 'SOLICITADA' | 'ABANDONO' | 'DISCIPLINARIA' | 'TRANSFERENCIA' | 'TERMINACION_DERECHO';
export type CondicionEgreso = 'SANO' | 'MEJORADO' | 'NO_MEJORADO' | 'NO_TRATADO' | 'MUERTE_INSTITUCIONAL';

export interface EgresoEstadistico {
    fechaEgreso: string;
    horaEgreso?: string;
    servicio?: string;
    sala?: string;
    cama?: string;
    diagnosticoDefinitivo: string;
    diagnosticoDefinitivoB?: string;
    codigoDiagnostico?: string;
    codigoDiagnosticoB?: string;
    fechaParto?: string;
    causaExterna?: string;
    intervencionQuirurgica?: string;
    nombreTecnico?: string;
    fechaIntervencion?: string;
    horaIntervencion?: string;
    nombreCirujano?: string;
    claveCirujano?: string;
    nombreAnestesiologo?: string;
    claveAnestesiologo?: string;
    tipoAnestesia?: string;
    protocoloOperatorio?: boolean;
    autopsia?: boolean;
    causaAlta: CausaAlta;
    condicionEgreso: CondicionEgreso;
    diasEstada: number;
    medicoTratante?: string;
    recienNacido?: RecienNacido;
}

export interface RecienNacido {
    tipo: 'SIMPLE' | 'GEMELAR';
    sexo: 'M' | 'F';
    condicionNacer: 'VIVO' | 'MUERTO';
    pesoGramos: number;
    tallaCm: number;
    condicionEgreso: 'VIVO' | 'MUERTO';
    fechaEgreso: string;
    diasEstada: number;
    eutrofico?: boolean;
    distrofico?: boolean;
    observaciones?: string;
}

export interface ConsentimientoInformado {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    fecha: string;
    hora: string;
    vServicios: VServicios;
    firmante: FirmaConsentimiento;
    altaSolicitada?: AltaSolicitada;
}

export interface FirmaConsentimiento {
    nombre: string;
    ci: string;
    tipo: 'PACIENTE' | 'FAMILIAR' | 'TESTIGO';
}

export interface AltaSolicitada {
    nombre: string;
    ci: string;
    tipo: 'PACIENTE' | 'FAMILIAR' | 'TESTIGO';
}
