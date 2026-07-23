import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteService } from '@/app/core/services/paciente.service';
import { ConsultaExternaService } from '@/app/core/services/consulta-externa.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { ConsultaExterna, ConstantesBasales } from '@/app/core/models/consulta-externa.model';
import { Especialidad, especialidadPorSigla } from '@/app/core/models/especialidad.model';

@Component({
    selector: 'app-consultorio',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule, DialogModule, InputNumberModule,
        ToastModule, TooltipModule, FormHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <button class="back" (click)="volver()"><i class="pi pi-arrow-left"></i> Consultorios</button>

        <app-form-header [title]="'Consultorio · ' + (esp()?.nombre || '')" code="CONSULTA EXTERNA"
            subtitle="Triage y signos vitales → pasar la lista al médico" responsable="AMBAS" appReveal />

        <!-- KPIs -->
        <div class="kpis">
            <div class="kpi kpi--wait"><i class="pi pi-clock"></i><b class="tabular">{{ enEspera().length }}</b><span>En espera</span></div>
            <div class="kpi kpi--prep"><i class="pi pi-heart"></i><b class="tabular">{{ enTriage().length }}</b><span>Con signos</span></div>
            <div class="kpi kpi--ready"><i class="pi pi-check-circle"></i><b class="tabular">{{ listos().length }}</b><span>Listos p/ médico</span></div>
            <div class="kpi"><i class="pi pi-flag"></i><b class="tabular">{{ atendidos().length }}</b><span>Atendidos</span></div>
        </div>

        <div class="cols">
            <!-- Cola del consultorio -->
            <section class="panel" appReveal>
                <header class="panel__head">
                    <h2 class="panel__title"><i class="pi pi-users"></i> Cola del consultorio</h2>
                    <span class="panel__count">{{ cola().length }}</span>
                </header>

                @if (loading()) {
                    <div class="empty-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando…</span></div>
                } @else if (!cola().length) {
                    <div class="empty-state"><i class="pi pi-check-circle"></i>
                        <span class="empty-state__title">Cola vacía</span><span>No hay pacientes esperando en este consultorio.</span></div>
                } @else {
                    <ul class="list">
                        @for (c of cola(); track c.id; let i = $index) {
                            <li class="row" [appReveal]="i" [revealY]="8">
                                <span class="turno">{{ c.numeroTurno }}</span>
                                <span class="avatar" [class.is-pref]="c.prioridad === 'PREFERENCIAL'">{{ initials(c) }}</span>
                                <div class="who">
                                    <div class="who__name">{{ nombre(c) }}</div>
                                    <div class="who__meta">{{ c.motivoConsulta || 'Consulta' }}</div>
                                    <div class="who__tags">
                                        @if (c.prioridad === 'PREFERENCIAL') { <span class="t t--pref">Preferencial</span> }
                                        @if (tieneSignos(c)) { <span class="t t--ok"><i class="pi pi-check"></i> Signos tomados</span> }
                                        @else { <span class="t t--pend">Falta triage</span> }
                                    </div>
                                </div>
                                <div class="acts">
                                    <button pButton type="button" [label]="tieneSignos(c) ? 'Editar signos' : 'Tomar signos'"
                                        [icon]="tieneSignos(c) ? 'pi pi-pencil' : 'pi pi-heart'"
                                        class="p-button-sm" [class.p-button-outlined]="tieneSignos(c)" (click)="abrirTriage(c)"></button>
                                    <button pButton type="button" label="Listo" icon="pi pi-arrow-right" iconPos="right"
                                        class="p-button-sm p-button-success" [disabled]="!tieneSignos(c)"
                                        pTooltip="Pasar a la lista del médico" tooltipPosition="top" (click)="marcarListo(c)"></button>
                                    <button pButton type="button" icon="pi pi-file-edit" class="p-button-text p-button-sm"
                                        pTooltip="Formulario 002 completo" tooltipPosition="top" (click)="abrirForm002(c)"></button>
                                </div>
                            </li>
                        }
                    </ul>
                }
            </section>

            <!-- Lista para el médico -->
            <aside class="panel panel--ready" appReveal>
                <header class="panel__head">
                    <h2 class="panel__title"><i class="pi pi-send"></i> Lista para el médico</h2>
                    <span class="panel__count panel__count--green">{{ listos().length }}</span>
                </header>

                @if (!listos().length) {
                    <div class="empty-state"><i class="pi pi-inbox"></i>
                        <span class="empty-state__title">Sin pacientes listos</span>
                        <span>Tomá los signos y marcá «Listo» para armar la lista del médico.</span></div>
                } @else {
                    <ul class="ready">
                        @for (c of listos(); track c.id; let i = $index) {
                            <li class="ready__row" [appReveal]="i" [revealY]="6">
                                <span class="ready__turno">{{ c.numeroTurno }}</span>
                                <div class="ready__who">
                                    <div class="ready__name">{{ nombre(c) }}</div>
                                    <div class="ready__vitals">{{ resumenSignos(c) }}</div>
                                </div>
                                <button pButton type="button" icon="pi pi-check" class="p-button-text p-button-sm"
                                    pTooltip="Marcar atendido por el médico" tooltipPosition="left" (click)="marcarAtendido(c)"></button>
                            </li>
                        }
                    </ul>
                    <button pButton type="button" label="Pasar lista al médico" icon="pi pi-send"
                        class="w-full mt-2" (click)="pasarLista()"></button>
                }
            </aside>
        </div>

        <!-- Dialog triage / signos -->
        <p-dialog [header]="'Triage / signos — ' + (triageSel() ? nombre(triageSel()!) : '')" [(visible)]="triageVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '40rem' }">
            <div class="grid-v pt-1">
                <div class="fld"><label class="field-label">PA sistólica</label><p-inputnumber [(ngModel)]="signos.paSistolica" [min]="40" [max]="260" [useGrouping]="false" suffix=" mmHg" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">PA diastólica</label><p-inputnumber [(ngModel)]="signos.paDiastolica" [min]="20" [max]="160" [useGrouping]="false" suffix=" mmHg" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Frec. cardíaca</label><p-inputnumber [(ngModel)]="signos.fc" [min]="20" [max]="240" [useGrouping]="false" suffix=" lpm" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Frec. respiratoria</label><p-inputnumber [(ngModel)]="signos.fr" [min]="5" [max]="80" [useGrouping]="false" suffix=" rpm" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Temperatura</label><p-inputnumber [(ngModel)]="signos.temperatura" [min]="30" [max]="43" [minFractionDigits]="1" [maxFractionDigits]="1" suffix=" °C" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Saturación O₂</label><p-inputnumber [(ngModel)]="signos.saturacion" [min]="50" [max]="100" [useGrouping]="false" suffix=" %" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Peso</label><p-inputnumber [(ngModel)]="signos.peso" [min]="1" [max]="300" [minFractionDigits]="0" [maxFractionDigits]="1" suffix=" kg" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Glucemia capilar</label><p-inputnumber [(ngModel)]="signos.glucemia" [min]="20" [max]="800" [useGrouping]="false" suffix=" mg/dL" styleClass="w-full" /></div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="triageVisible = false" />
                <p-button label="Guardar signos" icon="pi pi-save" severity="secondary" [outlined]="true" (onClick)="guardarTriage(false)" [loading]="guardando()" />
                <p-button label="Guardar y pasar al médico" icon="pi pi-check" (onClick)="guardarTriage(true)" [loading]="guardando()" />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .back { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; font-weight: 600; color: var(--p-primary-700);
            background: none; border: none; cursor: pointer; padding: 0.2rem 0; margin-bottom: 0.6rem; }
        :host-context(.app-dark) .back { color: var(--p-primary-300); }
        .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 1rem 0 1.25rem; }
        @media (min-width: 768px) { .kpis { grid-template-columns: repeat(4, 1fr); } }
        .kpi { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem; border-radius: 0.9rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .kpi { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .kpi .pi { font-size: 1.15rem; color: var(--p-primary-600); }
        .kpi--wait .pi { color: #b45309; } .kpi--prep .pi { color: #0369a1; } .kpi--ready .pi { color: #15803d; }
        .kpi b { font-family: var(--font-display); font-size: 1.35rem; color: var(--p-text-color); }
        .kpi span { font-size: 0.74rem; color: var(--p-text-muted-color); font-weight: 600; }

        .cols { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 1100px) { .cols { grid-template-columns: 1.5fr 1fr; } }
        .panel { background: var(--p-surface-0); border: 1px solid var(--p-surface-200); border-radius: 1.1rem; padding: 1.1rem 1.2rem 1.2rem; }
        :host-context(.app-dark) .panel { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .panel--ready { border-color: color-mix(in srgb, #15803d 25%, var(--p-surface-200)); }
        .panel__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
        .panel__title { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; margin: 0; color: var(--p-text-color); }
        .panel__title .pi { color: var(--p-primary-600); }
        .panel__count { background: var(--p-primary-50); color: var(--p-primary-700); font-weight: 700; font-size: 0.78rem; padding: 0.12rem 0.55rem; border-radius: 9999px; }
        .panel__count--green { background: #dcfce7; color: #15803d; }

        .list { list-style: none; margin: 0; padding: 0; }
        .row { display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 0.7rem; padding: 0.7rem 0; border-bottom: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .row { border-bottom-color: var(--p-surface-700); }
        .row:last-child { border-bottom: none; }
        .turno { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; color: var(--p-primary-700); background: var(--p-primary-50); padding: 0.15rem 0.4rem; border-radius: 0.4rem; }
        :host-context(.app-dark) .turno { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .avatar { flex: none; width: 2.3rem; height: 2.3rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.78rem; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .avatar.is-pref { background: linear-gradient(135deg, #f59e0b, #b45309); }
        .who { min-width: 0; }
        .who__name { font-weight: 700; color: var(--p-text-color); line-height: 1.15; }
        .who__meta { font-size: 0.76rem; color: var(--p-text-muted-color); }
        .who__tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.25rem; }
        .t { font-size: 0.66rem; font-weight: 700; padding: 0.12rem 0.45rem; border-radius: 9999px; display: inline-flex; align-items: center; gap: 0.2rem; }
        .t .pi { font-size: 0.6rem; }
        .t--pref { background: #fef3c7; color: #b45309; }
        .t--ok { background: #dcfce7; color: #15803d; }
        .t--pend { background: var(--p-surface-100); color: var(--p-text-muted-color); }
        :host-context(.app-dark) .t--pend { background: var(--p-surface-800); }
        .acts { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; justify-content: flex-end; }
        @media (max-width: 640px) { .row { grid-template-columns: auto 1fr; } .acts { grid-column: 1 / 3; justify-content: flex-start; } }

        .ready { list-style: none; margin: 0; padding: 0; }
        .ready__row { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0; border-bottom: 1px solid var(--p-surface-100); }
        :host-context(.app-dark) .ready__row { border-bottom-color: var(--p-surface-800); }
        .ready__turno { font-family: var(--font-mono); font-size: 0.68rem; font-weight: 700; color: #15803d; background: #dcfce7; padding: 0.12rem 0.4rem; border-radius: 0.4rem; }
        .ready__who { flex: 1 1 auto; min-width: 0; }
        .ready__name { font-weight: 600; font-size: 0.88rem; color: var(--p-text-color); }
        .ready__vitals { font-size: 0.72rem; color: var(--p-text-muted-color); font-family: var(--font-mono); }

        .grid-v { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
        @media (min-width: 640px) { .grid-v { grid-template-columns: repeat(4, 1fr); } }
        .fld { display: flex; flex-direction: column; gap: 0.3rem; }
    `]
})
export class ConsultorioComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private service = inject(ConsultaExternaService);
    private pacienteService = inject(PacienteService);
    private messageService = inject(MessageService);

    private sigla = toSignal(this.route.paramMap.pipe(map((pm) => pm.get('sigla') ?? '')), { initialValue: '' });
    esp = computed<Especialidad | undefined>(() => especialidadPorSigla(this.sigla()));

    private consultas = signal<ConsultaExterna[]>([]);
    private pacientes = signal<Paciente[]>([]);
    loading = signal(true);
    guardando = signal(false);

    triageVisible = false;
    triageSel = signal<ConsultaExterna | null>(null);
    signos: ConstantesBasales = {};

    private delEsp = computed(() => {
        const e = this.esp();
        return e ? this.consultas().filter((c) => c.especialidad === e.nombre) : [];
    });
    enEspera = computed(() => this.delEsp().filter((c) => c.estado === 'EN_ESPERA'));
    enTriage = computed(() => this.delEsp().filter((c) => c.estado === 'EN_PREPARACION'));
    listos = computed(() => this.ordenar(this.delEsp().filter((c) => c.estado === 'LISTO_MEDICO')));
    atendidos = computed(() => this.delEsp().filter((c) => c.estado === 'ATENDIDO'));
    cola = computed(() => this.ordenar(this.delEsp().filter((c) => c.estado === 'EN_ESPERA' || c.estado === 'EN_PREPARACION')));

    constructor() {
        this.pacienteService.getAll().subscribe((d) => this.pacientes.set(d));
        effect(() => { this.sigla(); this.cargar(); });
    }

    private cargar(): void {
        this.loading.set(true);
        this.service.getTodas().subscribe({
            next: (d) => { this.consultas.set(Array.isArray(d) ? d : []); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el consultorio.' }); }
        });
    }

    private ordenar(list: ConsultaExterna[]): ConsultaExterna[] {
        return [...list].sort((a, b) =>
            (a.prioridad === b.prioridad ? 0 : a.prioridad === 'PREFERENCIAL' ? -1 : 1) ||
            a.numeroTurno.localeCompare(b.numeroTurno));
    }

    nombre(c: ConsultaExterna): string {
        const p = this.pacientes().find((x) => x.id === c.pacienteId);
        return p ? `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}` : `Paciente #${c.pacienteId}`;
    }
    initials(c: ConsultaExterna): string {
        const p = this.pacientes().find((x) => x.id === c.pacienteId);
        return `${p?.apellidoPaterno?.[0] ?? ''}${p?.nombres?.[0] ?? ''}`.toUpperCase() || 'P';
    }
    tieneSignos(c: ConsultaExterna): boolean {
        const k = c.constantes;
        return !!(k && (k.paSistolica || k.fc || k.temperatura || k.saturacion || k.fr));
    }
    resumenSignos(c: ConsultaExterna): string {
        const k = c.constantes;
        if (!k) return 'Sin signos';
        const parts: string[] = [];
        if (k.paSistolica && k.paDiastolica) parts.push(`PA ${k.paSistolica}/${k.paDiastolica}`);
        if (k.fc) parts.push(`FC ${k.fc}`);
        if (k.temperatura) parts.push(`T ${k.temperatura}°`);
        if (k.saturacion) parts.push(`SatO₂ ${k.saturacion}%`);
        return parts.join(' · ') || 'Sin signos';
    }

    abrirTriage(c: ConsultaExterna): void {
        this.triageSel.set(c);
        this.signos = { ...(c.constantes ?? {}) };
        this.triageVisible = true;
    }

    guardarTriage(pasarAlMedico: boolean): void {
        const c = this.triageSel();
        if (!c?.id) return;
        const now = new Date();
        const cambios: Partial<ConsultaExterna> = {
            constantes: { ...this.signos },
            estado: pasarAlMedico ? 'LISTO_MEDICO' : 'EN_PREPARACION',
            horaConstantes: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        };
        this.guardando.set(true);
        this.service.actualizar(c.id, cambios).subscribe({
            next: (saved) => {
                this.consultas.set(this.consultas().map((x) => (x.id === saved.id ? saved : x)));
                this.guardando.set(false); this.triageVisible = false;
                this.messageService.add({ severity: 'success', summary: pasarAlMedico ? 'Listo para el médico' : 'Signos guardados', detail: this.nombre(saved) });
            },
            error: () => { this.guardando.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' }); }
        });
    }

    marcarListo(c: ConsultaExterna): void {
        if (!c.id) return;
        this.patch(c, { estado: 'LISTO_MEDICO' }, 'Listo para el médico');
    }

    marcarAtendido(c: ConsultaExterna): void {
        if (!c.id) return;
        this.patch(c, { estado: 'ATENDIDO' }, 'Paciente atendido');
    }

    private patch(c: ConsultaExterna, cambios: Partial<ConsultaExterna>, msg: string): void {
        this.service.actualizar(c.id!, cambios).subscribe({
            next: (saved) => {
                this.consultas.set(this.consultas().map((x) => (x.id === saved.id ? saved : x)));
                this.messageService.add({ severity: 'success', summary: msg, detail: this.nombre(saved) });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' })
        });
    }

    pasarLista(): void {
        const n = this.listos().length;
        if (!n) return;
        this.messageService.add({ severity: 'info', summary: 'Lista entregada al médico', detail: `${n} paciente(s) del consultorio de ${this.esp()?.nombre} listos para atención médica.` });
    }

    abrirForm002(c: ConsultaExterna): void {
        if (c.id != null) this.router.navigate(['/app/enfermeria/consulta-externa', c.id]);
    }

    volver(): void { this.router.navigate(['/app/enfermeria/consultorios']); }
}
