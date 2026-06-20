import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { MenuItem } from '../models/menu-item.model';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { LayoutService } from '../../layout/service/layout.service';

interface MenuResponse {
    idMenu: number;
    label: string;
    icon?: string;
    routerLink?: string;
    roles?: string;
    idParent?: number;
    sortOrder?: number;
    separator?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private authService = inject(AuthService);
    private http = inject(HttpClient);
    private layoutService = inject(LayoutService);

    private _menuDefinition = signal<MenuItem[]>([]);

    constructor() {
        this.loadMenuFromApi();
    }

    /**
     * Carga el menú desde la base de datos a través de la API.
     */
    async loadMenuFromApi() {
        try {
            const sigla = this.layoutService.layoutConfig().systemSigla;
            const flatMenus = await firstValueFrom(
                this.http.get<MenuResponse[]>(`${environment.apiUrl}/api/menu?sigla=${sigla}`)
            );
            
            if (flatMenus && flatMenus.length > 0) {
                const tree = this.buildMenuTree(flatMenus);
                this._menuDefinition.set(tree);
                console.log('[MenuService] Menú cargado desde DB exitosamente');
            } else {
                console.warn('[MenuService] El menú está vacío en la DB');
                this.loadFallbackMenu();
            }
        } catch (error: any) {
            console.error('[MenuService] Error cargando el menú desde API:', error);
            this.loadFallbackMenu();
        }
    }

    private loadFallbackMenu() {
        this._menuDefinition.set([
            {
                label: 'Principal',
                visible: true,
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/admin/dashboard'],
                        visible: true
                    },
                    {
                        label: 'Consultas',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/admin/dashboard'],
                        visible: true
                    },
                    {
                        label: 'Recepción Muestras',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/admin/recepcion'],
                        visible: true
                    },

                    

                ]
            },
            
        ]);
    }

    /**
     * Construye la jerarquía del menú a partir de una lista plana recibida de la DB.
     */
    private buildMenuTree(flatMenus: MenuResponse[]): MenuItem[] {
        const itemMap = new Map<number, MenuItem>();
        const rootItems: MenuItem[] = [];

        // Primera pasada: Crear todos los objetos MenuItem
        flatMenus.forEach(m => {
            const item: MenuItem = {
                label: m.label,
                icon: m.icon,
                routerLink: m.routerLink ? [m.routerLink] : undefined,
                roles: m.roles ? m.roles.split(',').map((r: string) => r.trim()) : undefined,
                separator: m.separator,
                items: []
            };
            itemMap.set(m.idMenu, item);
        });

        // Segunda pasada: Conectar padres e hijos
        flatMenus.forEach(m => {
            const item = itemMap.get(m.idMenu);
            if (m.idParent) {
                const parent = itemMap.get(m.idParent);
                if (parent) {
                    if (!parent.items) parent.items = [];
                    parent.items.push(item!);
                } else {
                    // Si el padre no existe (raro), se vuelve raíz
                    rootItems.push(item!);
                }
            } else {
                rootItems.push(item!);
            }
        });

        return rootItems;
    }

    async saveMenu(menu: any) {
        await firstValueFrom(this.http.post(`${environment.apiUrl}/api/menu`, menu));
        await this.loadMenuFromApi();
    }

    async deleteMenu(id: number) {
        await firstValueFrom(this.http.delete(`${environment.apiUrl}/api/menu/${id}`));
        await this.loadMenuFromApi();
    }

    /**
     * Obtiene la lista plana de menús sin filtrar (para administración).
     */
    getFlatMenus(sigla?: string) {
        const s = sigla || this.layoutService.layoutConfig().systemSigla;
        return this.http.get<MenuResponse[]>(`${environment.apiUrl}/api/menu?sigla=${s}`);
    }

    /**
     * Menú filtrado dinámicamente según el rol del usuario actual.
     * Es computado: se actualiza automáticamente cuando cambia el usuario o la definición.
     */
    menu = computed(() => {
        const user = this.authService.currentUser();
        const userRole = user?.rol || 'USER';

        return this.filterMenu(this._menuDefinition(), userRole);
    });

    /**
     * Lógica recursiva para filtrar el menú por roles.
     */
    private filterMenu(items: MenuItem[], role: string): MenuItem[] {
        return items
            .filter(item => {
                // Si no tiene roles definidos, es público
                if (!item.roles || item.roles.length === 0) return true;
                // Verificar si el rol del usuario está permitido
                return item.roles.includes(role);
            })
            .map(item => {
                // Si tiene hijos, filtrarlos también
                if (item.items && item.items.length > 0) {
                    return {
                        ...item,
                        items: this.filterMenu(item.items, role)
                    };
                }
                return item;
            })
            // Eliminar grupos que se quedaron sin hijos después del filtrado
            .filter(item => !item.items || item.items.length > 0 || !item.roles);
    }
}
