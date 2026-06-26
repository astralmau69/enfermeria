import { Component, inject, signal, computed, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PacienteService } from '@/app/core/services/paciente.service';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { AuthService } from '@/app/core/services/auth.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';

type Riesgo = 'estable' | 'observacion' | 'critico';

interface TurnoPaciente {
    paciente: Paciente;
    cama: string;
    medsPendientes: number;
    signosPendiente: boolean;
    riesgo: Riesgo;
    ayuno: boolean;
}

interface Pendiente {
    pacienteId: number;
    nombre: string;
    cama: string;
    label: string;
    icon: string;
    severity: 'danger' | 'warn' | 'info' | 'secondary';
    form: string;
    orden: number;
}

interface Kpi {
    label: string;
    value: string;
    sub: string;
    icon: string;
    tone: 'primary' | 'amber' | 'rose' | 'sky';
}

/**
 * Dashboard "Inicio de Turno" — pantalla de aterrizaje de la enfermera al
 * empezar su turno. Resume el censo a cargo, las tareas prioritarias y da
 * acceso rápido a las hojas. Los indicadores se derivan del censo mock de
 * forma determinista (capa de demostración, sin backend real).
 */
@Component({
    selector: 'app-inicio-turno',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, TooltipModule, RevealDirective],
    template: `
        <!-- ───────────── Banner de bienvenida ───────────── -->
        <section class="welcome" appReveal>
            <div class="welcome__glow welcome__glow-1"></div>
            <div class="welcome__glow welcome__glow-2"></div>

            <div class="welcome__brand">
                <span class="welcome__emblem"><img src="img/logo_mediano.png" alt="Escudo COSSMIL" /></span>
                <div>
                    <div class="welcome__eyebrow">COSSMIL · Hospital Militar Central</div>
                    <h1 class="welcome__title">{{ saludo() }}, {{ nombreCorto() }}</h1>
                    <p class="welcome__sub">{{ fechaLarga() }} · {{ reloj() }}</p>
                </div>
            </div>

            <div class="welcome__shift">
                <span class="welcome__shift-label">Turno</span>
                <span class="welcome__shift-value"><i class="pi" [ngClass]="turnoIcon()"></i> {{ turno() }}</span>
            </div>
        </section>

        <!-- ───────────── KPIs ───────────── -->
        <div class="kpi-grid">
            @for (k of kpis(); track k.label; let i = $index) {
                <div class="kpi" [class]="'kpi--' + k.tone" [appReveal]="i">
                    <div class="kpi__icon"><i class="pi" [ngClass]="k.icon"></i></div>
                    <div class="kpi__body">
                        <div class="kpi__value tabular">{{ k.value }}</div>
                        <div class="kpi__label">{{ k.label }}</div>
                        <div class="kpi__sub">{{ k.sub }}</div>
                    </div>
                </div>
            }
        </div>

        <div class="cols">
            <!-- ───────────── Ronda de turno ───────────── -->
            <section class="panel" appReveal>
                <header class="panel__head">
                    <h2 class="panel__title"><i class="pi pi-users"></i> Ronda de turno</h2>
                    <button pButton type="button" label="Ver censo" icon="pi pi-arrow-right" iconPos="right"
                        class="p-button-text p-button-sm" (click)="irACenso()"></button>
                </header>

                @if (loading()) {
                    <div class="empty-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando censo…</span></div>
                } @else {
                    <ul class="ronda">
                        @for (t of ronda(); track t.paciente.id; let i = $index) {
                            <li class="ronda__row" [appReveal]="i" [revealY]="10">
                                <span class="ronda__cama">{{ t.cama }}</span>
                                <span class="ronda__avatar" [class.is-critico]="t.riesgo === 'critico'"
                                    [class.is-obs]="t.riesgo === 'observacion'">{{ initials(t.paciente) }}</span>
                                <div class="ronda__id">
                                    <div class="ronda__name">{{ t.paciente.apellidoPaterno }} {{ t.paciente.apellidoMaterno }} {{ t.paciente.nombres }}</div>
                                    <div class="ronda__meta">{{ t.paciente.edad ?? '—' }} a · {{ t.paciente.grado || t.paciente.tipoAsegurado }}</div>
                                </div>
                                <div class="ronda__chips">
                                    @if (t.riesgo === 'critico') { <span class="chip chip--danger">Crítico</span> }
                                    @else if (t.riesgo === 'observacion') { <span class="chip chip--warn">Observación</span> }
                                    @if (t.signosPendiente) { <span class="chip chip--sky"><i class="pi pi-chart-line"></i> SV</span> }
                                    @if (t.medsPendientes > 0) { <span class="chip chip--info"><i class="pi pi-box"></i> {{ t.medsPendientes }}</span> }
                                    @if (t.ayuno) { <span class="chip chip--muted">Ayuno</span> }
                                </div>
                                <div class="ronda__go">
                                    <button pButton type="button" icon="pi pi-chart-line" class="p-button-rounded p-button-text p-button-sm"
                                        pTooltip="Signos vitales" tooltipPosition="top" (click)="abrir('signos-vitales', t.paciente.id!)"></button>
                                    <button pButton type="button" icon="pi pi-box" class="p-button-rounded p-button-text p-button-sm"
                                        pTooltip="Medicamentos" tooltipPosition="top" (click)="abrir('medicamentos', t.paciente.id!)"></button>
                                    <button pButton type="button" icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm"
                                        pTooltip="Notas diarias" tooltipPosition="top" (click)="abrir('notas-diarias', t.paciente.id!)"></button>
                                </div>
                            </li>
                        }
                    </ul>
                }
            </section>

            <!-- ───────────── Pendientes prioritarios ───────────── -->
            <aside class="panel" appReveal>
                <header class="panel__head">
                    <h2 class="panel__title"><i class="pi pi-flag"></i> Pendientes prioritarios</h2>
                    <span class="panel__count">{{ pendientes().length }}</span>
                </header>

                @if (pendientes().length === 0) {
                    <div class="empty-state"><i class="pi pi-check-circle"></i><span class="empty-state__title">Turno al día</span><span>Sin pendientes prioritarios.</span></div>
                } @else {
                    <ul class="todo">
                        @for (p of pendientes(); track $index; let i = $index) {
                            <li class="todo__row" [class]="'todo--' + p.severity" (click)="abrir(p.form, p.pacienteId)" [appReveal]="i" [revealY]="8">
                                <span class="todo__icon"><i class="pi" [ngClass]="p.icon"></i></span>
                                <div class="todo__body">
                                    <div class="todo__label">{{ p.label }}</div>
                                    <div class="todo__meta">{{ p.cama }} · {{ p.nombre }}</div>
                                </div>
                                <i class="pi pi-angle-right todo__chev"></i>
                            </li>
                        }
                    </ul>
                }

                <div class="quick">
                    <span class="quick__label">Acceso rápido</span>
                    <div class="quick__grid">
                        <button class="quick__btn" (click)="ir('signos-vitales')"><i class="pi pi-chart-line"></i> Signos</button>
                        <button class="quick__btn" (click)="ir('medicamentos')"><i class="pi pi-box"></i> Kardex</button>
                        <button class="quick__btn" (click)="ir('notas-diarias')"><i class="pi pi-pencil"></i> Notas</button>
                        <button class="quick__btn" (click)="ir('evolucion')"><i class="pi pi-list"></i> Evolución</button>
                    </div>
                </div>
            </aside>
        </div>
    `,
    styles: [`
        :host { display: block; }

        /* ── Banner ── */
        .welcome {
            position: relative; overflow: hidden; display: flex; flex-wrap: wrap; gap: 1rem;
            align-items: center; justify-content: space-between;
            padding: 1.5rem 1.75rem; border-radius: 1.25rem; color: #fff; margin-bottom: 1.25rem;
            background: linear-gradient(120deg, var(--p-primary-700) 0%, var(--p-primary-500) 52%, #0f766e 100%);
            box-shadow: 0 16px 34px color-mix(in srgb, var(--p-primary-color) 32%, transparent);
        }
        .welcome__glow { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: .4; pointer-events: none; }
        .welcome__glow-1 { width: 320px; height: 320px; background: rgba(255,255,255,.4); top: -140px; right: -60px; }
        .welcome__glow-2 { width: 260px; height: 260px; background: rgba(16,185,129,.5); bottom: -120px; left: 30%; }
        .welcome__brand { display: flex; align-items: center; gap: 1rem; position: relative; z-index: 1; }
        .welcome__emblem {
            flex: none; width: 3.6rem; height: 3.6rem; border-radius: 1rem; background: #fff;
            display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,.22);
        }
        .welcome__emblem img { width: 2.8rem; height: 2.8rem; object-fit: contain; }
        .welcome__eyebrow { font-family: var(--font-mono); font-size: 0.64rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,.78); }
        .welcome__title { font-family: var(--font-display); font-weight: 700; font-size: 1.65rem; line-height: 1.08; margin: 0.15rem 0 0; color: #fff; }
        .welcome__sub { margin: 0.25rem 0 0; color: rgba(255,255,255,.82); font-size: 0.9rem; }
        .welcome__shift { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 0.2rem; align-items: flex-end; padding: 0.6rem 1rem; border-radius: 0.9rem; background: rgba(255,255,255,.16); backdrop-filter: blur(6px); }
        .welcome__shift-label { font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(255,255,255,.8); }
        .welcome__shift-value { font-weight: 700; font-size: 1.05rem; }
        .welcome__shift-value .pi { font-size: 0.85rem; margin-right: 0.25rem; }

        /* ── KPIs ── */
        .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        @media (min-width: 1024px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
        .kpi {
            display: flex; align-items: center; gap: 0.9rem; padding: 1.05rem 1.15rem;
            border-radius: 1rem; background: var(--p-surface-0); border: 1px solid var(--p-surface-200);
            box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 10px 24px -16px rgba(0,0,0,.3);
        }
        :host-context(.app-dark) .kpi { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .kpi__icon { flex: none; width: 2.9rem; height: 2.9rem; border-radius: 0.85rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .kpi--primary .kpi__icon { background: var(--p-primary-50); color: var(--p-primary-600); }
        .kpi--amber .kpi__icon { background: #fef3c7; color: #b45309; }
        .kpi--rose .kpi__icon { background: #ffe4e6; color: #be123c; }
        .kpi--sky .kpi__icon { background: #e0f2fe; color: #0369a1; }
        .kpi__value { font-family: var(--font-display); font-weight: 700; font-size: 1.55rem; line-height: 1; color: var(--p-text-color); }
        .kpi__label { font-weight: 600; font-size: 0.82rem; color: var(--p-text-color); margin-top: 0.15rem; }
        .kpi__sub { font-size: 0.72rem; color: var(--p-text-muted-color); }

        /* ── Layout dos columnas ── */
        .cols { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 1100px) { .cols { grid-template-columns: 1.6fr 1fr; } }

        .panel { background: var(--p-surface-0); border: 1px solid var(--p-surface-200); border-radius: 1.1rem; padding: 1.1rem 1.25rem 1.25rem; }
        :host-context(.app-dark) .panel { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .panel__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .panel__title { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; margin: 0; color: var(--p-text-color); }
        .panel__title .pi { color: var(--p-primary-600); }
        .panel__count { background: var(--p-primary-50); color: var(--p-primary-700); font-weight: 700; font-size: 0.8rem; padding: 0.15rem 0.6rem; border-radius: 9999px; }
        :host-context(.app-dark) .panel__count { background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-900)); color: var(--p-primary-200); }

        /* ── Ronda ── */
        .ronda { list-style: none; margin: 0; padding: 0; }
        .ronda__row { display: grid; grid-template-columns: auto auto 1fr auto auto; align-items: center; gap: 0.7rem; padding: 0.65rem 0; border-bottom: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .ronda__row { border-bottom-color: var(--p-surface-700); }
        .ronda__row:last-child { border-bottom: none; }
        .ronda__cama { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 600; color: var(--p-primary-700); background: var(--p-primary-50); padding: 0.2rem 0.45rem; border-radius: 0.45rem; white-space: nowrap; }
        :host-context(.app-dark) .ronda__cama { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .ronda__avatar { flex: none; width: 2.3rem; height: 2.3rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .ronda__avatar.is-obs { background: linear-gradient(135deg, #f59e0b, #b45309); }
        .ronda__avatar.is-critico { background: linear-gradient(135deg, #f43f5e, #be123c); }
        .ronda__name { font-weight: 600; color: var(--p-text-color); line-height: 1.15; }
        .ronda__meta { font-size: 0.74rem; color: var(--p-text-muted-color); }
        .ronda__chips { display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: flex-end; }
        .ronda__go { display: flex; gap: 0.1rem; }
        @media (max-width: 640px) {
            .ronda__row { grid-template-columns: auto 1fr auto; }
            .ronda__cama, .ronda__go { display: none; }
            .ronda__chips { grid-column: 2 / 4; justify-content: flex-start; }
        }

        .chip { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.66rem; font-weight: 700; padding: 0.12rem 0.45rem; border-radius: 9999px; white-space: nowrap; }
        .chip .pi { font-size: 0.62rem; }
        .chip--danger { background: #ffe4e6; color: #be123c; }
        .chip--warn { background: #fef3c7; color: #b45309; }
        .chip--sky { background: #e0f2fe; color: #0369a1; }
        .chip--info { background: var(--p-primary-50); color: var(--p-primary-700); }
        .chip--muted { background: var(--p-surface-100); color: var(--p-text-muted-color); }
        :host-context(.app-dark) .chip--muted { background: var(--p-surface-800); }

        /* ── Pendientes (todo) ── */
        .todo { list-style: none; margin: 0 0 0.25rem; padding: 0; }
        .todo__row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.7rem; border-radius: 0.7rem; cursor: pointer; transition: background-color .15s ease, transform .12s ease; border-left: 3px solid transparent; }
        .todo__row:hover { background: var(--p-surface-50); transform: translateX(2px); }
        :host-context(.app-dark) .todo__row:hover { background: var(--p-surface-800); }
        .todo--danger { border-left-color: #f43f5e; }
        .todo--warn { border-left-color: #f59e0b; }
        .todo--info { border-left-color: var(--p-primary-500); }
        .todo--secondary { border-left-color: var(--p-surface-300); }
        .todo__icon { flex: none; width: 2rem; height: 2rem; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; background: var(--p-surface-100); color: var(--p-text-color); }
        :host-context(.app-dark) .todo__icon { background: var(--p-surface-800); }
        .todo--danger .todo__icon { background: #ffe4e6; color: #be123c; }
        .todo--warn .todo__icon { background: #fef3c7; color: #b45309; }
        .todo--info .todo__icon { background: var(--p-primary-50); color: var(--p-primary-700); }
        .todo__label { font-weight: 600; font-size: 0.86rem; color: var(--p-text-color); line-height: 1.15; }
        .todo__meta { font-size: 0.74rem; color: var(--p-text-muted-color); }
        .todo__body { flex: 1 1 auto; min-width: 0; }
        .todo__chev { color: var(--p-text-muted-color); }

        /* ── Acceso rápido ── */
        .quick { margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .quick { border-top-color: var(--p-surface-700); }
        .quick__label { font-family: var(--font-mono); font-size: 0.62rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--p-text-muted-color); }
        .quick__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.5rem; }
        .quick__btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.7rem; border-radius: 0.7rem; font-weight: 600; font-size: 0.84rem; cursor: pointer; color: var(--p-text-color); background: var(--p-surface-50); border: 1px solid var(--p-surface-200); transition: border-color .15s ease, background .15s ease, transform .12s ease; }
        :host-context(.app-dark) .quick__btn { background: var(--p-surface-800); border-color: var(--p-surface-700); }
        .quick__btn:hover { border-color: var(--p-primary-300); background: var(--p-primary-50); transform: translateY(-1px); }
        :host-context(.app-dark) .quick__btn:hover { background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900)); }
        .quick__btn .pi { color: var(--p-primary-600); }
    `]
})
export class InicioTurnoComponent implements OnDestroy {
    private pacienteService = inject(PacienteService);
    private activo = inject(PacienteActivoService);
    private auth = inject(AuthService);
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);

    private pacientes = signal<Paciente[]>([]);
    loading = signal(true);
    private now = signal(new Date());
    private timer?: ReturnType<typeof setInterval>;

    private readonly capacidad = 20;

    constructor() {
        this.pacienteService.getAll().subscribe({
            next: (data) => { this.pacientes.set(data); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
        if (isPlatformBrowser(this.platformId)) {
            this.timer = setInterval(() => this.now.set(new Date()), 30000);
        }
    }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    // ── Identidad / saludo ──────────────────────────────────────────────────
    nombreCorto = computed(() => {
        const u = this.auth.currentUser();
        if (u?.primerApellido) return `Lic. ${u.primerApellido}`;
        return u?.nombres ?? 'Enfermera';
    });

    private hora = computed(() => this.now().getHours());

    saludo = computed(() => {
        const h = this.hora();
        if (h >= 6 && h < 13) return 'Buenos días';
        if (h >= 13 && h < 19) return 'Buenas tardes';
        return 'Buenas noches';
    });

    turno = computed(() => {
        const h = this.hora();
        if (h >= 7 && h < 14) return 'Mañana';
        if (h >= 14 && h < 21) return 'Tarde';
        return 'Noche';
    });

    turnoIcon = computed(() => {
        const t = this.turno();
        return t === 'Mañana' ? 'pi-sun' : t === 'Tarde' ? 'pi-cloud' : 'pi-moon';
    });

    reloj = computed(() =>
        this.now().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
    );

    fechaLarga = computed(() => {
        const f = this.now().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return f.charAt(0).toUpperCase() + f.slice(1);
    });

    // ── Derivación determinista del estado de turno ─────────────────────────
    ronda = computed<TurnoPaciente[]>(() =>
        this.pacientes().map((p) => {
            const id = p.id ?? 0;
            const edad = p.edad ?? 0;
            let riesgo: Riesgo = 'estable';
            if (id % 7 === 0 || edad >= 80) riesgo = 'critico';
            else if (edad >= 68 || id % 4 === 0) riesgo = 'observacion';
            return {
                paciente: p,
                cama: `H-${300 + id}`,
                medsPendientes: (id * 3) % 4,
                signosPendiente: id % 2 === 0,
                riesgo,
                ayuno: id % 5 === 0
            };
        })
    );

    kpis = computed<Kpi[]>(() => {
        const r = this.ronda();
        const meds = r.reduce((s, t) => s + t.medsPendientes, 0);
        const sv = r.filter((t) => t.signosPendiente).length;
        const alertas = r.filter((t) => t.riesgo !== 'estable').length;
        return [
            { label: 'Pacientes a cargo', value: `${r.length}`, sub: 'Censo asignado', icon: 'pi-users', tone: 'primary' },
            { label: 'Camas ocupadas', value: `${r.length}/${this.capacidad}`, sub: 'Unidad de hospitalización', icon: 'pi-building', tone: 'sky' },
            { label: 'Medicación por dar', value: `${meds}`, sub: 'Dosis del turno (Kardex)', icon: 'pi-box', tone: 'amber' },
            { label: 'Alertas clínicas', value: `${alertas}`, sub: `${sv} controles de SV pendientes`, icon: 'pi-exclamation-triangle', tone: 'rose' }
        ];
    });

    pendientes = computed<Pendiente[]>(() => {
        const out: Pendiente[] = [];
        for (const t of this.ronda()) {
            const nombre = `${t.paciente.apellidoPaterno} ${t.paciente.nombres}`;
            const base = { pacienteId: t.paciente.id!, nombre, cama: t.cama };
            if (t.riesgo === 'critico')
                out.push({ ...base, label: 'Control estricto de signos vitales', icon: 'pi-exclamation-triangle', severity: 'danger', form: 'signos-vitales', orden: 0 });
            if (t.medsPendientes > 0)
                out.push({ ...base, label: `${t.medsPendientes} medicación(es) por administrar`, icon: 'pi-box', severity: 'info', form: 'medicamentos', orden: 1 });
            if (t.signosPendiente && t.riesgo !== 'critico')
                out.push({ ...base, label: 'Tomar signos vitales', icon: 'pi-chart-line', severity: 'warn', form: 'signos-vitales', orden: 2 });
            if (t.ayuno)
                out.push({ ...base, label: 'Paciente en ayuno — verificar dieta', icon: 'pi-ban', severity: 'secondary', form: 'notas-diarias', orden: 3 });
        }
        return out.sort((a, b) => a.orden - b.orden).slice(0, 7);
    });

    // ── Navegación ──────────────────────────────────────────────────────────
    initials(p: Paciente): string {
        return `${p.apellidoPaterno?.[0] ?? ''}${p.nombres?.[0] ?? ''}`.toUpperCase();
    }

    abrir(form: string, pacienteId: number): void {
        this.activo.setId(pacienteId);
        this.router.navigate([`/app/enfermeria/${form}`]);
    }

    ir(form: string): void {
        this.router.navigate([`/app/enfermeria/${form}`]);
    }

    irACenso(): void {
        this.router.navigate(['/app/enfermeria/pacientes']);
    }
}
