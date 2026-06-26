import { Directive, ElementRef, Input, OnChanges, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

/**
 * [appCountUp] — Anima un número desde su valor previo hasta el nuevo
 * (cuenta ascendente estilo Apple). El valor puede traer prefijo/sufijo no
 * numérico: `"12/20"` cuenta el 12 y conserva `"/20"`; `"0"` muestra `0`.
 *
 * La directiva escribe el `textContent` del elemento, así que el binding va
 * sin interpolación: `<span [appCountUp]="k.value"></span>`.
 *
 * Respeta `prefers-reduced-motion` y SSR (escribe el valor final sin animar).
 */
@Directive({
    selector: '[appCountUp]',
    standalone: true
})
export class CountUpDirective implements OnChanges {
    @Input('appCountUp') value: string | number = '';
    /** Duración de la cuenta (s). */
    @Input() countDuration = 1.1;

    private el = inject(ElementRef<HTMLElement>);
    private platformId = inject(PLATFORM_ID);
    private current = 0;
    private tween?: gsap.core.Tween;

    ngOnChanges(): void {
        const raw = String(this.value ?? '');
        const match = raw.match(/-?\d+(?:[.,]\d+)?/);

        // Sin parte numérica → mostramos el texto tal cual.
        if (!match) {
            this.el.nativeElement.textContent = raw;
            return;
        }

        const target = parseFloat(match[0].replace(',', '.'));
        const decimals = (match[0].split(/[.,]/)[1] || '').length;
        const prefix = raw.slice(0, match.index);
        const suffix = raw.slice((match.index ?? 0) + match[0].length);

        const render = (n: number) => {
            this.el.nativeElement.textContent = `${prefix}${n.toFixed(decimals)}${suffix}`;
        };

        const reduced =
            !isPlatformBrowser(this.platformId) ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduced) {
            this.current = target;
            render(target);
            return;
        }

        this.tween?.kill();
        const proxy = { n: this.current };
        this.tween = gsap.to(proxy, {
            n: target,
            duration: this.countDuration,
            ease: 'power2.out',
            onUpdate: () => render(proxy.n),
            onComplete: () => { this.current = target; }
        });
    }
}
