import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { ConsultaExternaService } from '@/app/core/services/consulta-externa.service';
import { ConsultaExterna } from '@/app/core/models/consulta-externa.model';
import { ESPECIALIDADES, GRUPOS_ESPECIALIDAD, GrupoEspecialidad, Especialidad } from '@/app/core/models/especialidad.model';

interface ConsultorioCard extends Especialidad {
    total: number;
    enEspera: number;
    listos: number;
    atendidos: number;
}

/**
 * Consultorios por especialidad — hub de Consulta Externa.
 *
 * Muestra la cartera de especialidades del hospital agrupada, con el conteo de
 * pacientes del día por consultorio. La enfermera elige un consultorio para
 * trabajar la cola (triage, signos, procedimientos y pasar la lista al médico).
 */
@Component({
    selector: 'app-consultorios',
    standalone: true,
    imports: [CommonModule, FormHeaderComponent, RevealDirective],
    template: `
        <app-form-header title="Consultorios por Especialidad" code="CONSULTA EXTERNA"
            subtitle="Elegí un consultorio para atender su cola del día" responsable="AMBAS" appReveal />

        <!-- Resumen del día -->
        <div class="tot">
            <div class="tot__box"><i class="pi pi-inbox"></i><b class="tabular">{{ totalDia() }}</b><span>Turnos del día</span></div>
            <div class="tot__box tot__box--wait"><i class="pi pi-clock"></i><b class="tabular">{{ totalEspera() }}</b><span>En espera</span></div>
            <div class="tot__box tot__box--ready"><i class="pi pi-check"></i><b class="tabular">{{ totalListos() }}</b><span>Listos p/ médico</span></div>
            <div class="tot__box"><i class="pi pi-th-large"></i><b class="tabular">{{ activos() }}</b><span>Consultorios activos</span></div>
        </div>

        @if (loading()) {
            <div class="empty-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando consultorios…</span></div>
        } @else {
            @for (g of grupos; track g.key; let gi = $index) {
                @if (cardsDe(g.key).length) {
                    <section class="grp" [appReveal]="gi">
                        <header class="grp__head">
                            <span class="grp__icon"><i class="pi" [ngClass]="g.icon"></i></span>
                            <div><h2 class="grp__title">{{ g.label }}</h2><p class="grp__desc">{{ g.desc }}</p></div>
                        </header>
                        <div class="grid">
                            @for (c of cardsDe(g.key); track c.sigla; let i = $index) {
                                <button class="cons" [class.is-empty]="c.total === 0" (click)="abrir(c)" [appReveal]="i" [revealY]="8">
                                    <span class="cons__sigla">{{ c.sigla }}</span>
                                    <span class="cons__icon"><i class="pi" [ngClass]="c.icon"></i></span>
                                    <span class="cons__name">{{ c.nombre }}</span>
                                    <span class="cons__stats">
                                        @if (c.enEspera > 0) { <span class="pill pill--wait">{{ c.enEspera }} en espera</span> }
                                        @if (c.listos > 0) { <span class="pill pill--ready">{{ c.listos }} listos</span> }
                                        @if (c.total === 0) { <span class="pill pill--empty">Sin turnos</span> }
                                    </span>
                                </button>
                            }
                        </div>
                    </section>
                }
            }
        }
    `,
    styles: [`
        :host { display: block; }
        .tot { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 0.25rem 0 1.4rem; }
        @media (min-width: 768px) { .tot { grid-template-columns: repeat(4, 1fr); } }
        .tot__box { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; border-radius: 0.9rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .tot__box { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .tot__box .pi { font-size: 1.15rem; color: var(--p-primary-600); }
        .tot__box--wait .pi { color: #b45309; } .tot__box--ready .pi { color: #15803d; }
        .tot__box b { font-family: var(--font-display); font-size: 1.35rem; color: var(--p-text-color); }
        .tot__box span { font-size: 0.74rem; color: var(--p-text-muted-color); font-weight: 600; }

        .grp { margin-bottom: 1.5rem; }
        .grp__head { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.8rem; }
        .grp__icon { flex: none; width: 2.4rem; height: 2.4rem; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center;
            background: var(--p-primary-50); color: var(--p-primary-600); font-size: 1.1rem; }
        :host-context(.app-dark) .grp__icon { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .grp__title { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; margin: 0; color: var(--p-text-color); }
        .grp__desc { margin: 0.05rem 0 0; font-size: 0.8rem; color: var(--p-text-muted-color); }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1100px) { .grid { grid-template-columns: repeat(4, 1fr); } }

        .cons { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 0.4rem; text-align: left;
            padding: 0.95rem 1rem; border-radius: 0.95rem; cursor: pointer;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); color: var(--p-text-color);
            transition: border-color .15s ease, box-shadow .2s ease, transform .12s ease; }
        :host-context(.app-dark) .cons { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .cons:hover { border-color: var(--p-primary-300); box-shadow: 0 12px 26px -18px rgba(0,0,0,.45); transform: translateY(-2px); }
        .cons.is-empty { opacity: 0.62; }
        .cons__sigla { position: absolute; top: 0.7rem; right: 0.8rem; font-family: var(--font-mono); font-size: 0.66rem; font-weight: 700;
            color: var(--p-primary-700); background: var(--p-primary-50); padding: 0.1rem 0.4rem; border-radius: 0.35rem; }
        :host-context(.app-dark) .cons__sigla { background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-900)); color: var(--p-primary-200); }
        .cons__icon { width: 2.5rem; height: 2.5rem; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center;
            background: var(--p-primary-50); color: var(--p-primary-600); font-size: 1.2rem; }
        :host-context(.app-dark) .cons__icon { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .cons__name { font-weight: 700; font-size: 0.9rem; line-height: 1.15; }
        .cons__stats { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.15rem; }
        .pill { font-size: 0.66rem; font-weight: 700; padding: 0.12rem 0.45rem; border-radius: 9999px; }
        .pill--wait { background: #fef3c7; color: #b45309; }
        .pill--ready { background: #dcfce7; color: #15803d; }
        .pill--empty { background: var(--p-surface-100); color: var(--p-text-muted-color); }
        :host-context(.app-dark) .pill--empty { background: var(--p-surface-800); }
    `]
})
export class ConsultoriosComponent {
    private service = inject(ConsultaExternaService);
    private router = inject(Router);

