export type TipoAsegurado = 'ACTIVO' | 'PASIVO' | 'ESPOSA' | 'BENEFICIARIO' | 'CADETE_ALUMNO' | 'SOLDADO' | 'OTROS';
export type TipoSeguro = 'ENFERMEDAD' | 'MATERNIDAD' | 'RIESGO_PROFESIONAL';

export interface Residencia {
    departamento: string;
    provincia: string;
    localidad: string;
    zona: string;
    calle: string;
    numero: string;
}

export interface DatosFamiliares {
    nombrePadre?: string;
    nombreMadre?: string;
    nombreConyuge?: string;
    personaProxima?: string;
    parentescoProximo?: string;
    direccionProximo?: string;
    telefono?: string;
    otrosTelefonos?: string;
}

export interface VServicios {
    pt1: boolean;
    pt2: boolean;
    pip: boolean;
    pipa: boolean;
    papa: boolean;
    pic: boolean;
}

export interface Paciente {
    id?: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    apellidoEsposo?: string;
    nombres: string;
    fechaNacimiento?: string;
    edad?: number;
    sexo: 'M' | 'F';
    estadoCivil: string;
    lugarNacimiento?: string;
    lugarTrabajo?: string;
    ocupacion?: string;
    profesion?: string;
    grado?: string;
    unidad?: string;
    fuerza?: 'EJERCITO' | 'AEREA' | 'NAVAL';
    tipoAsegurado: TipoAsegurado;
    tipoSeguro?: TipoSeguro;
    residencia: Residencia;
    datosFamiliares?: DatosFamiliares;
    vServicios?: VServicios;
}
