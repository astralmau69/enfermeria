import { VServicios } from './paciente.model';

export interface NotaDiariaEnfermeria {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    vServicios: VServicios;
    establecimiento: string;
    servicioSala: string;
    cama: string;
    entradas: EntradaNotaEnfermeria[];
}

export interface EntradaNotaEnfermeria {
    id?: number;
    fecha: string;
    hora: string;
    procedente: string;
    descripcionSintomas: string;
    enfermeraId?: number;
    enfermeraNombre?: string;
}

export interface RegistroMedicamentos {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    vServicios: VServicios;
    servicio: string;
    unidad: string;
    peso?: number;
    cama: string;
    medicamentos: MedicamentoRegistro[];
}

export interface MedicamentoRegistro {
    id?: number;
    nombre: string;
    via: string;
    dosis: string;
    administraciones: AdministracionMedicamento[];
}

export interface AdministracionMedicamento {
    fecha: string;
    hora: string;
    aplicado: boolean;
    observacion?: string;
}

export interface CuadroSignosVitales {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    vServicios: VServicios;
    servicio: string;
    sala: string;
    cama: string;
    numeroHCE: string;
    fechaIngreso: string;
    dias: DiaSignosVitales[];
}

export interface DiaSignosVitales {
    fecha: string;
    turnos: {
        manana: TurnoSignos;
        tarde: TurnoSignos;
        noche: TurnoSignos;
    };
    peso?: number;
    dieta?: string;
    presionArterial?: string;
    orina?: string;
    evacuaciones?: string;
    vomitos?: string;
    observaciones?: string;
    /** Permite el binding dinámico de las filas inferiores (dieta, orina, etc.) */
    [key: string]: any;
}

export interface TurnoSignos {
    respiracion?: number;
    pulso?: number;
    temperatura?: number;
}
