import { MenuItem as PrimeMenuItem } from 'primeng/api';

/**
 * Extensión de la interfaz MenuItem de PrimeNG
 * para soportar roles y permisos dinámicos.
 */
export interface MenuItem extends PrimeMenuItem {
    /** Roles que pueden ver esta opción. Si es null o vacío, es público. */
    roles?: string[];
    /** Items hijos (recursivo) */
    items?: MenuItem[];
    /** Ocultar si el usuario no tiene los roles necesarios */
    visible?: boolean;
}
