/**
 * MOCK-DB — Base de datos simulada en memoria con persistencia en localStorage.
 *
 * Funciona "casi real": GET devuelve documentos (creándolos vacíos por paciente
 * si no existen), POST/PUT/DELETE mutan el estado y se persisten. Al recargar la
 * página los datos siguen ahí.
 */
import { Paciente, VServicios } from '../core/models/paciente.model';
import { AdmisionHospitalaria, InformeEstadistico, ConsentimientoInformado } from '../core/models/historia-clinica.model';
import { EvolucionTratamiento, ExamenComplementario } from '../core/models/evolucion.model';
import { NotaDiariaEnfermeria, RegistroMedicamentos, CuadroSignosVitales } from '../core/models/enfermeria.model';
import { ConsultaExterna } from '../core/models/consulta-externa.model';
import { Cama } from '../core/models/piso.model';
import { Interconsulta } from '../core/models/interconsulta.model';
import { ProcedimientoAmbulatorio } from '../core/models/procedimiento-ambulatorio.model';
import { BalanceHidrico, ControlDispositivos, RegistroCuraciones, ControlGlucemia } from '../core/models/cuidados-enfermeria.model';
import { PacienteEmergencia } from '../core/models/emergencia.model';
import {
    SEED_PACIENTES, SEED_ADMISIONES, SEED_EVOLUCIONES, SEED_EXAMENES,
    SEED_NOTAS, SEED_MEDICAMENTOS, SEED_SIGNOS_VITALES, SEED_ESTADISTICOS, SEED_CONSENTIMIENTOS,
    SEED_CONSULTAS_EXTERNAS, SEED_CAMAS,
    SEED_INTERCONSULTAS, SEED_PROC_AMBULATORIOS,
    SEED_BALANCES, SEED_DISPOSITIVOS, SEED_CURACIONES, SEED_GLUCEMIAS,
    SEED_EMERGENCIAS
} from './seed';

const STORAGE_KEY = 'cossmil_mock_db_v7';

export interface MockDbShape {
    pacientes: Paciente[];
    admisiones: AdmisionHospitalaria[];
    evoluciones: EvolucionTratamiento[];
    examenes: ExamenComplementario[];
    notas: NotaDiariaEnfermeria[];
    medicamentos: RegistroMedicamentos[];
    signosVitales: CuadroSignosVitales[];
    estadisticos: InformeEstadistico[];
    consentimientos: ConsentimientoInformado[];
    consultasExternas: ConsultaExterna[];
    camas: Cama[];
    interconsultas: Interconsulta[];
    procedimientosAmbulatorios: ProcedimientoAmbulatorio[];
    balances: BalanceHidrico[];
    dispositivos: ControlDispositivos[];
    curaciones: RegistroCuraciones[];
    glucemias: ControlGlucemia[];
    emergencias: PacienteEmergencia[];
    seq: number;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const noServicios = (): VServicios => ({ pt1: false, pt2: false, pip: false, pipa: false, papa: false, pic: false });
const isBrowser = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

function buildSeed(): MockDbShape {
    return {
        pacientes: clone(SEED_PACIENTES),
        admisiones: clone(SEED_ADMISIONES),
        evoluciones: clone(SEED_EVOLUCIONES),
        examenes: clone(SEED_EXAMENES),
        notas: clone(SEED_NOTAS),
        medicamentos: clone(SEED_MEDICAMENTOS),
        signosVitales: clone(SEED_SIGNOS_VITALES),
        estadisticos: clone(SEED_ESTADISTICOS),
        consentimientos: clone(SEED_CONSENTIMIENTOS),
        consultasExternas: clone(SEED_CONSULTAS_EXTERNAS),
        camas: clone(SEED_CAMAS),
        interconsultas: clone(SEED_INTERCONSULTAS),
        procedimientosAmbulatorios: clone(SEED_PROC_AMBULATORIOS),
        balances: clone(SEED_BALANCES),
        dispositivos: clone(SEED_DISPOSITIVOS),
        curaciones: clone(SEED_CURACIONES),
        glucemias: clone(SEED_GLUCEMIAS),
        emergencias: clone(SEED_EMERGENCIAS),
        seq: 1000
    };
}

let _db: MockDbShape | null = null;

export function getDb(): MockDbShape {
    if (_db) return _db;
    if (isBrowser()) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                _db = JSON.parse(raw) as MockDbShape;
                return _db;
            } catch {
                /* corrupto → re-sembrar */
            }
        }
    }
    _db = buildSeed();
    persist();
    return _db;
}

