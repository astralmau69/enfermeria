import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'recepcion',
        loadComponent: () => import('../operador/recepcion/recepcion').then(m => m.Recepcion)
    },
    {
        path: 'users',
        loadComponent: () => import('./users/users.component').then(m => m.UsersComponent)
    },
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    }
];
