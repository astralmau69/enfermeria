import { Routes } from '@angular/router';
import { AuthGuard } from './app/core/guards/auth.guard';
import { AppLayout } from './app/layout/component/app.layout';

export const appRoutes: Routes = [
    {
        // 1. ÁREA PRIVADA (Admin) - Envuelto por AppLayout y protegido por AuthGuard
        path: 'admin',
        component: AppLayout,
        //canActivate: [AuthGuard], // <-- Guard implementado
        loadChildren: () => import('./app/features/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
    },
    {
        path: 'notfound',
        loadComponent: () => import('./app/pages/notfound/notfound').then((m) => m.Notfound)
    },
    {
        // Redirección por defecto
        path: '',
        redirectTo: '/admin/dashboard',
        pathMatch: 'full'
    },
    {
        // Fallback genérico 404
        path: '**',
        redirectTo: '/notfound'
    }
];
