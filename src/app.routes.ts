import { Routes } from '@angular/router';
import { AuthGuard } from './app/core/guards/auth.guard';
import { AppLayout } from './app/layout/component/app.layout';

export const appRoutes: Routes = [
    {
        path: 'auth/login',
        loadComponent: () => import('./app/pages/auth/login').then((m) => m.Login)
    },
    {
        // ÁREA PRIVADA - Envuelta por AppLayout y protegida por AuthGuard (rol)
        path: 'app',
        component: AppLayout,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'doctor',
                canActivate: [AuthGuard],
                data: { roles: ['DOCTOR'] },
                loadChildren: () => import('./app/features/doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES)
            },
            {
                path: 'enfermeria',
                canActivate: [AuthGuard],
                data: { roles: ['ENFERMERA'] },
                loadChildren: () => import('./app/features/enfermeria/enfermeria.routes').then((m) => m.ENFERMERIA_ROUTES)
            },
            {
                // Redirección inteligente según el rol del usuario logueado
                path: '',
                pathMatch: 'full',
                loadComponent: () => import('./app/pages/role-home').then((m) => m.RoleHome)
            }
        ]
    },
    {
        path: 'notfound',
        loadComponent: () => import('./app/pages/notfound/notfound').then((m) => m.Notfound)
    },
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/notfound'
    }
];
