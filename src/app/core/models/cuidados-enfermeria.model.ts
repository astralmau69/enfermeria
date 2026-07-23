/**
 * Hojas de cuidados de enfermería de cabecera (1 documento por paciente).
 *
 * Reúne cuatro registros clave del trabajo diario en piso/UCI de un hospital de
 * tercer nivel: balance hídrico, control de dispositivos (sondas/vías/catéteres),
 * curaciones/heridas y control glucémico. Siguen el mismo patrón "1-por-paciente"
 * que el cuadro de signos vitales y el registro de medicamentos.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BALANCE HÍDRICO — ingresos y egresos de líquidos por turno
// ─────────────────────────────────────────────────────────────────────────────
export type TurnoBalance = 'MANANA' | 'TARDE' | 'NOCHE';

export interface RegistroBalance {
    id?: number;
    fecha: string;             // YYYY-MM-DD
    turno: TurnoBalance;
    // Ingresos (ml)
    ingViaOral?: number;
    ingParenteral?: number;    // sueros / EV
    ingOtros?: number;
    // Egresos (ml)
    egrOrina?: number;
    egrDrenajes?: number;
    egrVomito?: number;
    egrDeposiciones?: number;
    egrOtros?: number;
    observacion?: string;
    enfermeraNombre?: string;
}

export interface BalanceHidrico {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    servicio: string;
    cama: string;
    peso?: number;
    registros: RegistroBalance[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPOSITIVOS — sondas, vías y catéteres
// ─────────────────────────────────────────────────────────────────────────────
export type TipoDispositivo = 'VIA_PERIFERICA' | 'CVC' | 'SONDA_VESICAL' | 'SNG' | 'DRENAJE' | 'OXIGENO' | 'OTRO';
export type EstadoDispositivo = 'ACTIVO' | 'RETIRADO';

export interface Dispositivo {
    id?: number;
    tipo: TipoDispositivo;
    sitio?: string;            // ej. "MSI antebrazo", "subclavia derecha"
    fechaColocacion: string;   // YYYY-MM-DD
    fechaRetiro?: string;
    estado: EstadoDispositivo;
    proximoCambio?: string;    // YYYY-MM-DD
    observacion?: string;
    enfermeraNombre?: string;
}

export interface ControlDispositivos {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    servicio: string;
    cama: string;
    dispositivos: Dispositivo[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CURACIONES — valoración de heridas/úlceras + registro de curaciones
// ─────────────────────────────────────────────────────────────────────────────
export type TipoHerida = 'QUIRURGICA' | 'ULCERA_PRESION' | 'TRAUMATICA' | 'QUEMADURA' | 'OTRA';

export interface EntradaCuracion {
    id?: number;
    fecha: string;   // YYYY-MM-DD
    hora: string;    // HH:mm
    aspecto: string; // aspecto de la herida
    accion: string;  // curación / material usado
    enfermeraNombre?: string;
}

export interface Herida {
    id?: number;
    localizacion: string;
    tipo: TipoHerida;
    braden?: number;           // escala de Braden (6–23; menor = mayor riesgo)
    curaciones: EntradaCuracion[];
}

export interface RegistroCuraciones {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    servicio: string;
    cama: string;
    heridas: Herida[];
}

// ─────────────────────────────────────────────────────────────────────────────
// GLUCOMETRÍA — control glucémico capilar + esquema de insulina
// ─────────────────────────────────────────────────────────────────────────────
export type MomentoGlucemia = 'AYUNAS' | 'PRE_DESAYUNO' | 'POST_DESAYUNO' | 'PRE_ALMUERZO' | 'POST_ALMUERZO' | 'PRE_CENA' | 'NOCHE' | 'OTRO';
export type TipoInsulina = 'CRISTALINA' | 'NPH' | 'GLARGINA' | 'NINGUNA';

export interface Glucometria {
    id?: number;
    fecha: string;   // YYYY-MM-DD
    hora: string;    // HH:mm
    valor: number;   // mg/dL
    momento: MomentoGlucemia;
    insulinaTipo?: TipoInsulina;
    insulinaUI?: number;
    observacion?: string;
    enfermeraNombre?: string;
}

export interface ControlGlucemia {
    id?: number;
    pacienteId: number;
    carnetAsegurado: string;
    carnetBeneficiario?: string;
    servicio: string;
    cama: string;
    mediciones: Glucometria[];
}