    readonly grupos = GRUPOS_ESPECIALIDAD;
    private consultas = signal<ConsultaExterna[]>([]);
    loading = signal(true);

    private cards = computed<ConsultorioCard[]>(() =>
        ESPECIALIDADES.map((e) => {
            const list = this.consultas().filter((c) => c.especialidad === e.nombre);
            return {
                ...e,
                total: list.length,
                enEspera: list.filter((c) => c.estado === 'EN_ESPERA' || c.estado === 'EN_PREPARACION').length,
                listos: list.filter((c) => c.estado === 'LISTO_MEDICO').length,
                atendidos: list.filter((c) => c.estado === 'ATENDIDO').length
            };
        })
    );

    totalDia = computed(() => this.consultas().length);
    totalEspera = computed(() => this.cards().reduce((s, c) => s + c.enEspera, 0));
    totalListos = computed(() => this.cards().reduce((s, c) => s + c.listos, 0));
    activos = computed(() => this.cards().filter((c) => c.total > 0).length);

    cardsDe(grupo: GrupoEspecialidad): ConsultorioCard[] {
        return this.cards().filter((c) => c.grupo === grupo)
            .sort((a, b) => (b.total - a.total) || a.nombre.localeCompare(b.nombre));
    }

    constructor() {
        this.service.getTodas().subscribe({
            next: (d) => { this.consultas.set(Array.isArray(d) ? d : []); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    abrir(c: ConsultorioCard): void {
        this.router.navigate(['/app/enfermeria/consultorios', c.sigla]);
    }
}
