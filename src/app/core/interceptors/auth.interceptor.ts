import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Functional Interceptor para solicitudes Http.
 * Envía el token de autenticación del local storage en los Headers si existe.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth_token');

    if (token) {
        // Clonamos la solicitud original adjuntando Authorization header (estándar OAuth2)
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    }

    // Pasa directo la petición si no hay token
    return next(req);
};
