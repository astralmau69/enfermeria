import { Routes } from '@angular/router';

/**
 * Módulo ENFERMERÍA — Enfermería llena todas las hojas de piso.
 *
 * Cada hoja tiene dos rutas: con `:pacienteId` (deep-link desde el hub) y sin
 * id (abre con el paciente activo, p. ej. desde el menú lateral).
 */
const forms: { path: string; load: () => Promise<any> }[] = [
    { path: 'signos-vitales', load: () => import('./signos-vitales/signos-vitales.component').then((m) => m.SignosVitalesComponent) },
    { path: 'notas-diarias', load: () => import('./notas-diarias/notas-diarias.component').then((m) => m.NotasDiariasComponent) },
    { path: 'medicamentos', load: () => import('./medicamentos/medicamentos.component').then((m) => m.MedicamentosComponent) },
    { path: 'admision', load: () => import('../doctor/admision/admision.component').then((m) => m.AdmisionComponent) },
    { path: 'estadistico', load: () => import('../doctor/estadistico/estadistico.component').then((m) => m.EstadisticoComponent) },
    { path: 'consentimiento', load: () => import('../doctor/consentimiento/consentimiento.component').then((m) => m.ConsentimientoComponent) },
    { path: 'evolucion', load: () => import('../doctor/evolucion/evolucion.component').then((m) => m.EvolucionComponent) }
];

export const ENFERMERIA_ROUTES: Routes = [
    {
        path: 'inicio',
        loadComponent: () => import('./inicio/inicio.component').then((m) => m.InicioTurnoComponent)
    },
    {
        path: 'pacientes',
        loadComponent: () => import('../doctor/paciente-lista/paciente-lista.component').then((m) => m.PacienteListaComponent)
    },
    // Mapa de camas por piso (Hospitalización — simula Piso 1 · Cirugía)
    {
        path: 'pisos',
        loadComponent: () => import('./pisos/piso.component').then((m) => m.PisoComponent)
    },
    // Consulta Externa (proceso ambulatorio: recepción → constantes → Form 002)
    {
        path: 'consulta-externa',
        loadComponent: () => import('./consulta-externa/consulta-externa-lista.component').then((m) => m.ConsultaExternaListaComponent)
    },
    {
        path: 'consulta-externa/:id',
        loadComponent: () => import('./consulta-externa/consulta-externa-detalle.component').then((m) => m.ConsultaExternaDetalleComponent)
    },
    // Genera, por cada hoja, la ruta sin id y la ruta con :pacienteId
    ...forms.flatMap((f) => [
        { path: f.path, loadComponent: f.load },
        { path: `${f.path}/:pacienteId`, loadComponent: f.load }
    ]),
    {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
    }
];
