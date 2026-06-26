import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteService } from '@/app/core/services/paciente.service';
import { ConsultaExternaService } from '@/app/core/services/consulta-externa.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { ConsultaExterna, EstadoConsulta, ESPECIALIDADES_CE } from '@/app/core/models/consulta-externa.model';

interface EstadoMeta {
    label: string;
    severity: 'warn' | 'info' | 'success' | 'secondary';
    icon: string;
}

@Component({
    selector: 'app-consulta-externa-lista',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, TagModule, ButtonModule, DialogModule,
        SelectModule, InputTextModule, TextareaModule, IconFieldModule, InputIconModule,
        ToastModule, TooltipModule, FormHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header
            title="Consulta Externa — Recepción"
            code="FORM. 002"
            subtitle="Admisión, turnos y toma de constantes vitales basales" appReveal />

        <!-- KPIs por estado -->
        <div class="ce-kpis">
            @for (k of kpis(); track k.estado; let i = $index) {
                <button class="ce-kpi" [class.is-active]="filtroEstado() === k.estado"
                    [class]="'ce-kpi ce-kpi--' + k.meta.severity" (click)="toggleFiltro(k.estado)" [appReveal]="i">
                    <span class="ce-kpi__icon"><i class="pi" [ngClass]="k.meta.icon"></i></span>
                    <span class="ce-kpi__value tabular">{{ k.count }}</span>
                    <span class="ce-kpi__label">{{ k.meta.label }}</span>
                </button>
            }
        </div>

        <!-- Barra de acciones -->
        <div class="ce-toolbar">
            <p-iconfield iconPosition="left" styleClass="flex-1 md:max-w-[26rem]">
                <p-inputicon styleClass="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar por nombre, turno o especialidad…"
                    class="w-full" [(ngModel)]="query" />
            </p-iconfield>
            <div class="flex items-center gap-2">
                @if (filtroEstado()) {
                    <button pButton type="button" label="Quitar filtro" icon="pi pi-filter-slash"
                        class="p-button-text p-button-sm" (click)="filtroEstado.set(null)"></button>
                }
                <button pButton type="button" label="Nueva recepción" icon="pi pi-user-plus"
                    class="p-button-sm" (click)="abrirRecepcion()"></button>
            </div>
        </div>

        <!-- Tabla de turnos -->
        <div class="doc-sheet bg-surface-0 dark:bg-surface-900 p-2 md:p-3" appReveal>
            <p-table [value]="filtradas()" [paginator]="filtradas().length > 12" [rows]="12"
                [loading]="loading()" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '60rem' }">
                <ng-template #header>
                    <tr>
                        <th style="width:7rem">Turno</th>
                        <th>Paciente</th>
                        <th>Especialidad</th>
                        <th style="width:8rem">Prioridad</th>
                        <th style="width:9rem">Constantes</th>
                        <th style="width:11rem">Estado</th>
                        <th style="width:9rem" class="text-center">Acción</th>
                    </tr>
                </ng-template>
                <ng-template #body let-c>
                    <tr>
                        <td><span class="ce-turno">{{ c.numeroTurno }}</span></td>
                        <td>
                            <div class="ce-pac">
                                <span class="ce-avatar" [class.is-pref]="c.prioridad === 'PREFERENCIAL'">{{ initials(c) }}</span>
                                <div class="leading-tight">
                                    <div class="font-semibold">{{ nombre(c) }}</div>
                                    <div class="text-xs text-muted-color font-mono">{{ c.carnetAsegurado }} · {{ c.horaRecepcion || '—' }}</div>
                                </div>
                            </div>
                        </td>
                        <td>{{ c.especialidad }}</td>
                        <td>
                            @if (c.prioridad === 'PREFERENCIAL') {
                                <p-tag value="Preferencial" severity="warn" styleClass="text-xs" />
                            } @else { <span class="text-muted-color text-sm">Normal</span> }
                        </td>
                        <td>
                            @if (tieneConstantes(c)) {
                                <span class="ce-ok"><i class="pi pi-check-circle"></i> Tomadas</span>
                            } @else {
                                <span class="text-muted-color text-sm"><i class="pi pi-minus-circle"></i> Pendiente</span>
                            }
                        </td>
                        <td>
                            <p-tag [value]="estadoMeta(c.estado).label" [severity]="estadoMeta(c.estado).severity"
                                [icon]="'pi ' + estadoMeta(c.estado).icon" styleClass="text-xs" />
                        </td>
                        <td class="text-center">
                            @if (c.estado === 'ATENDIDO') {
                                <button pButton type="button" icon="pi pi-eye" label="Ver"
                                    class="p-button-text p-button-sm" (click)="abrir(c.id)"></button>
                            } @else {
                                <button pButton type="button" icon="pi pi-heart-fill" label="Atender"
                                    class="p-button-sm" pTooltip="Tomar constantes y llenar Form 002" tooltipPosition="left"
                                    (click)="abrir(c.id)"></button>
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="7">
                        <div class="empty-state">
                            <i class="pi pi-inbox"></i>
                            <span class="empty-state__title">Sin turnos en este filtro</span>
                            <span>Usá «Nueva recepción» para registrar un paciente en la cola.</span>
                        </div>
                    </td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Dialog Nueva Recepción -->
        <p-dialog header="Nueva recepción — Consulta Externa" [(visible)]="dialogVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '34rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Paciente</label>
                    <p-select [options]="pacienteOptions()" optionLabel="label" optionValue="id"
                        [(ngModel)]="nueva.pacienteId" placeholder="Seleccione el asegurado" appendTo="body"
                        [filter]="true" filterBy="label" styleClass="w-full" />
                </div>
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Especialidad</label>
                        <p-select [options]="especialidades" [(ngModel)]="nueva.especialidad"
                            placeholder="Especialidad" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 w-44">
                        <label class="field-label">Prioridad</label>
                        <p-select [options]="prioridadOptions" optionLabel="label" optionValue="value"
                            [(ngModel)]="nueva.prioridad" appendTo="body" styleClass="w-full" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label">Motivo de consulta</label>
                    <textarea pTextarea [(ngModel)]="nueva.motivoConsulta" rows="3"
                        placeholder="Motivo referido por el paciente…"></textarea>
                    <span class="field-hint">Se asignará el siguiente número de turno automáticamente.</span>
                </div>
            </div>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button label="Registrar turno" icon="pi pi-check" (onClick)="registrar()"
                        [disabled]="!nueva.pacienteId || !nueva.especialidad" />
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .ce-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 1rem 0; }
        @media (min-width: 768px) { .ce-kpis { grid-template-columns: repeat(4, 1fr); } }
        .ce-kpi {
            display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; cursor: pointer; text-align: left;
            border-radius: 0.9rem; background: var(--p-surface-0); border: 1px solid var(--p-surface-200);
            transition: border-color .15s ease, transform .12s ease, box-shadow .2s ease;
        }
        :host-context(.app-dark) .ce-kpi { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .ce-kpi:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -14px rgba(0,0,0,.4); }
        .ce-kpi.is-active { border-color: var(--p-primary-400); box-shadow: 0 0 0 2px color-mix(in srgb, var(--p-primary-color) 22%, transparent); }
        .ce-kpi__icon { width: 2.2rem; height: 2.2rem; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; flex: none; }
        .ce-kpi--warn .ce-kpi__icon { background: #fef3c7; color: #b45309; }
        .ce-kpi--info .ce-kpi__icon { background: #e0f2fe; color: #0369a1; }
        .ce-kpi--success .ce-kpi__icon { background: var(--p-primary-50); color: var(--p-primary-700); }
        .ce-kpi--secondary .ce-kpi__icon { background: var(--p-surface-100); color: var(--p-text-muted-color); }
        :host-context(.app-dark) .ce-kpi--secondary .ce-kpi__icon { background: var(--p-surface-800); }
        .ce-kpi__value { font-family: var(--font-display); font-weight: 700; font-size: 1.35rem; line-height: 1; }
        .ce-kpi__label { font-size: 0.74rem; color: var(--p-text-muted-color); font-weight: 600; }

        .ce-toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; }
        .ce-turno { font-family: var(--font-mono); font-weight: 600; font-size: 0.78rem; color: var(--p-primary-700);
            background: var(--p-primary-50); padding: 0.2rem 0.5rem; border-radius: 0.45rem; white-space: nowrap; }
        :host-context(.app-dark) .ce-turno { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .ce-pac { display: flex; align-items: center; gap: 0.6rem; }
        .ce-avatar { flex: none; width: 2.2rem; height: 2.2rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 0.75rem; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .ce-avatar.is-pref { background: linear-gradient(135deg, #f59e0b, #b45309); }
        .ce-ok { color: var(--p-primary-700); font-weight: 600; font-size: 0.82rem; }
        :host-context(.app-dark) .ce-ok { color: var(--p-primary-300); }
    `]
})
export class ConsultaExternaListaComponent {
    private service = inject(ConsultaExternaService);
    private pacienteService = inject(PacienteService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    readonly especialidades = ESPECIALIDADES_CE;
    readonly prioridadOptions = [
        { label: 'Normal', value: 'NORMAL' },
        { label: 'Preferencial', value: 'PREFERENCIAL' }
    ];

    private consultas = signal<ConsultaExterna[]>([]);
    private pacientes = signal<Paciente[]>([]);
    loading = signal(true);
    query = signal('');
    filtroEstado = signal<EstadoConsulta | null>(null);

    dialogVisible = false;
    nueva: Partial<ConsultaExterna> = this.recepcionVacia();

    private readonly estadosMeta: Record<EstadoConsulta, EstadoMeta> = {
        EN_ESPERA: { label: 'En espera', severity: 'warn', icon: 'pi-clock' },
        EN_PREPARACION: { label: 'En preparación', severity: 'info', icon: 'pi-spinner' },
        LISTO_MEDICO: { label: 'Listo p/ médico', severity: 'success', icon: 'pi-check' },
        ATENDIDO: { label: 'Atendido', severity: 'secondary', icon: 'pi-flag' }
    };

    pacienteOptions = computed(() =>
        this.pacientes().map((p) => ({ id: p.id, label: `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres} · ${p.carnetAsegurado}` }))
    );

    kpis = computed(() => {
        const all = this.consultas();
        return (['EN_ESPERA', 'EN_PREPARACION', 'LISTO_MEDICO', 'ATENDIDO'] as EstadoConsulta[]).map((estado) => ({
            estado,
            meta: this.estadosMeta[estado],
            count: all.filter((c) => c.estado === estado).length
        }));
    });

    filtradas = computed(() => {
        const q = this.query().trim().toLowerCase();
        const estado = this.filtroEstado();
        return this.consultas()
            .filter((c) => !estado || c.estado === estado)
            .filter((c) => !q || `${this.nombre(c)} ${c.numeroTurno} ${c.especialidad} ${c.carnetAsegurado}`.toLowerCase().includes(q));
    });

    constructor() {
        this.pacienteService.getAll().subscribe((d) => this.pacientes.set(d));
        this.cargar();
    }

    private cargar(): void {
        this.loading.set(true);
        this.service.getTodas().subscribe({
            next: (d) => { this.consultas.set(this.ordenar(Array.isArray(d) ? d : [])); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la cola de consulta externa.' }); }
        });
    }

    private ordenar(list: ConsultaExterna[]): ConsultaExterna[] {
        const orden: Record<EstadoConsulta, number> = { EN_ESPERA: 0, EN_PREPARACION: 1, LISTO_MEDICO: 2, ATENDIDO: 3 };
        return [...list].sort((a, b) =>
            (orden[a.estado] - orden[b.estado]) || a.numeroTurno.localeCompare(b.numeroTurno));
    }

    estadoMeta(e: EstadoConsulta): EstadoMeta { return this.estadosMeta[e]; }
    nombre(c: ConsultaExterna): string {
        const p = this.pacientes().find((x) => x.id === c.pacienteId);
        return p ? `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}` : `Paciente #${c.pacienteId}`;
    }
    initials(c: ConsultaExterna): string {
        const p = this.pacientes().find((x) => x.id === c.pacienteId);
        return `${p?.apellidoPaterno?.[0] ?? ''}${p?.nombres?.[0] ?? ''}`.toUpperCase() || 'P';
    }
    tieneConstantes(c: ConsultaExterna): boolean {
        const k = c.constantes;
        return !!(k && (k.paSistolica || k.fc || k.temperatura || k.saturacion));
    }

    toggleFiltro(estado: EstadoConsulta): void {
        this.filtroEstado.set(this.filtroEstado() === estado ? null : estado);
    }

    abrir(id?: number): void {
        if (id != null) this.router.navigate(['/app/enfermeria/consulta-externa', id]);
    }

    abrirRecepcion(): void {
        this.nueva = this.recepcionVacia();
        this.dialogVisible = true;
    }

    registrar(): void {
        if (!this.nueva.pacienteId || !this.nueva.especialidad) return;
        const p = this.pacientes().find((x) => x.id === this.nueva.pacienteId);
        const now = new Date();
        const payload: ConsultaExterna = {
            pacienteId: this.nueva.pacienteId!,
            carnetAsegurado: p?.carnetAsegurado ?? '',
            carnetBeneficiario: p?.carnetBeneficiario,
            fecha: now.toISOString().split('T')[0],
            numeroTurno: '',
            especialidad: this.nueva.especialidad!,
            motivoConsulta: this.nueva.motivoConsulta?.trim() || undefined,
            estado: 'EN_ESPERA',
            prioridad: (this.nueva.prioridad as ConsultaExterna['prioridad']) ?? 'NORMAL',
            horaRecepcion: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        };
        this.service.crear(payload).subscribe({
            next: (saved) => {
                this.consultas.set(this.ordenar([...this.consultas(), saved]));
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Turno registrado', detail: `${saved.numeroTurno} · ${saved.especialidad}` });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el turno.' })
        });
    }

    private recepcionVacia(): Partial<ConsultaExterna> {
        return { pacienteId: undefined, especialidad: undefined, prioridad: 'NORMAL', motivoConsulta: '' };
    }
}
