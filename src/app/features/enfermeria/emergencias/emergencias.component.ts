import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { EmergenciaService } from '@/app/core/services/emergencia.service';
import { PacienteEmergencia, NivelTriage, EstadoEmergencia, SignosEmergencia, NIVELES_TRIAGE, nivelInfo } from '@/app/core/models/emergencia.model';

@Component({
    selector: 'app-emergencias',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule, DialogModule, SelectModule,
        InputTextModule, InputNumberModule, TextareaModule, ToastModule, TooltipModule,
        FormHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header title="Emergencias" code="TRIAGE"
            subtitle="Clasificación de gravedad (Manchester), signos vitales y seguimiento" responsable="LIC" appReveal />

        <!-- KPIs por nivel de triage -->
        <div class="kpis">
            @for (n of niveles; track n.nivel; let i = $index) {
                <button class="kpi" [attr.data-nivel]="n.nivel" [class.is-active]="filtroNivel() === n.nivel"
                    (click)="toggleNivel(n.nivel)" [appReveal]="i">
                    <span class="kpi__icon"><i class="pi" [ngClass]="n.icon"></i></span>
                    <span class="kpi__value tabular">{{ conteo(n.nivel) }}</span>
                    <span class="kpi__label">{{ n.label.split('—')[0].trim() }}</span>
                </button>
            }
        </div>

        <!-- Barra -->
        <div class="toolbar">
            <div class="leyenda">
                <i class="pi pi-info-circle"></i>
                <span>{{ enArea().length }} en el área · rojo = inmediato, azul = no urgente</span>
            </div>
            <div class="flex items-center gap-2">
                <button pButton type="button" [label]="mostrarResueltos() ? 'Ocultar resueltos' : 'Ver resueltos'"
                    [icon]="mostrarResueltos() ? 'pi pi-eye-slash' : 'pi pi-history'" class="p-button-text p-button-sm"
                    (click)="mostrarResueltos.set(!mostrarResueltos())"></button>
                <button pButton type="button" label="Nueva llegada" icon="pi pi-plus" class="p-button-sm" (click)="abrirNueva()"></button>
            </div>
        </div>

        @if (loading()) {
            <div class="empty-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando…</span></div>
        } @else if (!visibles().length) {
            <div class="empty-state"><i class="pi pi-check-circle"></i>
                <span class="empty-state__title">Sin pacientes en este filtro</span>
                <span>Usá «Nueva llegada» para registrar y clasificar un paciente.</span></div>
        } @else {
            <div class="board">
                @for (p of visibles(); track p.id; let i = $index) {
                    <div class="card" [attr.data-nivel]="p.nivelTriage" [appReveal]="i" [revealY]="8">
                        <div class="card__lvl">
                            <span class="lvl" [attr.data-nivel]="p.nivelTriage"><i class="pi" [ngClass]="info(p.nivelTriage).icon"></i> {{ etiquetaNivel(p.nivelTriage) }}</span>
                            <span class="card__time"><i class="pi pi-clock"></i> {{ p.horaLlegada }} · {{ info(p.nivelTriage).tiempo }}</span>
                        </div>
                        <div class="card__id">
                            <div class="card__name">{{ p.pacienteNombre }}</div>
                            <div class="card__meta">{{ p.edad ? p.edad + ' a' : '—' }} · {{ p.sexo === 'M' ? 'M' : p.sexo === 'F' ? 'F' : '—' }}</div>
                        </div>
                        <div class="card__motivo">{{ p.motivo }}</div>
                        @if (resumen(p.signos)) { <div class="card__vitals"><i class="pi pi-heart"></i> {{ resumen(p.signos) }}</div> }
                        <div class="card__foot">
                            <p-tag [value]="estadoLabel(p.estado)" [severity]="estadoSev(p.estado)" styleClass="text-xs" />
                            @if (p.destino) { <span class="destino">→ {{ p.destino }}</span> }
                            <span class="flex-1"></span>
                            <div class="card__acts">
                                @switch (p.estado) {
                                    @case ('EN_TRIAGE') {
                                        <button pButton type="button" icon="pi pi-heart" class="p-button-text p-button-sm" pTooltip="Signos" tooltipPosition="top" (click)="abrirSignos(p)"></button>
                                        <button pButton type="button" label="Atender" icon="pi pi-play" class="p-button-sm" (click)="patch(p, { estado: 'EN_ATENCION' }, 'En atención')"></button>
                                    }
                                    @case ('EN_ATENCION') {
                                        <button pButton type="button" icon="pi pi-heart" class="p-button-text p-button-sm" pTooltip="Signos" tooltipPosition="top" (click)="abrirSignos(p)"></button>
                                        <button pButton type="button" label="Observación" icon="pi pi-eye" class="p-button-text p-button-sm" (click)="patch(p, { estado: 'OBSERVACION' }, 'En observación')"></button>
                                        <button pButton type="button" label="Resolver" icon="pi pi-sign-out" class="p-button-sm" (click)="abrirResolver(p)"></button>
                                    }
                                    @case ('OBSERVACION') {
                                        <button pButton type="button" icon="pi pi-heart" class="p-button-text p-button-sm" pTooltip="Signos" tooltipPosition="top" (click)="abrirSignos(p)"></button>
                                        <button pButton type="button" label="Resolver" icon="pi pi-sign-out" class="p-button-sm" (click)="abrirResolver(p)"></button>
                                    }
                                    @default {
                                        <span class="resuelto"><i class="pi pi-check-circle"></i> {{ estadoLabel(p.estado) }}</span>
                                    }
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>
        }

        <!-- Dialog nueva llegada -->
        <p-dialog header="Nueva llegada a Emergencias" [(visible)]="nuevaVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '42rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Paciente</label>
                        <input pInputText [(ngModel)]="nueva.pacienteNombre" placeholder="Apellidos y nombres" />
                    </div>
                    <div class="flex flex-col gap-1 w-24">
                        <label class="field-label">Edad</label>
                        <p-inputnumber [(ngModel)]="nueva.edad" [min]="0" [max]="120" [useGrouping]="false" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 w-28">
                        <label class="field-label">Sexo</label>
                        <p-select [options]="sexoOptions" optionLabel="label" optionValue="value" [(ngModel)]="nueva.sexo" appendTo="body" styleClass="w-full" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Motivo de consulta</label>
                    <input pInputText [(ngModel)]="nueva.motivo" placeholder="Ej.: Dolor torácico, trauma, dificultad respiratoria…" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Nivel de triage (Manchester)</label>
                    <p-select [options]="niveles" optionLabel="label" optionValue="nivel" [(ngModel)]="nueva.nivelTriage"
                        placeholder="Clasificar gravedad" appendTo="body" styleClass="w-full" />
                    <span class="field-hint">Rojo = atención inmediata · Azul = no urgente.</span>
                </div>
                <div class="grid-v">
                    <div class="fld"><label class="field-label">PA sist.</label><p-inputnumber [(ngModel)]="nuevaSignos.paSistolica" [min]="40" [max]="260" [useGrouping]="false" styleClass="w-full" /></div>
                    <div class="fld"><label class="field-label">PA diast.</label><p-inputnumber [(ngModel)]="nuevaSignos.paDiastolica" [min]="20" [max]="160" [useGrouping]="false" styleClass="w-full" /></div>
                    <div class="fld"><label class="field-label">FC</label><p-inputnumber [(ngModel)]="nuevaSignos.fc" [min]="20" [max]="240" [useGrouping]="false" styleClass="w-full" /></div>
                    <div class="fld"><label class="field-label">FR</label><p-inputnumber [(ngModel)]="nuevaSignos.fr" [min]="5" [max]="80" [useGrouping]="false" styleClass="w-full" /></div>
                    <div class="fld"><label class="field-label">Temp °C</label><p-inputnumber [(ngModel)]="nuevaSignos.temperatura" [min]="30" [max]="43" [minFractionDigits]="1" [maxFractionDigits]="1" styleClass="w-full" /></div>
                    <div class="fld"><label class="field-label">SatO₂ %</label><p-inputnumber [(ngModel)]="nuevaSignos.saturacion" [min]="50" [max]="100" [useGrouping]="false" styleClass="w-full" /></div>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="nuevaVisible = false" />
                <p-button label="Registrar" icon="pi pi-check" (onClick)="registrar()" [disabled]="!nueva.pacienteNombre || !nueva.motivo || !nueva.nivelTriage" />
            </ng-template>
        </p-dialog>

        <!-- Dialog signos -->
        <p-dialog [header]="'Signos vitales — ' + (sel()?.pacienteNombre || '')" [(visible)]="signosVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'" [style]="{ width: '40rem' }">
            <div class="grid-v pt-1">
                <div class="fld"><label class="field-label">PA sist.</label><p-inputnumber [(ngModel)]="signos.paSistolica" [min]="40" [max]="260" [useGrouping]="false" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">PA diast.</label><p-inputnumber [(ngModel)]="signos.paDiastolica" [min]="20" [max]="160" [useGrouping]="false" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">FC</label><p-inputnumber [(ngModel)]="signos.fc" [min]="20" [max]="240" [useGrouping]="false" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">FR</label><p-inputnumber [(ngModel)]="signos.fr" [min]="5" [max]="80" [useGrouping]="false" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Temp °C</label><p-inputnumber [(ngModel)]="signos.temperatura" [min]="30" [max]="43" [minFractionDigits]="1" [maxFractionDigits]="1" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">SatO₂ %</label><p-inputnumber [(ngModel)]="signos.saturacion" [min]="50" [max]="100" [useGrouping]="false" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Glucemia</label><p-inputnumber [(ngModel)]="signos.glucemia" [min]="20" [max]="800" [useGrouping]="false" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Glasgow</label><p-inputnumber [(ngModel)]="signos.glasgow" [min]="3" [max]="15" [useGrouping]="false" styleClass="w-full" /></div>
                <div class="fld"><label class="field-label">Dolor (0-10)</label><p-inputnumber [(ngModel)]="signos.dolor" [min]="0" [max]="10" [useGrouping]="false" styleClass="w-full" /></div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="signosVisible = false" />
                <p-button label="Guardar signos" icon="pi pi-check" (onClick)="guardarSignos()" [loading]="guardando()" />
            </ng-template>
        </p-dialog>

        <!-- Dialog resolver -->
        <p-dialog [header]="'Resolver — ' + (sel()?.pacienteNombre || '')" [(visible)]="resolverVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'" [style]="{ width: '34rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Destino</label>
                    <p-select [options]="destinoOptions" [(ngModel)]="resolucion.estado" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label">Detalle / servicio</label>
                    <input pInputText [(ngModel)]="resolucion.destino" placeholder="Ej.: MEDICINA INTERNA — Piso 2 · o indicaciones de alta" />
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="resolverVisible = false" />
                <p-button label="Confirmar" icon="pi pi-check" (onClick)="guardarResolucion()" [loading]="guardando()" />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.7rem; margin: 1rem 0; }
        @media (min-width: 768px) { .kpis { grid-template-columns: repeat(5, 1fr); } }
        .kpi { display: flex; align-items: center; gap: 0.55rem; padding: 0.8rem 0.9rem; cursor: pointer; text-align: left;
            border-radius: 0.9rem; background: var(--p-surface-0); border: 1px solid var(--p-surface-200);
            border-left-width: 4px; transition: transform .12s ease, box-shadow .2s ease; }
        :host-context(.app-dark) .kpi { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .kpi:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -14px rgba(0,0,0,.4); }
        .kpi.is-active { box-shadow: 0 0 0 2px color-mix(in srgb, var(--p-primary-color) 22%, transparent); }
        .kpi[data-nivel="ROJO"] { border-left-color: #dc2626; }
        .kpi[data-nivel="NARANJA"] { border-left-color: #ea580c; }
        .kpi[data-nivel="AMARILLO"] { border-left-color: #ca8a04; }
        .kpi[data-nivel="VERDE"] { border-left-color: #16a34a; }
        .kpi[data-nivel="AZUL"] { border-left-color: #2563eb; }
        .kpi__icon { width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex: none; }
        .kpi[data-nivel="ROJO"] .kpi__icon { background: #fee2e2; color: #b91c1c; }
        .kpi[data-nivel="NARANJA"] .kpi__icon { background: #ffedd5; color: #c2410c; }
        .kpi[data-nivel="AMARILLO"] .kpi__icon { background: #fef9c3; color: #a16207; }
        .kpi[data-nivel="VERDE"] .kpi__icon { background: #dcfce7; color: #15803d; }
        .kpi[data-nivel="AZUL"] .kpi__icon { background: #dbeafe; color: #1d4ed8; }
        .kpi__value { font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; line-height: 1; }
        .kpi__label { font-size: 0.72rem; color: var(--p-text-muted-color); font-weight: 700; }

        .toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; }
        .leyenda { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--p-text-muted-color); }

        .board { display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.9rem; }
        @media (min-width: 700px) { .board { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1200px) { .board { grid-template-columns: repeat(3, 1fr); } }
        .card { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.9rem 1rem; border-radius: 0.95rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); border-left-width: 5px; }
        :host-context(.app-dark) .card { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .card[data-nivel="ROJO"] { border-left-color: #dc2626; }
        .card[data-nivel="NARANJA"] { border-left-color: #ea580c; }
        .card[data-nivel="AMARILLO"] { border-left-color: #ca8a04; }
        .card[data-nivel="VERDE"] { border-left-color: #16a34a; }
        .card[data-nivel="AZUL"] { border-left-color: #2563eb; }
        .card__lvl { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .lvl { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.68rem; font-weight: 800; padding: 0.18rem 0.5rem; border-radius: 9999px; }
        .lvl[data-nivel="ROJO"] { background: #fee2e2; color: #b91c1c; }
        .lvl[data-nivel="NARANJA"] { background: #ffedd5; color: #c2410c; }
        .lvl[data-nivel="AMARILLO"] { background: #fef9c3; color: #a16207; }
        .lvl[data-nivel="VERDE"] { background: #dcfce7; color: #15803d; }
        .lvl[data-nivel="AZUL"] { background: #dbeafe; color: #1d4ed8; }
        .card__time { font-size: 0.7rem; color: var(--p-text-muted-color); font-family: var(--font-mono); display: inline-flex; align-items: center; gap: 0.25rem; }
        .card__id { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
        .card__name { font-weight: 700; color: var(--p-text-color); line-height: 1.15; }
        .card__meta { font-size: 0.74rem; color: var(--p-text-muted-color); white-space: nowrap; }
        .card__motivo { font-size: 0.85rem; color: var(--p-text-color); }
        .card__vitals { font-size: 0.74rem; color: var(--p-text-muted-color); font-family: var(--font-mono); display: inline-flex; align-items: center; gap: 0.3rem; }
        .card__vitals .pi { color: #be123c; font-size: 0.7rem; }
        .card__foot { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-top: auto; padding-top: 0.4rem; border-top: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .card__foot { border-top-color: var(--p-surface-700); }
        .card__acts { display: flex; align-items: center; gap: 0.2rem; flex-wrap: wrap; }
        .destino { font-size: 0.72rem; color: var(--p-primary-700); font-weight: 600; }
        :host-context(.app-dark) .destino { color: var(--p-primary-300); }
        .resuelto { font-size: 0.76rem; color: var(--p-text-muted-color); display: inline-flex; align-items: center; gap: 0.25rem; }

        .grid-v { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.7rem; }
        @media (min-width: 640px) { .grid-v { grid-template-columns: repeat(3, 1fr); } }
        .fld { display: flex; flex-direction: column; gap: 0.3rem; }
    `]
})
export class EmergenciasComponent {
    private service = inject(EmergenciaService);
    private messageService = inject(MessageService);

    readonly niveles = NIVELES_TRIAGE;
    readonly sexoOptions = [{ label: 'Masculino', value: 'M' }, { label: 'Femenino', value: 'F' }];
    readonly destinoOptions = [
        { label: 'Alta a domicilio', value: 'ALTA' },
        { label: 'Internación', value: 'INTERNACION' }
    ];

    private items = signal<PacienteEmergencia[]>([]);
    loading = signal(true);
    guardando = signal(false);
    filtroNivel = signal<NivelTriage | null>(null);
    mostrarResueltos = signal(false);

    nuevaVisible = false;
    nueva: Partial<PacienteEmergencia> = this.vacia();
    nuevaSignos: SignosEmergencia = {};

    signosVisible = false;
    resolverVisible = false;
    sel = signal<PacienteEmergencia | null>(null);
    signos: SignosEmergencia = {};
    resolucion: { estado: EstadoEmergencia; destino: string } = { estado: 'ALTA', destino: '' };

    private readonly activos: EstadoEmergencia[] = ['EN_TRIAGE', 'EN_ATENCION', 'OBSERVACION'];

    enArea = computed(() => this.items().filter((p) => this.activos.includes(p.estado)));

    visibles = computed(() => {
        const nivel = this.filtroNivel();
        const verResueltos = this.mostrarResueltos();
        return this.items()
            .filter((p) => (verResueltos ? true : this.activos.includes(p.estado)))
            .filter((p) => !nivel || p.nivelTriage === nivel)
            .sort((a, b) => (nivelInfo(a.nivelTriage).orden - nivelInfo(b.nivelTriage).orden) || a.horaLlegada.localeCompare(b.horaLlegada));
    });

    constructor() { this.cargar(); }

    private cargar(): void {
        this.loading.set(true);
        this.service.getTodas().subscribe({
            next: (d) => { this.items.set(Array.isArray(d) ? d : []); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar emergencias.' }); }
        });
    }

    info(n: NivelTriage) { return nivelInfo(n); }
    etiquetaNivel(n: NivelTriage): string { return nivelInfo(n).label.split('—')[1]?.trim() || n; }
    conteo(n: NivelTriage): number { return this.enArea().filter((p) => p.nivelTriage === n).length; }
    toggleNivel(n: NivelTriage): void { this.filtroNivel.set(this.filtroNivel() === n ? null : n); }

    estadoLabel(e: EstadoEmergencia): string {
        return { EN_TRIAGE: 'En triage', EN_ATENCION: 'En atención', OBSERVACION: 'Observación', ALTA: 'Alta', INTERNACION: 'Internado' }[e];
    }
    estadoSev(e: EstadoEmergencia): 'warn' | 'info' | 'success' | 'secondary' {
        return e === 'EN_TRIAGE' ? 'warn' : e === 'EN_ATENCION' ? 'info' : e === 'OBSERVACION' ? 'info' : 'secondary';
    }
    resumen(s?: SignosEmergencia): string {
        if (!s) return '';
        const parts: string[] = [];
        if (s.paSistolica && s.paDiastolica) parts.push(`PA ${s.paSistolica}/${s.paDiastolica}`);
        if (s.fc) parts.push(`FC ${s.fc}`);
        if (s.fr) parts.push(`FR ${s.fr}`);
        if (s.saturacion) parts.push(`SatO₂ ${s.saturacion}%`);
        if (s.temperatura) parts.push(`T ${s.temperatura}°`);
        if (s.glucemia) parts.push(`Glu ${s.glucemia}`);
        if (s.glasgow) parts.push(`Glasgow ${s.glasgow}`);
        if (s.dolor != null) parts.push(`Dolor ${s.dolor}/10`);
        return parts.join(' · ');
    }

    abrirNueva(): void { this.nueva = this.vacia(); this.nuevaSignos = {}; this.nuevaVisible = true; }

    registrar(): void {
        const n = this.nueva;
        if (!n.pacienteNombre || !n.motivo || !n.nivelTriage) return;
        const now = new Date();
        const payload: PacienteEmergencia = {
            pacienteNombre: n.pacienteNombre!.trim(),
            edad: n.edad ?? undefined,
            sexo: n.sexo as PacienteEmergencia['sexo'],
            motivo: n.motivo!.trim(),
            nivelTriage: n.nivelTriage as NivelTriage,
            estado: 'EN_TRIAGE',
            fecha: now.toISOString().split('T')[0],
            horaLlegada: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            signos: this.limpiar(this.nuevaSignos)
        };
        this.service.crear(payload).subscribe({
            next: (saved) => { this.items.set([...this.items(), saved]); this.nuevaVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Registrado en emergencias', detail: `${saved.pacienteNombre} · ${this.etiquetaNivel(saved.nivelTriage)}` }); },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar.' })
        });
    }

    abrirSignos(p: PacienteEmergencia): void { this.sel.set(p); this.signos = { ...(p.signos ?? {}) }; this.signosVisible = true; }
    guardarSignos(): void {
        const p = this.sel();
        if (!p?.id) return;
        this.patch(p, { signos: this.limpiar(this.signos) }, 'Signos actualizados', () => (this.signosVisible = false));
    }

    abrirResolver(p: PacienteEmergencia): void { this.sel.set(p); this.resolucion = { estado: 'ALTA', destino: '' }; this.resolverVisible = true; }
    guardarResolucion(): void {
        const p = this.sel();
        if (!p?.id) return;
        this.patch(p, { estado: this.resolucion.estado, destino: this.resolucion.destino?.trim() || undefined },
            this.resolucion.estado === 'ALTA' ? 'Paciente dado de alta' : 'Paciente internado', () => (this.resolverVisible = false));
    }

    patch(p: PacienteEmergencia, cambios: Partial<PacienteEmergencia>, msg: string, done?: () => void): void {
        if (!p.id) return;
        this.guardando.set(true);
        this.service.actualizar(p.id, cambios).subscribe({
            next: (saved) => { this.items.set(this.items().map((x) => (x.id === saved.id ? saved : x))); this.guardando.set(false);
                this.messageService.add({ severity: 'success', summary: msg, detail: saved.pacienteNombre }); done?.(); },
            error: () => { this.guardando.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }); }
        });
    }

    private limpiar(s?: SignosEmergencia): SignosEmergencia | undefined {
        if (!s) return undefined;
        const out: SignosEmergencia = {};
        for (const k of Object.keys(s) as (keyof SignosEmergencia)[]) {
            if (s[k] != null) out[k] = s[k];
        }
        return Object.keys(out).length ? out : undefined;
    }

    private vacia(): Partial<PacienteEmergencia> {
        return { pacienteNombre: '', motivo: '', nivelTriage: undefined, sexo: undefined };
    }
}
