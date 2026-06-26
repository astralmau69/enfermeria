import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * [appScrollReveal] — Revelado al entrar en viewport (estilo Apple):
 * fade + slide-up + leve escala, disparado por scroll vía ScrollTrigger.
 *
 * - Pasá un índice para escalonar dentro de un grupo: `[appScrollReveal]="$index"`.
 * - Se reproduce una sola vez (no se revierte al volver a salir).
 * - Respeta `prefers-reduced-motion` (no anima, deja el contenido visible).
 * - Limpia su ScrollTrigger al destruirse (seguro para SPA).
 */
@Directive({
    selector: '[appScrollReveal]',
    standalone: true
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
    /** Índice para escalonar el delay dentro de un grupo. */
    @Input('appScrollReveal') index: number | string = 0;
    /** Desplazamiento vertical inicial (px). */
    @Input() revealY = 26;
    /** Escala inicial (1 = sin zoom). */
    @Input() revealScale = 0.985;
    /** Duración (s). */
    @Input() revealDuration = 0.7;
    /** Punto de disparo respecto al viewport. */
    @Input() revealStart = 'top 88%';

    private el = inject(ElementRef<HTMLElement>);
    private platformId = inject(PLATFORM_ID);
    private tween?: gsap.core.Tween;

    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const i = typeof this.index === 'string' ? parseInt(this.index, 10) || 0 : this.index;

        this.tween = gsap.fromTo(
            this.el.nativeElement,
            { autoAlpha: 0, y: this.revealY, scale: this.revealScale },
            {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: this.revealDuration,
                ease: 'power3.out',
                delay: i * 0.08,
                clearProps: 'transform,scale',
                scrollTrigger: {
                    trigger: this.el.nativeElement,
                    start: this.revealStart,
                    toggleActions: 'play none none none'
                }
            }
        );
    }

    ngOnDestroy(): void {
        this.tween?.scrollTrigger?.kill();
        this.tween?.kill();
    }
}
