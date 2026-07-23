import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { InterconsultaService } from '@/app/core/services/interconsulta.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { Interconsulta, EstadoInterconsulta } from '@/app/core/models/interconsulta.model';
import { ESPECIALIDADES_CE } from '@/app/core/models/consulta-externa.model';
import { PISOS } from '@/app/core/models/piso.model';

interface EstadoMeta { label: string; severity: 'warn' | 'info' | 'success' | 'secondary' | 'danger'; icon: string; }

@Component({
    selector: 'app-interconsultas',
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
            title="Interconsultas por Especialidad"
            code="INTERCONSULTA"
            subtitle="Solicitar, programar y seguir valoraciones de otras especialidades"
            responsable="LIC" appReveal />

        <!-- KPIs por estado -->
        <div class="kpis">
            @for (k of kpis(); track k.estado; let i = $index) {
                <button class="kpi" [class.is-active]="filtroEstado() === k.estado"
                    [class]="'kpi kpi--' + k.meta.severity" (click)="toggleEstado(k.estado)" [appReveal]="i">
                    <span class="kpi__icon"><i class="pi" [ngClass]="k.meta.icon"></i></span>
                    <span class="kpi__value tabular">{{ k.count }}</span>
                    <span class="kpi__label">{{ k.meta.label }}</span>
                </button>
            }
        </div>

        <!-- Barra de acciones -->
        <div class="toolbar">
            <p-iconfield iconPosition="left" styleClass="flex-1 md:max-w-[26rem]">
                <p-inputicon styleClass="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar por paciente, servicio o especialidad…"
                    class="w-full" [(ngModel)]="query" />
            </p-iconfield>
            <div class="flex items-center gap-2">
                <p-select [options]="especialidadesFiltro()" [(ngModel)]="filtroEspecialidad"
                    placeholder="Todas las especialidades" [showClear]="true" appendTo="body" styleClass="w-full md:w-56" />
                <button pButton type="button" label="Nueva interconsulta" icon="pi pi-plus"
                    class="p-button-sm" (click)="abrirNueva()"></button>
            </div>
        </div>

        <!-- Tabla -->
        <div class="doc-sheet bg-surface-0 dark:bg-surface-900 p-2 md:p-3" appReveal>
            <p-table [value]="filtradas()" [paginator]="filtradas().length > 12" [rows]="12"
                [loading]="loading()" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '62rem' }">
                <ng-template #header>
                    <tr>
                        <th>Paciente</th>
                        <th style="width:11rem">Origen → Destino</th>
                        <th style="width:8rem">Prioridad</th>
                        <th style="width:9rem">Fecha</th>
                        <th style="width:11rem">Estado</th>
                        <th style="width:14rem" class="text-center">Acción</th>
                    </tr>
                </ng-template>
                <ng-template #body let-c>
                    <tr>
                        <td>
                            <div class="pac">
                                <span class="avatar" [class.is-urg]="c.prioridad === 'URGENTE'">{{ initials(c) }}</span>
                                <div class="leading-tight">
                                    <div class="font-semibold">{{ nombre(c) }}</div>
                                    <div class="text-xs text-muted-color">{{ c.motivo }}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="ruta">
                                <span class="serv">{{ c.servicioOrigen }}</span>
                                <i class="pi pi-arrow-right"></i>
                                <span class="serv serv--dest">{{ c.especialidadDestino }}</span>
                            </div>
                        </td>
                        <td>
                            @if (c.prioridad === 'URGENTE') {
                                <p-tag value="Urgente" severity="danger" icon="pi pi-exclamation-triangle" styleClass="text-xs" />
                            } @else { <span class="text-muted-color text-sm">Rutina</span> }
                        </td>
                        <td>
                            <div class="text-sm">{{ c.fechaSolicitud }}</div>
                            @if (c.fechaProgramada) { <div class="text-xs text-muted-color">Prog: {{ c.fechaProgramada }}</div> }
                        </td>
                        <td>
                            <p-tag [value]="meta(c.estado).label" [severity]="meta(c.estado).severity"
                                [icon]="'pi ' + meta(c.estado).icon" styleClass="text-xs" />
                        </td>
                        <td class="text-center">
                            @switch (c.estado) {
                                @case ('SOLICITADA') {
                                    <button pButton type="button" icon="pi pi-calendar-plus" label="Programar"
                                        class="p-button-sm" (click)="programar(c)"></button>
                                    <button pButton type="button" icon="pi pi-times" class="p-button-text p-button-sm" severity="secondary"
                                        pTooltip="Anular" tooltipPosition="left" (click)="anular(c)"></button>
                                }
                                @case ('PROGRAMADA') {
                                    <button pButton type="button" icon="pi pi-check" label="Respuesta"
                                        class="p-button-sm" (click)="abrirRespuesta(c)"></button>
                                    <button pButton type="button" icon="pi pi-times" class="p-button-text p-button-sm" severity="secondary"
                                        pTooltip="Anular" tooltipPosition="left" (click)="anular(c)"></button>
                                }
                                @case ('REALIZADA') {
                                    <button pButton type="button" icon="pi pi-eye" label="Ver"
                                        class="p-button-text p-button-sm" (click)="abrirRespuesta(c)"></button>
                                }
                                @default {
                                    <span class="text-muted-color text-sm">—</span>
                                }
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="6">
                        <div class="empty-state">
                            <i class="pi pi-send"></i>
                            <span class="empty-state__title">Sin interconsultas en este filtro</span>
                            <span>Usá «Nueva interconsulta» para solicitar la valoración de otra especialidad.</span>
                        </div>
                    </td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Dialog nueva interconsulta -->
        <p-dialog header="Nueva interconsulta" [(visible)]="dialogVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '36rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Paciente</label>
                    <p-select [options]="pacienteOptions()" optionLabel="label" optionValue="id"
                        [(ngModel)]="nueva.pacienteId" placeholder="Seleccione al paciente internado" appendTo="body"
                        [filter]="true" filterBy="label" styleClass="w-full" />
                </div>
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Servicio de origen</label>
                        <p-select [options]="servicios" [(ngModel)]="nueva.servicioOrigen"
                            placeholder="Dónde está internado" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Especialidad destino</label>
                        <p-select [options]="especialidades" [(ngModel)]="nueva.especialidadDestino"
                            placeholder="A quién se solicita" appendTo="body" [filter]="true" styleClass="w-full" />
                    </div>
                </div>
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 w-40">
                        <label class="field-label">Prioridad</label>
                        <p-select [options]="prioridadOptions" optionLabel="label" optionValue="value"
                            [(ngModel)]="nueva.prioridad" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label">Cama</label>
                        <input pInputText [(ngModel)]="nueva.cama" placeholder="Ej.: C-201" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Motivo de la interconsulta</label>
                    <textarea pTextarea [(ngModel)]="nueva.motivo" rows="3"
                        placeholder="Motivo por el que se pide la valoración…"></textarea>
                </div>
            </div>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button label="Solicitar" icon="pi pi-check" (onClick)="registrar()"
                        [disabled]="!nueva.pacienteId || !nueva.servicioOrigen || !nueva.especialidadDestino || !nueva.motivo" />
                </div>
            </ng-template>
        </p-dialog>

        <!-- Dialog respuesta / ver -->
        <p-dialog [header]="respSel()?.estado === 'REALIZADA' ? 'Interconsulta realizada' : 'Registrar respuesta del especialista'"
            [(visible)]="respVisible" [modal]="true" [draggable]="false" [dismissableMask]="true"
            [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'" [style]="{ width: '34rem' }">
            @if (respSel(); as c) {
                <div class="flex flex-col gap-3 pt-1">
                    <div class="resumen">
                        <div><span class="resumen__k">Paciente</span> {{ nombre(c) }}</div>
                        <div><span class="resumen__k">Solicitud</span> {{ c.servicioOrigen }} → {{ c.especialidadDestino }}</div>
                        <div><span class="resumen__k">Motivo</span> {{ c.motivo }}</div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="field-label" [class.req]="c.estado !== 'REALIZADA'">Hallazgo / recomendación</label>
                        <textarea pTextarea [(ngModel)]="respuestaTexto" rows="4"
                            [readonly]="c.estado === 'REALIZADA'"
                            placeholder="Respuesta del especialista…"></textarea>
                    </div>
                </div>
            }
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button [label]="respSel()?.estado === 'REALIZADA' ? 'Cerrar' : 'Cancelar'" icon="pi pi-times"
                        severity="secondary" (onClick)="respVisible = false" />
                    @if (respSel()?.estado !== 'REALIZADA') {
                        <p-button label="Marcar realizada" icon="pi pi-check" (onClick)="guardarRespuesta()"
                            [disabled]="!respuestaTexto.trim()" />
                    }
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 1rem 0; }
        @media (min-width: 768px) { .kpis { grid-template-columns: repeat(4, 1fr); } }
        .kpi { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; cursor: pointer; text-align: left;
            border-radius: 0.9rem; background: var(--p-surface-0); border: 1px solid var(--p-surface-200);
            transition: border-color .15s ease, transform .12s ease, box-shadow .2s ease; }
        :host-context(.app-dark) .kpi { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .kpi:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -14px rgba(0,0,0,.4); }
        .kpi.is-active { border-color: var(--p-primary-400); box-shadow: 0 0 0 2px color-mix(in srgb, var(--p-primary-color) 22%, transparent); }
        .kpi__icon { width: 2.2rem; height: 2.2rem; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; flex: none; }
        .kpi--warn .kpi__icon { background: #fef3c7; color: #b45309; }
        .kpi--info .kpi__icon { background: #e0f2fe; color: #0369a1; }
        .kpi--success .kpi__icon { background: var(--p-primary-50); color: var(--p-primary-700); }
        .kpi--secondary .kpi__icon { background: var(--p-surface-100); color: var(--p-text-muted-color); }
        :host-context(.app-dark) .kpi--secondary .kpi__icon { background: var(--p-surface-800); }
        .kpi__value { font-family: var(--font-display); font-weight: 700; font-size: 1.35rem; line-height: 1; }
        .kpi__label { font-size: 0.74rem; color: var(--p-text-muted-color); font-weight: 600; }

        .toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; }

        .pac { display: flex; align-items: center; gap: 0.6rem; }
        .avatar { flex: none; width: 2.2rem; height: 2.2rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 0.75rem; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .avatar.is-urg { background: linear-gradient(135deg, #f43f5e, #be123c); }
        .ruta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
        .ruta .pi { font-size: 0.7rem; color: var(--p-text-muted-color); }
        .serv { font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 0.4rem; background: var(--p-surface-100); color: var(--p-text-color); white-space: nowrap; }
        .serv--dest { background: var(--p-primary-50); color: var(--p-primary-700); }
        :host-context(.app-dark) .serv { background: var(--p-surface-800); }
        :host-context(.app-dark) .serv--dest { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }

        .resumen { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.8rem 1rem; border-radius: 0.7rem;
            background: var(--p-surface-50); border: 1px solid var(--p-surface-200); font-size: 0.86rem; }
        :host-context(.app-dark) .resumen { background: var(--p-surface-800); border-color: var(--p-surface-700); }
        .resumen__k { display: inline-block; width: 5rem; font-family: var(--font-mono); font-size: 0.66rem; text-transform: uppercase;
            letter-spacing: 0.08em; color: var(--p-text-muted-color); }
    `]
})
export class InterconsultasComponent {
    private service = inject(InterconsultaService);
    private pacienteService = inject(PacienteService);
    private messageService = inject(MessageService);

    readonly especialidades = ESPECIALIDADES_CE;
    readonly servicios = PISOS.map((p) => p.nombre.toUpperCase());
    readonly prioridadOptions = [
        { label: 'Rutina', value: 'RUTINA' },
        { label: 'Urgente', value: 'URGENTE' }
    ];

    private items = signal<Interconsulta[]>([]);
    private pacientes = signal<Paciente[]>([]);
    loading = signal(true);
    query = signal('');
    filtroEstado = signal<EstadoInterconsulta | null>(null);
    filtroEspecialidad = signal<string | null>(null);

    dialogVisible = false;
    nueva: Partial<Interconsulta> = this.vacia();

    respVisible = false;
    respSel = signal<Interconsulta | null>(null);
    respuestaTexto = '';

    private readonly estadosMeta: Record<EstadoInterconsulta, EstadoMeta> = {
        SOLICITADA: { label: 'Solicitada', severity: 'warn', icon: 'pi-clock' },
        PROGRAMADA: { label: 'Programada', severity: 'info', icon: 'pi-calendar' },
        REALIZADA: { label: 'Realizada', severity: 'success', icon: 'pi-check' },
        ANULADA: { label: 'Anulada', severity: 'secondary', icon: 'pi-ban' }
    };

    pacienteOptions = computed(() =>
        this.pacientes().map((p) => ({ id: p.id, label: `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres} · ${p.carnetAsegurado}` }))
    );

    especialidadesFiltro = computed(() => [...new Set(this.items().map((i) => i.especialidadDestino))].sort());

    kpis = computed(() => {
        const all = this.items();
        return (['SOLICITADA', 'PROGRAMADA', 'REALIZADA', 'ANULADA'] as EstadoInterconsulta[]).map((estado) => ({
            estado, meta: this.estadosMeta[estado], count: all.filter((c) => c.estado === estado).length
        }));
    });

    filtradas = computed(() => {
        const q = this.query().trim().toLowerCase();
        const estado = this.filtroEstado();
        const esp = this.filtroEspecialidad();
        return this.items()
            .filter((c) => !estado || c.estado === estado)
            .filter((c) => !esp || c.especialidadDestino === esp)
            .filter((c) => !q || `${this.nombre(c)} ${c.servicioOrigen} ${c.especialidadDestino} ${c.motivo}`.toLowerCase().includes(q));
    });

    constructor() {
        this.pacienteService.getAll().subscribe((d) => this.pacientes.set(d));
        this.cargar();
    }

    private cargar(): void {
        this.loading.set(true);
        this.service.getTodas().subscribe({
            next: (d) => { this.items.set(this.ordenar(Array.isArray(d) ? d : [])); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las interconsultas.' }); }
        });
    }

    private ordenar(list: Interconsulta[]): Interconsulta[] {
        const orden: Record<EstadoInterconsulta, number> = { SOLICITADA: 0, PROGRAMADA: 1, REALIZADA: 2, ANULADA: 3 };
        return [...list].sort((a, b) =>
            (orden[a.estado] - orden[b.estado]) ||
            (a.prioridad === b.prioridad ? 0 : a.prioridad === 'URGENTE' ? -1 : 1));
    }

    meta(e: EstadoInterconsulta): EstadoMeta { return this.estadosMeta[e]; }
    nombre(c: Interconsulta): string {
        const p = this.pacientes().find((x) => x.id === c.pacienteId);
        return p ? `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}` : `Paciente #${c.pacienteId}`;
    }
    initials(c: Interconsulta): string {
        const p = this.pacientes().find((x) => x.id === c.pacienteId);
        return `${p?.apellidoPaterno?.[0] ?? ''}${p?.nombres?.[0] ?? ''}`.toUpperCase() || 'P';
    }

    toggleEstado(e: EstadoInterconsulta): void { this.filtroEstado.set(this.filtroEstado() === e ? null : e); }

    abrirNueva(): void { this.nueva = this.vacia(); this.dialogVisible = true; }

    registrar(): void {
        const n = this.nueva;
        if (!n.pacienteId || !n.servicioOrigen || !n.especialidadDestino || !n.motivo) return;
        const p = this.pacientes().find((x) => x.id === n.pacienteId);
        const now = new Date();
        const payload: Interconsulta = {
            pacienteId: n.pacienteId!,
            carnetAsegurado: p?.carnetAsegurado ?? '',
            servicioOrigen: n.servicioOrigen!,
            especialidadDestino: n.especialidadDestino!,
            cama: n.cama?.trim() || undefined,
            motivo: n.motivo!.trim(),
            prioridad: (n.prioridad as Interconsulta['prioridad']) ?? 'RUTINA',
            estado: 'SOLICITADA',
            fechaSolicitud: now.toISOString().split('T')[0],
            horaSolicitud: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        };
        this.service.crear(payload).subscribe({
            next: (saved) => {
                this.items.set(this.ordenar([...this.items(), saved]));
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Interconsulta solicitada', detail: `${saved.servicioOrigen} → ${saved.especialidadDestino}` });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la interconsulta.' })
        });
    }

    programar(c: Interconsulta): void {
        this.patch(c, { estado: 'PROGRAMADA', fechaProgramada: new Date().toISOString().split('T')[0] },
            'Interconsulta programada', 'info');
    }

    anular(c: Interconsulta): void {
        this.patch(c, { estado: 'ANULADA' }, 'Interconsulta anulada', 'secondary');
    }

    abrirRespuesta(c: Interconsulta): void {
        this.respSel.set(c);
        this.respuestaTexto = c.respuesta ?? '';
        this.respVisible = true;
    }

    guardarRespuesta(): void {
        const c = this.respSel();
        if (!c || !this.respuestaTexto.trim()) return;
        this.patch(c, { estado: 'REALIZADA', respuesta: this.respuestaTexto.trim() },
            'Interconsulta realizada', 'success', () => (this.respVisible = false));
    }

    private patch(c: Interconsulta, cambios: Partial<Interconsulta>, msg: string, severity: 'info' | 'success' | 'secondary', done?: () => void): void {
        if (!c.id) return;
        this.service.actualizar(c.id, cambios).subscribe({
            next: (saved) => {
                this.items.set(this.ordenar(this.items().map((x) => (x.id === saved.id ? saved : x))));
                this.messageService.add({ severity, summary: msg, detail: `${this.nombre(saved)} · ${saved.especialidadDestino}` });
                done?.();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la interconsulta.' })
        });
    }

    private vacia(): Partial<Interconsulta> {
        return { pacienteId: undefined, servicioOrigen: undefined, especialidadDestino: undefined, prioridad: 'RUTINA', motivo: '', cama: '' };
    }
}