export function persist(): void {
    if (_db && isBrowser()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
    }
}

export function resetDb(): void {
    _db = buildSeed();
    persist();
}

export function nextId(): number {
    const db = getDb();
    db.seq += 1;
    return db.seq;
}

export function findPaciente(pacienteId: number): Paciente | undefined {
    return getDb().pacientes.find((p) => p.id === pacienteId);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET-OR-CREATE: garantizan un documento válido por paciente
// ─────────────────────────────────────────────────────────────────────────────

export function ensureEvolucion(pacienteId: number): EvolucionTratamiento {
    const db = getDb();
    let doc = db.evoluciones.find((e) => e.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = { id: nextId(), pacienteId, carnetAsegurado: p?.carnetAsegurado ?? '', carnetBeneficiario: p?.carnetBeneficiario, entradas: [] };
        db.evoluciones.push(doc);
        persist();
    }
    return doc;
}

export function ensureExamenes(pacienteId: number): ExamenComplementario {
    const db = getDb();
    let doc = db.examenes.find((e) => e.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = { id: nextId(), pacienteId, carnetAsegurado: p?.carnetAsegurado ?? '', carnetBeneficiario: p?.carnetBeneficiario, entradas: [] };
        db.examenes.push(doc);
        persist();
    }
    return doc;
}

export function ensureNotas(pacienteId: number): NotaDiariaEnfermeria {
    const db = getDb();
    let doc = db.notas.find((n) => n.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = {
            id: nextId(),
            pacienteId,
            carnetAsegurado: p?.carnetAsegurado ?? '',
            carnetBeneficiario: p?.carnetBeneficiario,
            vServicios: p?.vServicios ?? noServicios(),
            establecimiento: 'HOSPITAL MILITAR CENTRAL',
            servicioSala: '',
            cama: '',
            entradas: []
        };
        db.notas.push(doc);
        persist();
    }
    return doc;
}

export function ensureMedicamentos(pacienteId: number): RegistroMedicamentos {
    const db = getDb();
    let doc = db.medicamentos.find((m) => m.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = {
            id: nextId(),
            pacienteId,
            carnetAsegurado: p?.carnetAsegurado ?? '',
            carnetBeneficiario: p?.carnetBeneficiario,
            vServicios: p?.vServicios ?? noServicios(),
            servicio: '',
            unidad: 'HOSPITAL MILITAR CENTRAL',
            cama: '',
            medicamentos: []
        };
        db.medicamentos.push(doc);
        persist();
    }
    return doc;
}

export function ensureSignos(pacienteId: number): CuadroSignosVitales {
    const db = getDb();
    let doc = db.signosVitales.find((s) => s.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = {
            id: nextId(),
            pacienteId,
            carnetAsegurado: p?.carnetAsegurado ?? '',
            carnetBeneficiario: p?.carnetBeneficiario,
            vServicios: p?.vServicios ?? noServicios(),
            servicio: '',
            sala: '',
            cama: '',
            numeroHCE: '',
            fechaIngreso: new Date().toISOString().split('T')[0],
            dias: []
        };
        db.signosVitales.push(doc);
        persist();
    }
    return doc;
}

export function ensureEstadistico(pacienteId: number): InformeEstadistico {
    const db = getDb();
    let doc = db.estadisticos.find((e) => e.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = {
            id: nextId(),
            pacienteId,
            carnetAsegurado: p?.carnetAsegurado ?? '',
            carnetBeneficiario: p?.carnetBeneficiario,
            establecimiento: 'HOSPITAL MILITAR CENTRAL',
            localidad: 'LA PAZ',
            esNuevo: true,
            ingreso: {
                tipoPrestacion: '',
                fechaIngreso: new Date().toISOString().split('T')[0],
                horaIngreso: '',
                sala: '',
                cama: '',
                diagnosticoPresuntivo: '',
                tipoAdmision: 'EMERGENCIA',
                medicoSolicita: ''
            }
        };
        db.estadisticos.push(doc);
        persist();
    }
    return doc;
}

export function ensureConsentimiento(pacienteId: number): ConsentimientoInformado {
    const db = getDb();
    let doc = db.consentimientos.find((c) => c.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = {
            id: nextId(),
            pacienteId,
            carnetAsegurado: p?.carnetAsegurado ?? '',
            carnetBeneficiario: p?.carnetBeneficiario,
            fecha: new Date().toISOString().split('T')[0],
            hora: '',
            vServicios: p?.vServicios ?? noServicios(),
            firmante: { nombre: '', ci: '', tipo: 'PACIENTE' }
        };
        db.consentimientos.push(doc);
        persist();
    }
    return doc;
}

export function ensureBalance(pacienteId: number): BalanceHidrico {
    const db = getDb();
    let doc = db.balances.find((b) => b.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = { id: nextId(), pacienteId, carnetAsegurado: p?.carnetAsegurado ?? '', carnetBeneficiario: p?.carnetBeneficiario, servicio: '', cama: camaDe(pacienteId), registros: [] };
        db.balances.push(doc);
        persist();
    }
    return doc;
}

export function ensureDispositivos(pacienteId: number): ControlDispositivos {
    const db = getDb();
    let doc = db.dispositivos.find((d) => d.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = { id: nextId(), pacienteId, carnetAsegurado: p?.carnetAsegurado ?? '', carnetBeneficiario: p?.carnetBeneficiario, servicio: '', cama: camaDe(pacienteId), dispositivos: [] };
        db.dispositivos.push(doc);
        persist();
    }
    return doc;
}

export function ensureCuraciones(pacienteId: number): RegistroCuraciones {
    const db = getDb();
    let doc = db.curaciones.find((c) => c.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = { id: nextId(), pacienteId, carnetAsegurado: p?.carnetAsegurado ?? '', carnetBeneficiario: p?.carnetBeneficiario, servicio: '', cama: camaDe(pacienteId), heridas: [] };
        db.curaciones.push(doc);
        persist();
    }
    return doc;
}

export function ensureGlucemia(pacienteId: number): ControlGlucemia {
    const db = getDb();
    let doc = db.glucemias.find((g) => g.pacienteId === pacienteId);
    if (!doc) {
        const p = findPaciente(pacienteId);
        doc = { id: nextId(), pacienteId, carnetAsegurado: p?.carnetAsegurado ?? '', carnetBeneficiario: p?.carnetBeneficiario, servicio: '', cama: camaDe(pacienteId), mediciones: [] };
        db.glucemias.push(doc);
        persist();
    }
    return doc;
}

/** Código de cama actual del paciente (si está internado), o ''. */
function camaDe(pacienteId: number): string {
    return getDb().camas.find((c) => c.pacienteId === pacienteId)?.codigo ?? '';
}

/**
 * Upsert genérico por pacienteId para documentos de 1-por-paciente.
 */
export function upsertByPaciente<T extends { id?: number; pacienteId: number }>(
    collection: T[],
    body: T
): T {
    const idx = collection.findIndex((d) => d.pacienteId === body.pacienteId);
    if (idx >= 0) {
        const merged = { ...collection[idx], ...body, id: collection[idx].id };
        collection[idx] = merged;
        persist();
        return merged;
    }
    const created = { ...body, id: body.id ?? nextId() };
    collection.push(created);
    persist();
    return created;
}
