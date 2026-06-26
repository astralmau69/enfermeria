import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { AuthInterceptor } from './app/core/interceptors/auth.interceptor';
import { MockBackendInterceptor } from './app/mock-backend';

/**
 * Identidad cromática COSSMIL — teal-aqua de enfermería.
 * Verde-azulado luminoso tipo "scrubs"/uniforme clínico, con acento cyan
 * (#22d3ee, ver --c-accent en _app-polish.scss) para realces estilo Apple.
 * Anclas elegidas con el usuario: 500 #0d9488 · 600 #0f766e · 700 #115e59.
 */
const ClinicalPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#0d9488',
            600: '#0f766e',
            700: '#115e59',
            800: '#134e4a',
            900: '#0f3b38',
            950: '#042f2e'
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([MockBackendInterceptor, AuthInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({ theme: { preset: ClinicalPreset, options: { darkModeSelector: '.app-dark' } } })
    ]
};
