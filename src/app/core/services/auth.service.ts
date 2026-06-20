import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    /**
     * Estado Reactivo usando Signals de Angular.
     * currentUser almacena la data del usuario ingresado.
     * isAuthenticated almacena el flag si hay sesión activa.
     */
    public currentUser = signal<User | null>(null);
    public isAuthenticated = signal<boolean>(false);

    constructor(private router: Router) {
        this.checkSessionStatus();
    }

    /**
     * Cierra la sesión, limpia variables, localStorage y redirige.
     */
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
    }

    /**
     * Chequea si existe sesión previa persistida o si viene desde el Portal.
     * Llamado desde el constructor la primera vez que inicia la app.
     */
    private checkSessionStatus() {
        if (typeof window === 'undefined') return;

        console.log('[AuthService] Checking session status...');
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        const userDataFromUrl = urlParams.get('user');
        const configFromUrl = urlParams.get('config');
        console.log('tokenFromUrl', tokenFromUrl);
        console.log('userDataFromUrl', userDataFromUrl);
        console.log('configFromUrl', configFromUrl);

        if (tokenFromUrl && userDataFromUrl && configFromUrl) {
            console.log('[AuthService] Token and User found in URL');
            try {
                const user = JSON.parse(userDataFromUrl) as User;

                // PERSISTIR SESIÓN RECIBIDA
                localStorage.setItem('auth_token', tokenFromUrl);
                localStorage.setItem('user_data', userDataFromUrl);
                localStorage.setItem('app_layout_config', configFromUrl);

                this.currentUser.set(user);
                this.isAuthenticated.set(true);
                console.log('[AuthService] Session initialized from URL successfully');

                // Limpiar parámetros para no dejar rastro sensible en la URL
                setTimeout(() => {
                    const cleanUrl = window.location.origin + window.location.pathname + window.location.hash.split('?')[0];
                    window.history.replaceState({}, document.title, cleanUrl);
                }, 500);
                return;
            } catch (e) {
                console.error('[AuthService] Error parsing user data from URL', e);
            }
        }

        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (token && userData) {
            try {
                const user = JSON.parse(userData) as User;
                this.currentUser.set(user);
                this.isAuthenticated.set(true);
                console.log('[AuthService] Session recovered from localStorage');
            } catch (e) {
                console.warn('[AuthService] Corrupt user data in localStorage, logging out');
                this.logout();
            }
        } else {
            console.log('[AuthService] No active session found');
            this.isAuthenticated.set(false);
            this.currentUser.set(null);
        }
    }
}
