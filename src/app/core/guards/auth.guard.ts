import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional Guard de Angular moderno para verificar accesos
 * a rutas protegidas.
 */
export const AuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificamos de forma reactiva el signal de Auth
    if (authService.isAuthenticated()) {
        return true; 
    }

    // Redireccion al "No Autorizado", guardando el intento de URL fallida
    router.navigate(['/auth/access'], { queryParams: { returnUrl: state.url } });
    return false;
};
