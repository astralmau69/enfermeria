import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { MenuItem } from '../models/menu-item.model';

/**
 * MenuService — Menú estático filtrado por rol (frontend only, sin API).
 *
 * El punto de entrada de cada rol es la lista de pacientes internados; desde
 * ahí se abre cada hoja para el paciente seleccionado.
 */
@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private authService = inject(AuthService);

    private readonly definition: MenuItem[] = [
        {
            label: 'Médico',
            roles: ['DOCTOR'],
            items: [
                {
                    label: 'Pacientes en Piso',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/app/doctor/pacientes'],
                    roles: ['DOCTOR']
                },
                {
                    label: 'Exámenes Complementarios',
                    icon: 'pi pi-fw pi-images',
                    routerLink: ['/app/doctor/examenes'],
                    roles: ['DOCTOR']
                }
            ]
        },
        {
            label: 'Guía',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Índice del módulo', icon: 'pi pi-fw pi-compass', routerLink: ['/app/enfermeria/indice'], roles: ['ENFERMERA'] }
            ]
        },
        {
            label: 'Mi Turno',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Inicio de Turno', icon: 'pi pi-fw pi-home', routerLink: ['/app/enfermeria/inicio'], roles: ['ENFERMERA'] }
            ]
        },
        {
            label: 'Emergencias',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Triage / Emergencias', icon: 'pi pi-fw pi-exclamation-triangle', routerLink: ['/app/enfermeria/emergencias'], roles: ['ENFERMERA'] }
            ]
        },
        {
            label: 'Consulta Externa',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Consultorios por Especialidad', icon: 'pi pi-fw pi-th-large', routerLink: ['/app/enfermeria/consultorios'], roles: ['ENFERMERA'] },
                { label: 'Recepción / Turnos', icon: 'pi pi-fw pi-inbox', routerLink: ['/app/enfermeria/consulta-externa'], roles: ['ENFERMERA'] },
                { label: 'Procedimientos Ambulatorios', icon: 'pi pi-fw pi-bolt', routerLink: ['/app/enfermeria/procedimientos-ambulatorios'], roles: ['ENFERMERA'] }
            ]
        },
        {
            label: 'Hospitalización',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Pacientes en Piso', icon: 'pi pi-fw pi-users', routerLink: ['/app/enfermeria/pacientes'], roles: ['ENFERMERA'] },
                { label: 'Por Especialidad', icon: 'pi pi-fw pi-th-large', routerLink: ['/app/enfermeria/hospitalizacion'], roles: ['ENFERMERA'] },
                { label: 'Terapia Intensiva (UTI)', icon: 'pi pi-fw pi-heart-fill', routerLink: ['/app/enfermeria/hospitalizacion', '9'], roles: ['ENFERMERA'] }
            ]
        },
        {
            label: 'Interconsultas',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Por Especialidad', icon: 'pi pi-fw pi-send', routerLink: ['/app/enfermeria/interconsultas'], roles: ['ENFERMERA'] }
            ]
        },
        {
            label: 'Cuidados de Enfermería',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Signos Vitales', icon: 'pi pi-fw pi-chart-line', routerLink: ['/app/enfermeria/signos-vitales'], roles: ['ENFERMERA'] },
                { label: 'Medicamentos (Kardex)', icon: 'pi pi-fw pi-box', routerLink: ['/app/enfermeria/medicamentos'], roles: ['ENFERMERA'] },
                { label: 'Notas de Enfermería', icon: 'pi pi-fw pi-pencil', routerLink: ['/app/enfermeria/notas-diarias'], roles: ['ENFERMERA'] },
                { label: 'Balance Hídrico', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/app/enfermeria/balance-hidrico'], roles: ['ENFERMERA'] },
                { label: 'Sondas y Vías', icon: 'pi pi-fw pi-link', routerLink: ['/app/enfermeria/dispositivos'], roles: ['ENFERMERA'] },
                { label: 'Curaciones', icon: 'pi pi-fw pi-plus-circle', routerLink: ['/app/enfermeria/curaciones'], roles: ['ENFERMERA'] },
                { label: 'Glucometría', icon: 'pi pi-fw pi-percentage', routerLink: ['/app/enfermeria/glucometria'], roles: ['ENFERMERA'] }
            ]
        },
        {
            label: 'Ingreso / Egreso',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Admisión Hospitalaria', icon: 'pi pi-fw pi-file-edit', routerLink: ['/app/enfermeria/admision'], roles: ['ENFERMERA'] },
                { label: 'Informe Estadístico', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/app/enfermeria/estadistico'], roles: ['ENFERMERA'] },
                { label: 'Consentimiento', icon: 'pi pi-fw pi-check-square', routerLink: ['/app/enfermeria/consentimiento'], roles: ['ENFERMERA'] },
                { label: 'Evolución y Tratamiento', icon: 'pi pi-fw pi-list', routerLink: ['/app/enfermeria/evolucion'], roles: ['ENFERMERA'] }
            ]
        }
    ];

    /**
     * Menú reactivo: se recalcula al cambiar el usuario, mostrando solo lo
     * permitido para su rol.
     */
    menu = computed(() => {
        const role = this.authService.currentUser()?.rol ?? '';
        return this.filterMenu(this.definition, role);
    });

    private filterMenu(items: MenuItem[], role: string): MenuItem[] {
        return items
            .filter((item) => !item.roles || item.roles.length === 0 || item.roles.includes(role))
            .map((item) => (item.items?.length ? { ...item, items: this.filterMenu(item.items, role) } : item))
            .filter((item) => !item.items || item.items.length > 0 || !item.roles);
    }
}
