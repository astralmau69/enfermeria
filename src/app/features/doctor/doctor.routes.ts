import { Routes } from '@angular/router';

/**
 * Módulo DOCTOR — En piso, el médico únicamente solicita y registra los
 * Resultados de Exámenes Complementarios (Form. H.C.-M-009).
 *
 * Cada hoja tiene dos rutas: con `:pacienteId` (deep-link desde el hub) y sin
 * id (abre con el paciente activo, p. ej. desde el menú).
 */
export const DOCTOR_ROUTES: Routes = [
    {
        path: 'pacientes',
        loadComponent: () => import('./paciente-lista/paciente-lista.component').then((m) => m.PacienteListaComponent)
    },
    {
        path: 'examenes',
        loadComponent: () => import('./examenes/examenes.component').then((m) => m.ExamenesComponent)
    },
    {
        path: 'examenes/:pacienteId',
        loadComponent: () => import('./examenes/examenes.component').then((m) => m.ExamenesComponent)
    },
    {
        path: '',
        redirectTo: 'pacientes',
        pathMatch: 'full'
    }
];
