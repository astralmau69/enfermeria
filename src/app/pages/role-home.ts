import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

/**
 * Componente "puente": no renderiza nada, solo redirige al usuario a su
 * área correspondiente según el rol con el que inició sesión.
 */
@Component({
    selector: 'app-role-home',
    standalone: true,
    template: ''
})
export class RoleHome {
    private router = inject(Router);
    private auth = inject(AuthService);

    constructor() {
        const rol = this.auth.currentUser()?.rol;
        if (rol === 'DOCTOR') {
            this.router.navigate(['/app/doctor/pacientes']);
        } else if (rol === 'ENFERMERA') {
            this.router.navigate(['/app/enfermeria/inicio']);
        } else {
            this.router.navigate(['/auth/login']);
        }
    }
}
