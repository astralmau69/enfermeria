import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional: verifica sesión activa y, opcionalmente, el rol requerido
 * declarado en `route.data.roles`.
 */
export const AuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. ¿Hay sesión activa?
    if (!authService.isAuthenticated()) {
        router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }

    // 2. ¿La ruta exige un rol específico?
    const allowedRoles = route.data?.['roles'] as string[] | undefined;
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = authService.currentUser()?.rol;
        if (!userRole || !allowedRoles.includes(userRole)) {
            // Rol no autorizado → mandamos a su propio inicio
            router.navigate(['/app']);
            return false;
        }
    }

    return true;
};
