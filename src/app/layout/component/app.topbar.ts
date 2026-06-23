import { Component, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleClassModule } from 'primeng/styleclass';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PacienteService } from '@/app/core/services/paciente.service';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { Paciente } from '@/app/core/models/paciente.model';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, StyleClassModule, AvatarModule, SelectModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/app">
                <i class="pi pi-heart-fill" style="font-size: 1.6rem; color: var(--p-primary-color)"></i>
                <span class="font-display">{{ layoutService.layoutConfig().systemName }} · Piso</span>
            </a>
        </div>

        <!-- Selector de paciente activo (contexto clínico) -->
        <div class="topbar-paciente">
            <i class="pi pi-user topbar-paciente__icon"></i>
            <div class="flex flex-col leading-none">
                <span class="topbar-paciente__label">Paciente activo</span>
                <p-select
                    [options]="pacienteOptions()"
                    optionLabel="label"
                    optionValue="id"
                    [ngModel]="pacienteActivo.pacienteId()"
                    (ngModelChange)="pacienteActivo.setId($event)"
                    placeholder="Seleccionar paciente"
                    appendTo="body"
                    styleClass="topbar-paciente__select" />
            </div>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" title="Cambiar modo oscuro/claro">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <!-- Perfil del Usuario -->
            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content flex items-center gap-3 ml-2">
                    <div class="flex flex-col items-end leading-tight mr-1">
                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ authService.currentUser()?.name }}</span>
                        <span class="text-sm text-muted-color">{{ rolLabel() }}</span>
                    </div>
                    <p-avatar
                        [label]="initials()"
                        shape="circle"
                        size="large"
                        [style]="{ 'background-color': 'var(--p-primary-100)', color: 'var(--p-primary-700)' }"
                        styleClass="border border-surface-200 dark:border-surface-700">
                    </p-avatar>

                    <button type="button" class="layout-topbar-action ml-2" (click)="logout()" title="Cerrar sesión">
                        <i class="pi pi-sign-out"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`,
    styles: [`
        .topbar-paciente {
            display: none; align-items: center; gap: 0.6rem;
            padding: 0.35rem 0.85rem; border-radius: 0.75rem;
            background: var(--p-primary-50); border: 1px solid var(--p-primary-200);
        }
        @media (min-width: 768px) { .topbar-paciente { display: flex; } }
        :host-context(.app-dark) .topbar-paciente {
            background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900));
            border-color: var(--p-surface-700);
        }
        .topbar-paciente__icon { color: var(--p-primary-600); font-size: 1.1rem; }
        .topbar-paciente__label {
            font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.12em; color: var(--p-primary-700);
        }
        :host-context(.app-dark) .topbar-paciente__label { color: var(--p-primary-300); }
        :host ::ng-deep .topbar-paciente__select {
            border: none; background: transparent;
        }
        :host ::ng-deep .topbar-paciente__select .p-select-label {
            padding: 0; font-weight: 600; color: var(--p-text-color); font-size: 0.92rem;
        }
        :host ::ng-deep .topbar-paciente__select .p-select-dropdown { width: 1.5rem; color: var(--p-primary-600); }
    `]
})
export class AppTopbar {
    layoutService = inject(LayoutService);
    authService = inject(AuthService);
    pacienteActivo = inject(PacienteActivoService);
    private pacienteService = inject(PacienteService);

    private pacientes = signal<Paciente[]>([]);

    pacienteOptions = computed(() =>
        this.pacientes().map((p) => ({
            id: p.id,
            label: `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}`
        }))
    );

    constructor() {
        this.pacienteService.getAll().subscribe((data) => this.pacientes.set(data));
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    rolLabel(): string {
        const rol = this.authService.currentUser()?.rol;
        if (rol === 'DOCTOR') return 'Médico';
        if (rol === 'ENFERMERA') return 'Enfermera/o';
        return rol ?? '';
    }

    initials(): string {
        const user = this.authService.currentUser();
        const a = user?.primerApellido?.[0] ?? user?.nombres?.[0] ?? '';
        const b = user?.nombres?.[0] ?? '';
        return (a + b).toUpperCase() || 'U';
    }

    logout() {
        this.authService.logout();
    }
}
