import { Routes } from '@angular/router';

/**
 * Módulo ENFERMERÍA — organizado por secciones para el flujo de un hospital de
 * tercer nivel: consulta externa, interconsultas, hospitalización por
 * especialidad y las hojas de cuidados de cabecera.
 *
 * Cada hoja "de paciente" tiene dos rutas: con `:pacienteId` (deep-link desde el
 * hub/cama) y sin id (abre con el paciente activo, p. ej. desde el menú lateral).
 */
const forms: { path: string; load: () => Promise<any> }[] = [
    { path: 'signos-vitales', load: () => import('./signos-vitales/signos-vitales.component').then((m) => m.SignosVitalesComponent) },
    { path: 'notas-diarias', load: () => import('./notas-diarias/notas-diarias.component').then((m) => m.NotasDiariasComponent) },
    { path: 'medicamentos', load: () => import('./medicamentos/medicamentos.component').then((m) => m.MedicamentosComponent) },
    { path: 'balance-hidrico', load: () => import('./cuidados/balance-hidrico/balance-hidrico.component').then((m) => m.BalanceHidricoComponent) },
    { path: 'dispositivos', load: () => import('./cuidados/dispositivos/dispositivos.component').then((m) => m.DispositivosComponent) },
    { path: 'curaciones', load: () => import('./cuidados/curaciones/curaciones.component').then((m) => m.CuracionesComponent) },
    { path: 'glucometria', load: () => import('./cuidados/glucometria/glucometria.component').then((m) => m.GlucometriaComponent) },
    { path: 'admision', load: () => import('../doctor/admision/admision.component').then((m) => m.AdmisionComponent) },
    { path: 'estadistico', load: () => import('../doctor/estadistico/estadistico.component').then((m) => m.EstadisticoComponent) },
    { path: 'consentimiento', load: () => import('../doctor/consentimiento/consentimiento.component').then((m) => m.ConsentimientoComponent) },
    { path: 'evolucion', load: () => import('../doctor/evolucion/evolucion.component').then((m) => m.EvolucionComponent) }
];

export const ENFERMERIA_ROUTES: Routes = [
    // Índice / guía del módulo
    {
        path: 'indice',
        loadComponent: () => import('./indice/indice.component').then((m) => m.EnfermeriaIndiceComponent)
    },
    // Inicio de turno (dashboard)
    {
        path: 'inicio',
        loadComponent: () => import('./inicio/inicio.component').then((m) => m.InicioTurnoComponent)
    },
    {
        path: 'pacientes',
        loadComponent: () => import('../doctor/paciente-lista/paciente-lista.component').then((m) => m.PacienteListaComponent)
    },
    // Hospitalización por especialidad (mapa de camas de los 9 servicios)
    {
        path: 'hospitalizacion',
        loadComponent: () => import('./pisos/piso.component').then((m) => m.PisoComponent)
    },
    {
        path: 'hospitalizacion/:pisoNumero',
        loadComponent: () => import('./pisos/piso.component').then((m) => m.PisoComponent)
    },
    // Alias histórico
    {
        path: 'pisos',
        loadComponent: () => import('./pisos/piso.component').then((m) => m.PisoComponent)
    },
    // Consulta Externa — recepción general + consultorios por especialidad
    {
        path: 'consulta-externa',
        loadComponent: () => import('./consulta-externa/consulta-externa-lista.component').then((m) => m.ConsultaExternaListaComponent)
    },
    {
        path: 'consulta-externa/:id',
        loadComponent: () => import('./consulta-externa/consulta-externa-detalle.component').then((m) => m.ConsultaExternaDetalleComponent)
    },
    {
        path: 'consultorios',
        loadComponent: () => import('./consulta-externa/consultorios.component').then((m) => m.ConsultoriosComponent)
    },
    {
        path: 'consultorios/:sigla',
        loadComponent: () => import('./consulta-externa/consultorio.component').then((m) => m.ConsultorioComponent)
    },
    {
        path: 'procedimientos-ambulatorios',
        loadComponent: () => import('./consulta-externa/procedimientos-ambulatorios.component').then((m) => m.ProcedimientosAmbulatoriosComponent)
    },
    // Emergencias (triage)
    {
        path: 'emergencias',
        loadComponent: () => import('./emergencias/emergencias.component').then((m) => m.EmergenciasComponent)
    },
    // Interconsultas por especialidad
    {
        path: 'interconsultas',
        loadComponent: () => import('./interconsultas/interconsultas.component').then((m) => m.InterconsultasComponent)
    },
    // Genera, por cada hoja de paciente, la ruta sin id y la ruta con :pacienteId
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
