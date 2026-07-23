import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolEnf, etiquetaRol } from '@/app/core/models/responsable-enfermeria';

/**
 * app-form-header — Encabezado firma del módulo.
 *
 * Conecta lo digital con el papel real: emblema institucional + título en
 * tipografía display + el CÓDIGO OFICIAL del formulario en monoespaciado +
 * una línea de electrocardiograma (ECG) como sello de marca recurrente.
 */
@Component({
    selector: 'app-form-header',
    standalone: true,
    imports: [CommonModule],
    template: `
        <header class="fh">
            <div class="fh__emblem" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none">
                    <path d="M16 3 4 7v8c0 6.6 4.9 11.4 12 14 7.1-2.6 12-7.4 12-14V7L16 3Z"
                          fill="rgba(255,255,255,.16)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    <path d="M7 17h4l1.6-3.4L15 21l2.2-9 2 6.2L21.4 15H25"
                          stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>

            <div class="fh__text">
                <div class="fh__eyebrow">{{ eyebrow() }}</div>
                <h1 class="fh__title">{{ title() }}</h1>
                @if (subtitle()) { <p class="fh__sub">{{ subtitle() }}</p> }
            </div>

            <div class="fh__right">
                @if (responsable()) {
                    <span class="fh__rol" [attr.data-rol]="responsable()" [title]="'Responsable: ' + rolLabel()">
                        <i class="pi pi-user-plus"></i> {{ rolLabel() }}
                    </span>
                }
                @if (code()) { <span class="fh__code">{{ code() }}</span> }
                <div class="fh__actions"><ng-content></ng-content></div>
            </div>

            <svg class="fh__ecg" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 12 H520 l14 0 12 -9 14 18 12 -22 12 26 12 -13 14 0 H1200"
                      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </header>
    `,
    styles: [`
        :host { display: block; }
        .fh {
            position: relative; display: flex; align-items: center; gap: 1rem;
            padding: 1.1rem 1.4rem 1.4rem; margin-bottom: 1.25rem;
            border-radius: 1.1rem; overflow: hidden;
            background: linear-gradient(118deg, var(--p-primary-50) 0%, var(--p-surface-0) 64%);
            border: 1px solid var(--p-surface-200);
        }
        :host-context(.app-dark) .fh {
            background: linear-gradient(118deg, color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)) 0%, var(--p-surface-900) 64%);
            border-color: var(--p-surface-700);
        }
        .fh__emblem {
            flex: none; width: 3rem; height: 3rem; border-radius: 0.9rem; color: #fff;
            display: flex; align-items: center; justify-content: center;
            background: linear-gradient(150deg, var(--p-primary-500), var(--p-primary-700));
            box-shadow: 0 6px 16px color-mix(in srgb, var(--p-primary-color) 38%, transparent);
        }
        .fh__emblem svg { width: 1.9rem; height: 1.9rem; }
        .fh__text { flex: 1 1 auto; min-width: 0; }
        .fh__eyebrow {
            font-family: var(--font-mono); font-size: 0.66rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.16em;
            color: var(--p-primary-700);
        }
        :host-context(.app-dark) .fh__eyebrow { color: var(--p-primary-300); }
        .fh__title {
            font-family: var(--font-display); font-weight: 700; font-size: 1.45rem; line-height: 1.12;
            margin: 0.15rem 0 0; color: var(--p-text-color); letter-spacing: -0.01em;
        }
        .fh__sub { margin: 0.3rem 0 0; font-size: 0.9rem; color: var(--p-text-muted-color); }
        .fh__right { flex: none; display: flex; align-items: center; gap: 0.75rem; align-self: flex-start; }
        .fh__code {
            font-family: var(--font-mono); font-size: 0.78rem; font-weight: 600; white-space: nowrap;
            padding: 0.3rem 0.7rem; border-radius: 0.55rem;
            color: var(--p-primary-700); background: var(--p-surface-0);
            border: 1px solid var(--p-primary-200);
        }
        :host-context(.app-dark) .fh__code {
            color: var(--p-primary-200); background: var(--p-surface-800); border-color: var(--p-surface-600);
        }
        .fh__rol {
            display: inline-flex; align-items: center; gap: 0.3rem; white-space: nowrap;
            font-size: 0.7rem; font-weight: 700; padding: 0.28rem 0.6rem; border-radius: 9999px;
            background: var(--p-surface-100); color: var(--p-text-muted-color); border: 1px solid var(--p-surface-200);
        }
        .fh__rol .pi { font-size: 0.66rem; }
        .fh__rol[data-rol="AUX"] { background: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
        .fh__rol[data-rol="LIC"] { background: var(--p-primary-50); color: var(--p-primary-700); border-color: var(--p-primary-200); }
        .fh__rol[data-rol="AMBAS"] { background: #f3e8ff; color: #7c3aed; border-color: #e9d5ff; }
        :host-context(.app-dark) .fh__rol { background: var(--p-surface-800); border-color: var(--p-surface-600); }
        :host-context(.app-dark) .fh__rol[data-rol="AUX"] { color: #7dd3fc; }
        :host-context(.app-dark) .fh__rol[data-rol="LIC"] { color: var(--p-primary-200); }
        :host-context(.app-dark) .fh__rol[data-rol="AMBAS"] { color: #c4b5fd; }
        .fh__actions { display: flex; align-items: center; gap: 0.5rem; }
        .fh__ecg {
            position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 16px;
            color: var(--p-primary-color); opacity: 0.55;
        }
        .fh__ecg path { stroke-dasharray: 1300; stroke-dashoffset: 1300; animation: fh-trace 2.2s ease-out 0.15s forwards; }
        @keyframes fh-trace { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
            .fh__ecg path { animation: none; stroke-dashoffset: 0; }
        }
    `]
})
export class FormHeaderComponent {
    title = input.required<string>();
    code = input<string>('');
    subtitle = input<string>('');
    eyebrow = input<string>('COSSMIL · Hospital Militar Central');
    /** Responsable de la hoja (Aux / Lic / Ambas). Si se define, muestra un chip. */
    responsable = input<RolEnf | ''>('');

    rolLabel = computed(() => {
        const r = this.responsable();
        return r ? etiquetaRol(r) : '';
    });
}
