/**
 * SHARED MODULE - Componentes Reutilizables
 *
 * Este archivo es el punto de exportación centralizado del módulo Shared.
 *
 * CÓMO USAR:
 * Agrega aquí componentes que se reutilicen en múltiples features.
 * Ejemplo: tablas genéricas, modales base, botones con loading, etc.
 *
 * EJEMPLO de componente a agregar:
 *   export { LoadingButtonComponent } from './components/loading-button/loading-button.component';
 *   export { DataTableComponent }    from './components/data-table/data-table.component';
 */

// Exports de componentes compartidos
export { FormHeaderComponent } from './components/form-header/form-header.component';
export { PacienteHeaderComponent } from './components/paciente-header/paciente-header.component';
export { PacienteSearchComponent } from './components/paciente-search/paciente-search.component';
export { ServiciosCheckboxComponent } from './components/servicios-checkbox/servicios-checkbox.component';

// Directivas compartidas
export { RevealDirective } from './directives/reveal.directive';
