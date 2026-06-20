import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AvatarModule } from 'primeng/avatar';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/core/services/auth.service';
import { ArchivoService } from '@/app/core/services/archivo.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, AvatarModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
             <a class="layout-topbar-logo" routerLink="/">
                <svg viewBox="0 0 100 100" class="topbar-logo-svg">
        <image href="img/logo_pequeno.png" width="100" height="100"/>
    </svg>
                <span>{{ layoutService.layoutConfig().systemName }}</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" title="Cambiar modo oscuro/claro">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                        title="Configuración visual">
                        <i class="pi pi-palette"></i>
                    </button>
                    <!-- AppConfigurator se posiciona como dropdown — pStyleClass controla su visibilidad -->
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <!-- Perfil del Usuario -->
            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content flex items-center gap-3 ml-2">
                    <div class="flex flex-col items-end leading-tight mr-1">
                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ authService.currentUser()?.name }}</span>
                        <span class="text-sm text-muted-color">{{ authService.currentUser()?.role || authService.currentUser()?.rol }}</span>
                    </div>
                    <p-avatar 
                        [image]="getPhotoUrl()" 
                        shape="circle" 
                        size="large"
                        styleClass="border border-surface-200 dark:border-surface-700">
                    </p-avatar>

                    <button type="button" class="layout-topbar-action ml-2" (click)="goToPortal()" title="Cerrar sesión e ir al Portal">
                        <i class="pi pi-sign-out"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);
    authService = inject(AuthService);
    archivoService = inject(ArchivoService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    getPhotoUrl() {
        const user = this.authService.currentUser();
        if (user?.fotoPerfil?.idArchivo) {
            return this.archivoService.getDownloadUrl(user.fotoPerfil.idArchivo);
        }
        return 'img/avatar.png';
    }

    goToPortal() {
        const portalUrl = this.layoutService.layoutConfig().portalUrl;
        // Cerrar sesión localmente antes de ir al portal
        this.authService.logout();
        if (portalUrl) {
            window.location.href = portalUrl;
        } else {
            // Fallback si no hay URL de portal
            this.authService.logout();
        }
    }

    logout() {
        this.authService.logout();
    }
}
