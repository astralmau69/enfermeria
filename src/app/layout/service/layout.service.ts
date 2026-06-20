import { Injectable, effect, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES DE CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LayoutConfig: Configuración visual global de la aplicación.
 * Cada campo es persistido en localStorage para sobrevivir recargas.
 */
export interface LayoutConfig {
    /** Preset del tema: Aura | Lara | Nora */
    preset: string;
    /** Color primario: emerald | cyan | blue | etc. */
    primary: string;
    /** Color de superficie: slate | gray | zinc | etc. */
    surface: string | undefined | null;
    /** Modo oscuro activo */
    darkTheme: boolean;
    /**
     * Tipo de menú lateral.
     * Valores: 'static' | 'overlay' | 'slim' | 'compact' | 'reveal' | 'drawer' | 'horizontal'
     */
    menuMode: string;
    /** Estilo del card: 'shadow' (sombra) | 'border' (borde) */
    cardStyle: 'shadow' | 'border';
    /** Tema del menú lateral: 'light' | 'dark' */
    menuTheme: 'light' | 'dark';
    /** Nombre del sistema actual */
    systemName: string;
    /** URL del portal institucional o landing page */
    portalUrl: string;
    /** Sigla identificadora del sistema (e.g. SICOC) */
    systemSigla: string;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    /** Si el panel de configuración (drawer) está visible */
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'app_layout_config';

/** Config por defecto. Se aplica cuando no hay nada en localStorage. */
const DEFAULT_CONFIG: LayoutConfig = {
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    darkTheme: false,
    menuMode: 'static',
    cardStyle: 'shadow',
    menuTheme: 'light',
    systemName: 'COSSMIL',
    portalUrl: 'http://localhost:4200', // Portal Institucional
    systemSigla: 'SEMILLA'
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private platformId = inject(PLATFORM_ID);

    /**
     * layoutConfig: Signal con toda la configuración visual activa.
     * Se inicializa desde localStorage si existe una config previa guardada.
     */
    layoutConfig = signal<LayoutConfig>(this.loadFromStorage());

    layoutState = signal<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    // ── Computed helpers ──────────────────────────────────────────────────────

    theme = computed(() => (this.layoutConfig().darkTheme ? 'light' : 'dark'));
    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);
    isDarkTheme = computed(() => this.layoutConfig().darkTheme);
    getPrimary = computed(() => this.layoutConfig().primary);
    getSurface = computed(() => this.layoutConfig().surface);
    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');
    transitionComplete = signal<boolean>(false);

    private initialized = false;

    constructor() {
        /**
         * Effect principal: se ejecuta CADA VEZ que layoutConfig cambia.
         * Responsabilidades:
         *  1. Aplicar/remover la clase dark en el documento
         *  2. Guardar la config actualizada en localStorage
         */
        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
            this.saveToStorage(config);          // ← Persistencia automática
        });
    }

    // ── Métodos de tema oscuro ────────────────────────────────────────────────

    private handleDarkModeTransition(config: LayoutConfig): void {
        const supportsViewTransition = 'startViewTransition' in document;
        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        (document as any).startViewTransition(() => {
            this.toggleDarkMode(config);
        });
    }

    toggleDarkMode(config?: LayoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    // ── Menú ──────────────────────────────────────────────────────────────────

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !this.layoutState().mobileMenuActive }));
        }
    }

    // ── Panel de configuración ────────────────────────────────────────────────

    /** Abre el panel lateral de configuración (Theme Configurator) */
    showConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
    }

    /** Cierra el panel lateral de configuración */
    hideConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }

    // ── localStorage ──────────────────────────────────────────────────────────

    /**
     * Carga la configuración guardada desde localStorage.
     * Si no existe, devuelve la configuración por defecto.
     */
    private loadFromStorage(): LayoutConfig {
        if (!isPlatformBrowser(this.platformId)) {
            return { ...DEFAULT_CONFIG };
        }

        // 1. Intentar cargar desde parámetros de URL (Prioridad SSO/Propagación)
        if (typeof window !== 'undefined') {
            const fullHref = window.location.href;
            const urlObj = new URL(fullHref);

            // Buscar en search params (?config=...) o en el hash (..#/path?config=...)
            let configParam = urlObj.searchParams.get('config');

            if (!configParam && fullHref.includes('config=')) {
                // Fallback manual para casos donde el router de Angular altera la URL
                const match = fullHref.match(/[?&]config=([^& #]+)/);
                if (match) configParam = decodeURIComponent(match[1]);
            }

            if (configParam) {
                try {
                    const parsedConfig = JSON.parse(configParam);
                    console.log('[LayoutService] Configuración recibida por URL:', parsedConfig);
                    const merged = { ...DEFAULT_CONFIG, ...parsedConfig };
                    this.saveToStorage(merged);
                    return merged;
                } catch (e) {
                    console.warn('[LayoutService] Error al parsear config de URL:', e);
                }
            }
        }

        // 2. Intentar cargar desde localStorage
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
            }
        } catch (e) {
            console.warn('[LayoutService] Error al leer config de localStorage:', e);
        }
        return { ...DEFAULT_CONFIG };
    }

    /**
     * Guarda la configuración actual en localStorage.
     * Se llama automáticamente desde el effect() al detectar cambios.
     */
    private saveToStorage(config: LayoutConfig): void {
        if (!isPlatformBrowser(this.platformId)) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.warn('[LayoutService] Error al guardar config en localStorage:', e);
        }
    }
}
