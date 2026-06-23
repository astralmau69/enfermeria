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
 * Identidad cromática COSSMIL — teal-pino clínico/institucional.
 * Color de marca deliberado (no el emerald por defecto del template),
 * fundamentado en el contexto: institución estatal militar-médica.
 */
const ClinicalPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#e8f6f1',
            100: '#c6e9dd',
            200: '#94d6c1',
            300: '#5cbfa1',
            400: '#2da585',
            500: '#108a6e',
            600: '#0c7059',
            700: '#0c5a49',
            800: '#0d483b',
            900: '#0c3a30',
            950: '#04211b'
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
