import { Directive, ElementRef, Input, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

/**
 * [appReveal] — Anima la entrada del elemento (fade + slide) con GSAP.
 * Pasá un índice para escalonar: `[appReveal]="$index"`.
 * Respeta `prefers-reduced-motion`.
 */
@Directive({
    selector: '[appReveal]',
    standalone: true
})
export class RevealDirective implements AfterViewInit {
    @Input('appReveal') index: number | string = 0;
    @Input() revealY = 18;
    @Input() revealDuration = 0.5;

    private el = inject(ElementRef<HTMLElement>);
    private platformId = inject(PLATFORM_ID);

    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const i = typeof this.index === 'string' ? parseInt(this.index, 10) || 0 : this.index;
        gsap.fromTo(
            this.el.nativeElement,
            { opacity: 0, y: this.revealY },
            { opacity: 1, y: 0, duration: this.revealDuration, ease: 'power2.out', delay: i * 0.07, clearProps: 'transform' }
        );
    }
}
