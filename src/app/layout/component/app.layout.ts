import { Component, computed, effect, inject, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { gsap } from 'gsap';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppFooter } from './app.footer';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter],
    template: `<div class="layout-wrapper" [ngClass]="containerClass()">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-outlet></router-outlet>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask"></div>
    </div> `
})
export class AppLayout {
    layoutService = inject(LayoutService);
    private router = inject(Router);
    private host = inject(ElementRef<HTMLElement>);
    private platformId = inject(PLATFORM_ID);

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });

        // Transición de página: anima el contenido en cada navegación.
        if (isPlatformBrowser(this.platformId)) {
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.router.events
                .pipe(filter((e) => e instanceof NavigationEnd))
                .subscribe(() => {
                    if (reduced) return;
                    const main = this.host.nativeElement.querySelector('.layout-main');
                    if (!main) return;
                    gsap.fromTo(
                        main,
                        { opacity: 0, y: 16 },
                        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform' }
                    );
                });
        }
    }

    containerClass = computed(() => {
        const config = this.layoutService.layoutConfig();
        const state  = this.layoutService.layoutState();

        return {
            // ── Modos de menú ──────────────────────────────────────────────
            'layout-static':   config.menuMode === 'static',
            'layout-overlay':  config.menuMode === 'overlay',
            'layout-slim':     config.menuMode === 'slim',
            'layout-compact':  config.menuMode === 'compact',
            'layout-reveal':   config.menuMode === 'reveal',
            'layout-drawer':   config.menuMode === 'drawer',
            'layout-horizontal': config.menuMode === 'horizontal',

            // ── Estados de menú ────────────────────────────────────────────
            'layout-static-inactive': state.staticMenuDesktopInactive && config.menuMode === 'static',
            'layout-overlay-active':  state.overlayMenuActive,
            'layout-mobile-active':   state.mobileMenuActive,

            // ── Estilo de tarjeta ──────────────────────────────────────────
            'layout-card-border': config.cardStyle === 'border',

            // ── Tema del menú lateral ──────────────────────────────────────
            'layout-sidebar-dark':  config.menuTheme === 'dark',
            'layout-sidebar-light': config.menuTheme === 'light'
        };
    });
}
