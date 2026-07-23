import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import {
    getDb, persist, nextId, upsertByPaciente,
    ensureEvolucion, ensureExamenes, ensureNotas, ensureMedicamentos,
    ensureSignos, ensureEstadistico, ensureConsentimiento,
    ensureBalance, ensureDispositivos, ensureCuraciones, ensureGlucemia
} from './mock-db';

const LATENCY_MS = 220;

interface Handler {
    method: string;
    pattern: RegExp;
    run: (params: string[], body: any) => any;
}

/** Nombre del profesional logueado (para firmar notas / evoluciones). */
function currentUserName(): string {
    try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
        return raw ? (JSON.parse(raw).name ?? '') : '';
    } catch {
        return '';
    }
}

const HANDLERS: Handler[] = [
    // ── Auth (no usado por el login actual, se mantiene inofensivo) ──────────
    {
        method: 'POST', pattern: /\/api\/auth\/login$/,
        run: () => ({ token: 'mock-jwt', user: null })
    },

    // ── Pacientes ────────────────────────────────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/pacientes\/(\d+)$/,
        run: (p) => getDb().pacientes.find((x) => x.id === +p[0]) ?? null
    },
    {
        method: 'PUT', pattern: /\/api\/pacientes\/(\d+)$/,
        run: (p, body) => {
            const db = getDb();
            const i = db.pacientes.findIndex((x) => x.id === +p[0]);
            if (i >= 0) { db.pacientes[i] = { ...db.pacientes[i], ...body, id: db.pacientes[i].id }; persist(); return db.pacientes[i]; }
            return null;
        }
    },
    {
        method: 'DELETE', pattern: /\/api\/pacientes\/(\d+)$/,
        run: (p) => {
            const db = getDb();
            db.pacientes = db.pacientes.filter((x) => x.id !== +p[0]);
            persist();
            return null;
        }
    },
    {
        method: 'GET', pattern: /\/api\/pacientes$/,
        run: () => getDb().pacientes
    },
    {
        method: 'POST', pattern: /\/api\/pacientes$/,
        run: (_p, body) => {
            const db = getDb();
            const created = { ...body, id: body.id ?? nextId() };
            db.pacientes.push(created);
            persist();
            return created;
        }
    },

    // ── Admisión Hospitalaria (varias por paciente) ──────────────────────────
    {
        method: 'GET', pattern: /\/api\/admision\/paciente\/(\d+)$/,
        run: (p) => getDb().admisiones.filter((a) => a.pacienteId === +p[0])
    },
    {
        method: 'PUT', pattern: /\/api\/admision\/(\d+)$/,
        run: (p, body) => {
            const db = getDb();
            const i = db.admisiones.findIndex((a) => a.id === +p[0]);
            if (i >= 0) { db.admisiones[i] = { ...db.admisiones[i], ...body, id: db.admisiones[i].id }; persist(); return db.admisiones[i]; }
            return null;
        }
    },
    {
        method: 'POST', pattern: /\/api\/admision$/,
        run: (_p, body) => {
            const db = getDb();
            const created = { ...body, id: nextId() };
            db.admisiones.push(created);
            persist();
            return created;
        }
    },

    // ── Informe Estadístico (1 por paciente) ─────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/estadistico\/paciente\/(\d+)$/,
        run: (p) => ensureEstadistico(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/estadistico$/,
        run: (_p, body) => upsertByPaciente(getDb().estadisticos, body)
    },

    // ── Consentimiento (1 por paciente) ──────────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/consentimiento\/paciente\/(\d+)$/,
        run: (p) => ensureConsentimiento(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/consentimiento$/,
        run: (_p, body) => upsertByPaciente(getDb().consentimientos, body)
    },

    // ── Evolución y Tratamiento ──────────────────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/evolucion\/paciente\/(\d+)$/,
        run: (p) => ensureEvolucion(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/evolucion\/paciente\/(\d+)$/,
        run: (p, body) => {
            const doc = ensureEvolucion(+p[0]);
            const entrada = { ...body, id: nextId(), medicoNombre: body.medicoNombre || currentUserName() };
            doc.entradas.push(entrada);
            persist();
            return entrada;
        }
    },

    // ── Exámenes Complementarios ─────────────────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/examenes\/paciente\/(\d+)$/,
        run: (p) => ensureExamenes(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/examenes\/paciente\/(\d+)$/,
        run: (p, body) => {
            const doc = ensureExamenes(+p[0]);
            const entrada = { ...body, id: nextId() };
            doc.entradas.push(entrada);
            persist();
            return entrada;
        }
    },

    // ── Notas Diarias de Enfermería ──────────────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/enfermeria\/notas\/paciente\/(\d+)$/,
        run: (p) => ensureNotas(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/enfermeria\/notas\/paciente\/(\d+)$/,
        run: (p, body) => {
            const doc = ensureNotas(+p[0]);
            const entrada = { ...body, id: nextId(), enfermeraNombre: body.enfermeraNombre || currentUserName() };
            doc.entradas.push(entrada);
            persist();
            return entrada;
        }
    },

    // ── Registro de Medicamentos (1 por paciente) ────────────────────────────
    {
        method: 'GET', pattern: /\/api\/enfermeria\/medicamentos\/paciente\/(\d+)$/,
        run: (p) => ensureMedicamentos(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/enfermeria\/medicamentos$/,
        run: (_p, body) => upsertByPaciente(getDb().medicamentos, body)
    },

    // ── Cuadro de Signos Vitales (1 por paciente) ────────────────────────────
    {
        method: 'GET', pattern: /\/api\/enfermeria\/signos-vitales\/paciente\/(\d+)$/,
        run: (p) => ensureSignos(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/enfermeria\/signos-vitales$/,
        run: (_p, body) => upsertByPaciente(getDb().signosVitales, body)
    },

    // ── Consulta Externa (cola/turnos del día — Form 002) ────────────────────
    {
        method: 'GET', pattern: /\/api\/consulta-externa\/(\d+)$/,
        run: (p) => getDb().consultasExternas.find((c) => c.id === +p[0]) ?? null
    },
    {
        method: 'GET', pattern: /\/api\/consulta-externa$/,
        run: () => getDb().consultasExternas
    },
    {
        method: 'POST', pattern: /\/api\/consulta-externa$/,
        run: (_p, body) => {
            const db = getDb();
            const delDia = db.consultasExternas.filter((c) => c.fecha === body.fecha);
            const turno = `CE-${String(delDia.length + 1).padStart(3, '0')}`;
            const created = {
                ...body,
                id: nextId(),
                numeroTurno: body.numeroTurno || turno,
                estado: body.estado || 'EN_ESPERA'
            };
            db.consultasExternas.push(created);
            persist();
            return created;
        }
    },
    {
        method: 'PUT', pattern: /\/api\/consulta-externa\/(\d+)$/,
        run: (p, body) => {
            const db = getDb();
            const i = db.consultasExternas.findIndex((c) => c.id === +p[0]);
            if (i >= 0) {
                db.consultasExternas[i] = { ...db.consultasExternas[i], ...body, id: db.consultasExternas[i].id };
                persist();
                return db.consultasExternas[i];
            }
            return null;
        }
    },

    // ── Camas por piso (mapa de camas / hospitalización) ─────────────────────
    {
        method: 'GET', pattern: /\/api\/camas\/piso\/(\d+)$/,
        run: (p) => getDb().camas.filter((c) => c.pisoNumero === +p[0])
    },
    {
        method: 'GET', pattern: /\/api\/camas$/,
        run: () => getDb().camas
    },
    {
        method: 'PUT', pattern: /\/api\/camas\/(\d+)$/,
        run: (p, body) => {
            const db = getDb();
            const i = db.camas.findIndex((c) => c.id === +p[0]);
            if (i >= 0) {
                db.camas[i] = { ...db.camas[i], ...body, id: db.camas[i].id };
                persist();
                return db.camas[i];
            }
            return null;
        }
    },

    // ── Interconsultas por especialidad ──────────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/interconsultas\/(\d+)$/,
        run: (p) => getDb().interconsultas.find((x) => x.id === +p[0]) ?? null
    },
    {
        method: 'GET', pattern: /\/api\/interconsultas$/,
        run: () => getDb().interconsultas
    },
    {
        method: 'POST', pattern: /\/api\/interconsultas$/,
        run: (_p, body) => {
            const db = getDb();
            const created = {
                ...body,
                id: nextId(),
                estado: body.estado || 'SOLICITADA',
                fechaSolicitud: body.fechaSolicitud || new Date().toISOString().split('T')[0],
                gestionadaPor: body.gestionadaPor || currentUserName()
            };
            db.interconsultas.push(created);
            persist();
            return created;
        }
    },
    {
        method: 'PUT', pattern: /\/api\/interconsultas\/(\d+)$/,
        run: (p, body) => {
            const db = getDb();
            const i = db.interconsultas.findIndex((x) => x.id === +p[0]);
            if (i >= 0) { db.interconsultas[i] = { ...db.interconsultas[i], ...body, id: db.interconsultas[i].id }; persist(); return db.interconsultas[i]; }
            return null;
        }
    },

    // ── Procedimientos ambulatorios (Consulta Externa) ───────────────────────
    {
        method: 'GET', pattern: /\/api\/procedimientos-ambulatorios$/,
        run: () => getDb().procedimientosAmbulatorios
    },
    {
        method: 'POST', pattern: /\/api\/procedimientos-ambulatorios$/,
        run: (_p, body) => {
            const db = getDb();
            const created = {
                ...body,
                id: nextId(),
                estado: body.estado || 'PENDIENTE',
                fecha: body.fecha || new Date().toISOString().split('T')[0]
            };
            db.procedimientosAmbulatorios.push(created);
            persist();
            return created;
        }
    },
    {
        method: 'PUT', pattern: /\/api\/procedimientos-ambulatorios\/(\d+)$/,
        run: (p, body) => {
            const db = getDb();
            const i = db.procedimientosAmbulatorios.findIndex((x) => x.id === +p[0]);
            if (i >= 0) { db.procedimientosAmbulatorios[i] = { ...db.procedimientosAmbulatorios[i], ...body, id: db.procedimientosAmbulatorios[i].id }; persist(); return db.procedimientosAmbulatorios[i]; }
            return null;
        }
    },

    // ── Cuidados de enfermería (1 por paciente: get-or-create + upsert) ───────
    {
        method: 'GET', pattern: /\/api\/enfermeria\/balance\/paciente\/(\d+)$/,
        run: (p) => ensureBalance(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/enfermeria\/balance$/,
        run: (_p, body) => upsertByPaciente(getDb().balances, body)
    },
    {
        method: 'GET', pattern: /\/api\/enfermeria\/dispositivos\/paciente\/(\d+)$/,
        run: (p) => ensureDispositivos(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/enfermeria\/dispositivos$/,
        run: (_p, body) => upsertByPaciente(getDb().dispositivos, body)
    },
    {
        method: 'GET', pattern: /\/api\/enfermeria\/curaciones\/paciente\/(\d+)$/,
        run: (p) => ensureCuraciones(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/enfermeria\/curaciones$/,
        run: (_p, body) => upsertByPaciente(getDb().curaciones, body)
    },
    {
        method: 'GET', pattern: /\/api\/enfermeria\/glucemia\/paciente\/(\d+)$/,
        run: (p) => ensureGlucemia(+p[0])
    },
    {
        method: 'POST', pattern: /\/api\/enfermeria\/glucemia$/,
        run: (_p, body) => upsertByPaciente(getDb().glucemias, body)
    },

    // ── Emergencias (triage) ─────────────────────────────────────────────────
    {
        method: 'GET', pattern: /\/api\/emergencias$/,
        run: () => getDb().emergencias
    },
    {
        method: 'POST', pattern: /\/api\/emergencias$/,
        run: (_p, body) => {
            const db = getDb();
            const created = {
                ...body,
                id: nextId(),
                estado: body.estado || 'EN_TRIAGE',
                fecha: body.fecha || new Date().toISOString().split('T')[0],
                enfermera: body.enfermera || currentUserName()
            };
            db.emergencias.push(created);
            persist();
            return created;
        }
    },
    {
        method: 'PUT', pattern: /\/api\/emergencias\/(\d+)$/,
        run: (p, body) => {
            const db = getDb();
            const i = db.emergencias.findIndex((x) => x.id === +p[0]);
            if (i >= 0) { db.emergencias[i] = { ...db.emergencias[i], ...body, id: db.emergencias[i].id }; persist(); return db.emergencias[i]; }
            return null;
        }
    }
];

/**
 * Interceptor del mock-backend: intercepta llamadas a `/api/...` y responde
 * desde la base de datos simulada (con persistencia en localStorage).
 */
export const MockBackendInterceptor: HttpInterceptorFn = (req, next): Observable<any> => {
    if (!environment.useMocks || !req.url.includes('/api/')) {
        return next(req);
    }

    const handler = HANDLERS.find((h) => h.method === req.method && h.pattern.test(req.url));

    if (!handler) {
        console.warn(`[MockBackend] Sin handler para ${req.method} ${req.url}`);
        return throwError(() => new HttpErrorResponse({ status: 404, url: req.url, error: 'Mock route not found' })).pipe(delay(LATENCY_MS));
    }

    const match = req.url.match(handler.pattern);
    const params = match ? match.slice(1) : [];

    try {
        const body = handler.run(params, req.body);
        console.log(`[MockBackend] ${req.method} ${req.url} →`, body);
        return of(new HttpResponse({ status: 200, body })).pipe(delay(LATENCY_MS));
    } catch (err) {
        console.error(`[MockBackend] Error en ${req.method} ${req.url}`, err);
        return throwError(() => new HttpErrorResponse({ status: 500, url: req.url, error: String(err) })).pipe(delay(LATENCY_MS));
    }
};
