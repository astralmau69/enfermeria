import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterModule, ButtonModule],
    template: `
        <div class="flex items-center justify-center min-h-dvh overflow-hidden bg-surface-50 dark:bg-surface-950 p-6">
            <div class="flex flex-col items-center justify-center text-center max-w-md">
                <i class="pi pi-heart-fill text-5xl text-primary mb-6"></i>
                <span class="text-primary font-bold text-4xl mb-2">404</span>
                <h1 class="text-surface-900 dark:text-surface-0 font-bold text-2xl lg:text-3xl mb-2">Página no encontrada</h1>
                <p class="text-surface-600 dark:text-surface-300 mb-8">
                    La hoja o recurso solicitado no está disponible.
                </p>
                <p-button label="Volver al inicio" icon="pi pi-arrow-left" routerLink="/app" />
            </div>
        </div>
    `
})
export class Notfound {}
