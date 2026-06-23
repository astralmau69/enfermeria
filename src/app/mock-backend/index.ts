/**
 * MOCK-BACKEND — Capa de backend simulado (frontend only).
 *
 * Punto único de importación. Activado/desactivado con `environment.useMocks`.
 * El estado vive en localStorage (`cossmil_mock_db_v1`) y se comporta como un
 * backend real: GET/POST/PUT/DELETE sobre `/api/...`.
 */
export { MockBackendInterceptor } from './mock-backend.interceptor';
export { resetDb } from './mock-db';
