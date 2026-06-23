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
            label: 'Enfermería',
            roles: ['ENFERMERA'],
            items: [
                {
                    label: 'Pacientes en Piso',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/app/enfermeria/pacientes'],
                    roles: ['ENFERMERA']
                }
            ]
        },
        {
            label: 'Hojas de Enfermería',
            roles: ['ENFERMERA'],
            items: [
                { label: 'Signos Vitales', icon: 'pi pi-fw pi-chart-line', routerLink: ['/app/enfermeria/signos-vitales'], roles: ['ENFERMERA'] },
                { label: 'Notas Diarias', icon: 'pi pi-fw pi-pencil', routerLink: ['/app/enfermeria/notas-diarias'], roles: ['ENFERMERA'] },
                { label: 'Medicamentos', icon: 'pi pi-fw pi-box', routerLink: ['/app/enfermeria/medicamentos'], roles: ['ENFERMERA'] }
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
