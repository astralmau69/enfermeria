import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteService } from '@/app/core/services/paciente.service';
import { ProcedimientoAmbulatorioService } from '@/app/core/services/procedimiento-ambulatorio.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { ProcedimientoAmbulatorio, TipoProcedimiento, TIPOS_PROCEDIMIENTO } from '@/app/core/models/procedimiento-ambulatorio.model';

@Component({
    selector: 'app-procedimientos-ambulatorios',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, TagModule, ButtonModule, DialogModule,
        SelectModule, InputTextModule, IconFieldModule, InputIconModule, ToastModule, TooltipModule,
        FormHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header title="Procedimientos Ambulatorios" code="CONSULTA EXTERNA"
            subtitle="Inyectables, nebulizaciones, curaciones y vacunas del día" responsable="AUX" appReveal />

        <!-- KPIs por tipo -->
        <div class="kpis">
            @for (k of kpis(); track k.tipo; let i = $index) {
                <button class="kpi" [class.is-active]="filtroTipo() === k.tipo" (click)="toggleTipo(k.tipo)" [appReveal]="i">
                    <span class="kpi__icon"><i class="pi" [ngClass]="k.icon"></i></span>
                    <span class="kpi__value tabular">{{ k.count }}</span>
                    <span class="kpi__label">{{ k.label }}</span>
                </button>
            }
            <button class="kpi kpi--pend" [class.is-active]="soloPendientes()" (click)="soloPendientes.set(!soloPendientes())" [appReveal]="4">
                <span class="kpi__icon"><i class="pi pi-clock"></i></span>
                <span class="kpi__value tabular">{{ pendientes() }}</span>
                <span class="kpi__label">Pendientes</span>
            </button>
        </div>

        <!-- Barra de acciones -->
        <div class="toolbar">
            <p-iconfield iconPosition="left" styleClass="flex-1 md:max-w-[26rem]">
                <p-inputicon styleClass="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar por paciente o detalle…" class="w-full" [(ngModel)]="query" />
            </p-iconfield>
            <button pButton type="button" label="Nuevo procedimiento" icon="pi pi-plus" class="p-button-sm" (click)="abrir()"></button>
        </div>

        <div class="doc-sheet bg-surface-0 dark:bg-surface-900 p-2 md:p-3" appReveal>
            <p-table [value]="filtrados()" [paginator]="filtrados().length > 12" [rows]="12"
                [loading]="loading()" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '52rem' }">
                <ng-template #header>
                    <tr>
                        <th style="width:5rem">Hora</th>
                        <th>Paciente</th>
                        <th style="width:12rem">Tipo</th>
                        <th>Detalle</th>
                        <th style="width:9rem">Estado</th>
                        <th style="width:9rem" class="text-center">Acción</th>
                    </tr>
                </ng-template>
                <ng-template #body let-p>
                    <tr>
                        <td class="font-mono text-sm">{{ p.hora || '—' }}</td>
                        <td>
                            <div class="font-semibold">{{ p.pacienteNombre }}</div>
                            @if (p.carnetAsegurado) { <div class="text-xs text-muted-color font-mono">{{ p.carnetAsegurado }}</div> }
                        </td>
                        <td><span class="tipo"><i class="pi" [ngClass]="tipoIcon(p.tipo)"></i> {{ tipoLabel(p.tipo) }}</span></td>
                        <td class="text-sm">{{ p.detalle }}</td>
                        <td>
                            @if (p.estado === 'REALIZADO') {
                                <p-tag value="Realizado" severity="success" icon="pi pi-check" styleClass="text-xs" />
                            } @else { <p-tag value="Pendiente" severity="warn" icon="pi pi-clock" styleClass="text-xs" /> }
                        </td>
                        <td class="text-center">
                            @if (p.estado === 'PENDIENTE') {
                                <button pButton type="button" icon="pi pi-check" label="Realizar" class="p-button-sm"
                                    pTooltip="Marcar como realizado" tooltipPosition="left" (click)="marcarRealizado(p)"></button>
                            } @else { <span class="text-muted-color text-sm"><i class="pi pi-check-circle"></i> {{ p.enfermera || 'Hecho' }}</span> }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="6">
                        <div class="empty-state"><i class="pi pi-inbox"></i>
                            <span class="empty-state__title">Sin procedimientos</span>
                            <span>Usá «Nuevo procedimiento» para registrar uno.</span></div>
                    </td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Dialog -->
        <p-dialog header="Nuevo procedimiento ambulatorio" [(visible)]="dialogVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '36rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex flex-col gap-1">
                    <label class="field-label">Paciente registrado (opcional)</label>
                    <p-select [options]="pacienteOptions()" optionLabel="label" optionValue="id"
                        [(ngModel)]="selPacienteId" (onChange)="onPacienteSel($event.value)"
                        placeholder="Buscar asegurado o dejar en blanco para walk-in" [filter]="true" filterBy="label"
                        [showClear]="true" appendTo="body" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Nombre del paciente</label>
                    <input pInputText [(ngModel)]="nuevo.pacienteNombre" placeholder="Apellidos y nombres" />
                </div>
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Tipo de procedimiento</label>
                        <p-select [options]="tipoOptions" optionLabel="label" optionValue="value"
                            [(ngModel)]="nuevo.tipo" placeholder="Seleccione" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 w-36">
                        <label class="field-label">Hora</label>
                        <input type="time" pInputText [(ngModel)]="nuevo.hora" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Detalle</label>
                    <input pInputText [(ngModel)]="nuevo.detalle" placeholder="Ej.: Ceftriaxona 1g IM · Salbutamol nebulización · Vacuna antigripal" />
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="dialogVisible = false" />
                <p-button label="Registrar" icon="pi pi-check" (onClick)="registrar()"
                    [disabled]="!nuevo.pacienteNombre || !nuevo.tipo || !nuevo.detalle" />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.7rem; margin: 1rem 0; }
        @media (min-width: 768px) { .kpis { grid-template-columns: repeat(5, 1fr); } }
        .kpi { display: flex; align-items: center; gap: 0.55rem; padding: 0.8rem 0.9rem; cursor: pointer; text-align: left;
            border-radius: 0.9rem; background: var(--p-surface-0); border: 1px solid var(--p-surface-200);
            transition: border-color .15s ease, transform .12s ease, box-shadow .2s ease; }
        :host-context(.app-dark) .kpi { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .kpi:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -14px rgba(0,0,0,.4); }
        .kpi.is-active { border-color: var(--p-primary-400); box-shadow: 0 0 0 2px color-mix(in srgb, var(--p-primary-color) 22%, transparent); }
        .kpi__icon { width: 2.1rem; height: 2.1rem; border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; flex: none;
            background: var(--p-primary-50); color: var(--p-primary-600); }
        :host-context(.app-dark) .kpi__icon { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .kpi--pend .kpi__icon { background: #fef3c7; color: #b45309; }
        .kpi__value { font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; line-height: 1; }
        .kpi__label { font-size: 0.72rem; color: var(--p-text-muted-color); font-weight: 600; }
        .toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; }
        .tipo { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 600; color: var(--p-text-color); }
        .tipo .pi { color: var(--p-primary-600); font-size: 0.78rem; }
    `]
})
export class ProcedimientosAmbulatoriosComponent {
    private service = inject(ProcedimientoAmbulatorioService);
    private pacienteService = inject(PacienteService);
    private messageService = inject(MessageService);

    readonly tipoOptions = TIPOS_PROCEDIMIENTO.map((t) => ({ value: t.value, label: t.label }));

    private items = signal<ProcedimientoAmbulatorio[]>([]);
    private pacientes = signal<Paciente[]>([]);
    loading = signal(true);
    query = signal('');
    filtroTipo = signal<TipoProcedimiento | null>(null);
    soloPendientes = signal(false);

    dialogVisible = false;
    selPacienteId: number | null = null;
    nuevo: Partial<ProcedimientoAmbulatorio> = this.vacio();

    pacienteOptions = computed(() =>
        this.pacientes().map((p) => ({ id: p.id, label: `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres} · ${p.carnetAsegurado}` }))
    );

    kpis = computed(() => TIPOS_PROCEDIMIENTO.map((t) => ({
        tipo: t.value, label: t.label, icon: t.icon,
        count: this.items().filter((x) => x.tipo === t.value).length
    })));
    pendientes = computed(() => this.items().filter((x) => x.estado === 'PENDIENTE').length);

    filtrados = computed(() => {
        const q = this.query().trim().toLowerCase();
        const tipo = this.filtroTipo();
        const pend = this.soloPendientes();
        return this.items()
            .filter((x) => !tipo || x.tipo === tipo)
            .filter((x) => !pend || x.estado === 'PENDIENTE')
            .filter((x) => !q || `${x.pacienteNombre} ${x.detalle}`.toLowerCase().includes(q))
            .sort((a, b) => (a.estado === b.estado ? 0 : a.estado === 'PENDIENTE' ? -1 : 1));
    });

    constructor() {
        this.pacienteService.getAll().subscribe((d) => this.pacientes.set(d));
        this.cargar();
    }

    private cargar(): void {
        this.loading.set(true);
        this.service.getTodos().subscribe({
            next: (d) => { this.items.set(Array.isArray(d) ? d : []); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los procedimientos.' }); }
        });
    }

    tipoLabel(t: TipoProcedimiento): string { return TIPOS_PROCEDIMIENTO.find((x) => x.value === t)?.label ?? t; }
    tipoIcon(t: TipoProcedimiento): string { return TIPOS_PROCEDIMIENTO.find((x) => x.value === t)?.icon ?? 'pi-bolt'; }

    toggleTipo(t: TipoProcedimiento): void { this.filtroTipo.set(this.filtroTipo() === t ? null : t); }

    onPacienteSel(id: number | null): void {
        const p = this.pacientes().find((x) => x.id === id);
        if (p) {
            this.nuevo.pacienteId = p.id;
            this.nuevo.pacienteNombre = `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}`;
            this.nuevo.carnetAsegurado = p.carnetAsegurado;
        } else {
            this.nuevo.pacienteId = undefined;
            this.nuevo.carnetAsegurado = undefined;
        }
    }

    abrir(): void { this.selPacienteId = null; this.nuevo = this.vacio(); this.dialogVisible = true; }

    registrar(): void {
        const n = this.nuevo;
        if (!n.pacienteNombre || !n.tipo || !n.detalle) return;
        const payload: ProcedimientoAmbulatorio = {
            pacienteId: n.pacienteId,
            pacienteNombre: n.pacienteNombre!.trim(),
            carnetAsegurado: n.carnetAsegurado,
            tipo: n.tipo as TipoProcedimiento,
            detalle: n.detalle!.trim(),
            fecha: new Date().toISOString().split('T')[0],
            hora: n.hora || undefined,
            estado: 'PENDIENTE'
        };
        this.service.crear(payload).subscribe({
            next: (saved) => { this.items.set([saved, ...this.items()]); this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Procedimiento registrado', detail: `${this.tipoLabel(saved.tipo)} · ${saved.pacienteNombre}` }); },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar.' })
        });
    }

    marcarRealizado(p: ProcedimientoAmbulatorio): void {
        if (!p.id) return;
        const now = new Date();
        const hora = p.hora || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        this.service.actualizar(p.id, { estado: 'REALIZADO', hora }).subscribe({
            next: (saved) => { this.items.set(this.items().map((x) => (x.id === saved.id ? saved : x)));
                this.messageService.add({ severity: 'success', summary: 'Realizado', detail: `${this.tipoLabel(saved.tipo)} · ${saved.pacienteNombre}` }); },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' })
        });
    }

    private vacio(): Partial<ProcedimientoAmbulatorio> {
        return { pacienteNombre: '', tipo: undefined, detalle: '', hora: '' };
    }
}
