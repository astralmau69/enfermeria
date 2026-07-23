import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { PacienteHeaderComponent } from '@/app/shared/components/paciente-header/paciente-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteService } from '@/app/core/services/paciente.service';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CuidadosEnfermeriaService } from '@/app/core/services/cuidados-enfermeria.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { ControlGlucemia, Glucometria, MomentoGlucemia, TipoInsulina } from '@/app/core/models/cuidados-enfermeria.model';

@Component({
    selector: 'app-glucometria',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, SelectModule,
        InputTextModule, InputNumberModule, TextareaModule, ToastModule,
        FormHeaderComponent, PacienteHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header title="Glucometría" code="GLUCEMIA"
            subtitle="Control glucémico capilar y esquema de insulina" responsable="AUX" appReveal />

        @if (paciente(); as p) {
            <app-paciente-header [paciente]="p" [cama]="doc()?.cama || ''" servicio="Hospitalización" />
        }

        @if (!pacienteId()) {
            <div class="empty-state"><i class="pi pi-user"></i><span class="empty-state__title">Sin paciente seleccionado</span>
                <span>Abrí esta hoja desde el censo o el mapa de camas.</span></div>
        } @else {
            <!-- Resumen -->
            <div class="sum">
                <div class="sum__box"><span class="sum__k">Último control</span>
                    <b class="tabular" [attr.data-lvl]="ultimo() ? nivel(ultimo()!.valor).key : ''">{{ ultimo()?.valor ?? '—' }} <small>mg/dL</small></b>
                    <span class="sum__sub">{{ ultimo() ? ultimo()!.fecha + ' ' + ultimo()!.hora : 'Sin registros' }}</span></div>
                <div class="sum__box"><span class="sum__k">Promedio</span><b class="tabular">{{ promedio() ?? '—' }} <small>mg/dL</small></b>
                    <span class="sum__sub">{{ mediciones().length }} control(es)</span></div>
                <div class="sum__box"><span class="sum__k">Fuera de rango</span><b class="tabular">{{ fueraRango() }}</b>
                    <span class="sum__sub">&lt;70 o &gt;180 mg/dL</span></div>
            </div>

            <div class="action-bar">
                <p-button label="Agregar control" icon="pi pi-plus" (onClick)="abrir()" />
            </div>

            <div class="doc-sheet bg-surface-0 dark:bg-surface-900 p-2 md:p-3" appReveal>
                <p-table [value]="mediciones()" [loading]="loading()" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '50rem' }">
                    <ng-template #header>
                        <tr>
                            <th style="width:8rem">Fecha</th>
                            <th style="width:5rem">Hora</th>
                            <th style="width:8rem" class="text-right">Glucemia</th>
                            <th>Momento</th>
                            <th>Insulina</th>
                            <th>Observación</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-m>
                        <tr>
                            <td class="font-mono text-sm">{{ m.fecha }}</td>
                            <td class="font-mono text-sm">{{ m.hora }}</td>
                            <td class="text-right"><span class="glu" [attr.data-lvl]="nivel(m.valor).key">{{ m.valor }}</span></td>
                            <td class="text-sm">{{ momentoLabel(m.momento) }}</td>
                            <td class="text-sm">
                                @if (m.insulinaTipo && m.insulinaTipo !== 'NINGUNA') {
                                    {{ insulinaLabel(m.insulinaTipo) }}<span class="text-muted-color"> · {{ m.insulinaUI || 0 }} UI</span>
                                } @else { <span class="text-muted-color">—</span> }
                            </td>
                            <td class="text-sm text-muted-color">{{ m.observacion || '—' }}</td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr><td colspan="6">
                            <div class="empty-state"><i class="pi pi-percentage"></i>
                                <span class="empty-state__title">Sin controles de glucemia</span>
                                <span>Registrá el primer control glucémico capilar.</span></div>
                        </td></tr>
                    </ng-template>
                </p-table>
            </div>
        }

        <!-- Dialog -->
        <p-dialog header="Nuevo control de glucemia" [(visible)]="dialogVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '36rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Fecha</label>
                        <input type="date" pInputText [(ngModel)]="nuevo.fecha" />
                    </div>
                    <div class="flex flex-col gap-1 w-32">
                        <label class="field-label req">Hora</label>
                        <input type="time" pInputText [(ngModel)]="nuevo.hora" />
                    </div>
                    <div class="flex flex-col gap-1 w-40">
                        <label class="field-label req">Glucemia (mg/dL)</label>
                        <p-inputnumber [(ngModel)]="nuevo.valor" [min]="20" [max]="800" [useGrouping]="false" styleClass="w-full" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Momento</label>
                    <p-select [options]="momentoOptions" optionLabel="label" optionValue="value"
                        [(ngModel)]="nuevo.momento" appendTo="body" styleClass="w-full" />
                </div>
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label">Insulina</label>
                        <p-select [options]="insulinaOptions" optionLabel="label" optionValue="value"
                            [(ngModel)]="nuevo.insulinaTipo" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 w-36">
                        <label class="field-label">Unidades (UI)</label>
                        <p-inputnumber [(ngModel)]="nuevo.insulinaUI" [min]="0" [max]="100" [useGrouping]="false"
                            [disabled]="!nuevo.insulinaTipo || nuevo.insulinaTipo === 'NINGUNA'" styleClass="w-full" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label">Observación</label>
                    <textarea pTextarea [(ngModel)]="nuevo.observacion" rows="2" placeholder="Síntomas, corrección, etc."></textarea>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="dialogVisible = false" />
                <p-button label="Guardar control" icon="pi pi-check" (onClick)="agregar()" [loading]="guardando()"
                    [disabled]="!nuevo.fecha || !nuevo.valor || !nuevo.momento" />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .sum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 0.5rem 0 1rem; }
        .sum__box { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.85rem 1rem; border-radius: 0.9rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .sum__box { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .sum__k { font-family: var(--font-mono); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--p-text-muted-color); }
        .sum__box b { font-family: var(--font-display); font-size: 1.4rem; color: var(--p-text-color); }
        .sum__box b small { font-size: 0.7rem; color: var(--p-text-muted-color); font-weight: 600; }
        .sum__box b[data-lvl="baja"], .sum__box b[data-lvl="muy-alta"] { color: #be123c; }
        .sum__box b[data-lvl="alta"] { color: #b45309; }
        .sum__box b[data-lvl="normal"] { color: #15803d; }
        .sum__sub { font-size: 0.72rem; color: var(--p-text-muted-color); }
        .action-bar { display: flex; justify-content: flex-end; margin-bottom: 0.85rem; }
        .glu { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; padding: 0.1rem 0.55rem; border-radius: 0.5rem;
            background: var(--p-surface-100); color: var(--p-text-color); }
        .glu[data-lvl="baja"] { background: #ffe4e6; color: #be123c; }
        .glu[data-lvl="normal"] { background: #dcfce7; color: #15803d; }
        .glu[data-lvl="alta"] { background: #fef3c7; color: #b45309; }
        .glu[data-lvl="muy-alta"] { background: #fecaca; color: #b91c1c; }
    `]
})
export class GlucometriaComponent {
    private route = inject(ActivatedRoute);
    private pacienteService = inject(PacienteService);
    private activo = inject(PacienteActivoService);
    private service = inject(CuidadosEnfermeriaService);
    private messageService = inject(MessageService);

    private routeId = toSignal(this.route.paramMap.pipe(map((pm) => (pm.get('pacienteId') ? +pm.get('pacienteId')! : null))), { initialValue: null });
    private loadedId: number | null = null;

    pacienteId = signal<number | null>(null);
    paciente = signal<Paciente | null>(null);
    doc = signal<ControlGlucemia | null>(null);
    loading = signal(true);
    guardando = signal(false);

    dialogVisible = false;
    nuevo: Partial<Glucometria> = this.vacio();

    readonly momentoOptions: { value: MomentoGlucemia; label: string }[] = [
        { value: 'AYUNAS', label: 'En ayunas' },
        { value: 'PRE_DESAYUNO', label: 'Pre-desayuno' },
        { value: 'POST_DESAYUNO', label: 'Post-desayuno' },
        { value: 'PRE_ALMUERZO', label: 'Pre-almuerzo' },
        { value: 'POST_ALMUERZO', label: 'Post-almuerzo' },
        { value: 'PRE_CENA', label: 'Pre-cena' },
        { value: 'NOCHE', label: 'Noche' },
        { value: 'OTRO', label: 'Otro' }
    ];
    readonly insulinaOptions: { value: TipoInsulina; label: string }[] = [
        { value: 'NINGUNA', label: 'Ninguna' },
        { value: 'CRISTALINA', label: 'Cristalina (rápida)' },
        { value: 'NPH', label: 'NPH (intermedia)' },
        { value: 'GLARGINA', label: 'Glargina (lenta)' }
    ];

    mediciones = computed(() => [...(this.doc()?.mediciones ?? [])].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)));
    ultimo = computed<Glucometria | null>(() => this.mediciones()[0] ?? null);
    promedio = computed(() => {
        const m = this.mediciones();
        return m.length ? Math.round(m.reduce((s, x) => s + x.valor, 0) / m.length) : null;
    });
    fueraRango = computed(() => this.mediciones().filter((m) => m.valor < 70 || m.valor > 180).length);

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.pacienteService.getById(id).subscribe((p) => this.paciente.set(p));
            this.cargar(id);
        });
    }

    private cargar(id: number): void {
        this.loading.set(true);
        this.service.getGlucemia(id).subscribe({
            next: (d) => { this.doc.set(d); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el control glucémico.' }); }
        });
    }

    momentoLabel(m: MomentoGlucemia): string { return this.momentoOptions.find((o) => o.value === m)?.label ?? m; }
    insulinaLabel(t: TipoInsulina): string { return this.insulinaOptions.find((o) => o.value === t)?.label ?? t; }
    nivel(v: number): { key: string } {
        if (v < 70) return { key: 'baja' };
        if (v <= 180) return { key: 'normal' };
        if (v <= 250) return { key: 'alta' };
        return { key: 'muy-alta' };
    }

    abrir(): void { this.nuevo = this.vacio(); this.dialogVisible = true; }

    agregar(): void {
        const doc = this.doc();
        if (!doc || !this.nuevo.fecha || !this.nuevo.valor || !this.nuevo.momento) return;
        const entrada: Glucometria = {
            fecha: this.nuevo.fecha!, hora: this.nuevo.hora || '', valor: this.nuevo.valor!,
            momento: this.nuevo.momento as MomentoGlucemia,
            insulinaTipo: (this.nuevo.insulinaTipo as TipoInsulina) || 'NINGUNA',
            insulinaUI: this.nuevo.insulinaUI || undefined,
            observacion: this.nuevo.observacion?.trim() || undefined
        };
        const updated: ControlGlucemia = { ...doc, mediciones: [...doc.mediciones, entrada] };
        this.guardando.set(true);
        this.service.saveGlucemia(updated).subscribe({
            next: (saved) => { this.doc.set(saved); this.guardando.set(false); this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Control registrado', detail: `${entrada.valor} mg/dL · ${this.momentoLabel(entrada.momento)}` }); },
            error: () => { this.guardando.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el control.' }); }
        });
    }

    private vacio(): Partial<Glucometria> {
        const now = new Date();
        return { fecha: now.toISOString().split('T')[0], hora: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, momento: 'AYUNAS', insulinaTipo: 'NINGUNA' };
    }
}
