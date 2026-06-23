import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import {
    getDb, persist, nextId, upsertByPaciente,
    ensureEvolucion, ensureExamenes, ensureNotas, ensureMedicamentos,
    ensureSignos, ensureEstadistico, ensureConsentimiento
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
