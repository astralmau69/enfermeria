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
import { BalanceHidrico, RegistroBalance, TurnoBalance } from '@/app/core/models/cuidados-enfermeria.model';

@Component({
    selector: 'app-balance-hidrico',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, SelectModule,
        InputTextModule, InputNumberModule, TextareaModule, ToastModule,
        FormHeaderComponent, PacienteHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header title="Balance Hídrico" code="BALANCE"
            subtitle="Ingresos y egresos de líquidos por turno" responsable="AUX" appReveal />

        @if (paciente(); as p) {
            <app-paciente-header [paciente]="p" [cama]="doc()?.cama || ''" servicio="Hospitalización" />
        }

        @if (!pacienteId()) {
            <div class="empty-state"><i class="pi pi-user"></i><span class="empty-state__title">Sin paciente seleccionado</span>
                <span>Abrí esta hoja desde el censo o el mapa de camas.</span></div>
        } @else {
            <!-- Resumen -->
            <div class="sum">
                <div class="sum__box sum__box--in"><span class="sum__k">Ingresos</span><b class="tabular">{{ totalIngresos() }} <small>ml</small></b></div>
                <div class="sum__box sum__box--out"><span class="sum__k">Egresos</span><b class="tabular">{{ totalEgresos() }} <small>ml</small></b></div>
                <div class="sum__box" [class.is-pos]="balanceNeto() >= 0" [class.is-neg]="balanceNeto() < 0">
                    <span class="sum__k">Balance</span><b class="tabular">{{ balanceNeto() > 0 ? '+' : '' }}{{ balanceNeto() }} <small>ml</small></b></div>
            </div>

            <div class="action-bar">
                <p-button label="Agregar registro" icon="pi pi-plus" (onClick)="abrir()" />
            </div>

            <div class="doc-sheet bg-surface-0 dark:bg-surface-900 p-2 md:p-3" appReveal>
                <p-table [value]="registros()" [loading]="loading()" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '52rem' }">
                    <ng-template #header>
                        <tr>
                            <th style="width:8rem">Fecha</th>
                            <th style="width:7rem">Turno</th>
                            <th class="text-right">Ing. VO</th>
                            <th class="text-right">Ing. EV</th>
                            <th class="text-right">Egr. orina</th>
                            <th class="text-right">Egr. otros</th>
                            <th class="text-right">Ingresos</th>
                            <th class="text-right">Egresos</th>
                            <th class="text-right">Balance</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-r>
                        <tr>
                            <td class="font-mono text-sm">{{ r.fecha }}</td>
                            <td>{{ turnoLabel(r.turno) }}</td>
                            <td class="text-right tabular">{{ r.ingViaOral || 0 }}</td>
                            <td class="text-right tabular">{{ r.ingParenteral || 0 }}</td>
                            <td class="text-right tabular">{{ r.egrOrina || 0 }}</td>
                            <td class="text-right tabular">{{ otrosEgr(r) }}</td>
                            <td class="text-right tabular font-semibold">{{ ing(r) }}</td>
                            <td class="text-right tabular font-semibold">{{ egr(r) }}</td>
                            <td class="text-right tabular font-bold" [class.pos]="ing(r) - egr(r) >= 0" [class.neg]="ing(r) - egr(r) < 0">
                                {{ ing(r) - egr(r) > 0 ? '+' : '' }}{{ ing(r) - egr(r) }}
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr><td colspan="9">
                            <div class="empty-state"><i class="pi pi-sliders-h"></i>
                                <span class="empty-state__title">Sin registros de balance</span>
                                <span>Agregá el primer control de ingresos y egresos del turno.</span></div>
                        </td></tr>
                    </ng-template>
                </p-table>
            </div>
        }

        <!-- Dialog -->
        <p-dialog header="Nuevo registro de balance" [(visible)]="dialogVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '40rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Fecha</label>
                        <input type="date" pInputText [(ngModel)]="nuevo.fecha" />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Turno</label>
                        <p-select [options]="turnoOptions" optionLabel="label" optionValue="value"
                            [(ngModel)]="nuevo.turno" appendTo="body" styleClass="w-full" />
                    </div>
                </div>

                <div>
                    <div class="grp-title grp-title--in"><i class="pi pi-arrow-down"></i> Ingresos (ml)</div>
                    <div class="grid3">
                        <div class="flex flex-col gap-1"><label class="field-label">Vía oral</label>
                            <p-inputnumber [(ngModel)]="nuevo.ingViaOral" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                        <div class="flex flex-col gap-1"><label class="field-label">Parenteral (EV)</label>
                            <p-inputnumber [(ngModel)]="nuevo.ingParenteral" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                        <div class="flex flex-col gap-1"><label class="field-label">Otros</label>
                            <p-inputnumber [(ngModel)]="nuevo.ingOtros" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                    </div>
                </div>

                <div>
                    <div class="grp-title grp-title--out"><i class="pi pi-arrow-up"></i> Egresos (ml)</div>
                    <div class="grid3">
                        <div class="flex flex-col gap-1"><label class="field-label">Orina</label>
                            <p-inputnumber [(ngModel)]="nuevo.egrOrina" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                        <div class="flex flex-col gap-1"><label class="field-label">Drenajes</label>
                            <p-inputnumber [(ngModel)]="nuevo.egrDrenajes" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                        <div class="flex flex-col gap-1"><label class="field-label">Vómito</label>
                            <p-inputnumber [(ngModel)]="nuevo.egrVomito" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                        <div class="flex flex-col gap-1"><label class="field-label">Deposiciones</label>
                            <p-inputnumber [(ngModel)]="nuevo.egrDeposiciones" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                        <div class="flex flex-col gap-1"><label class="field-label">Otros</label>
                            <p-inputnumber [(ngModel)]="nuevo.egrOtros" [min]="0" [useGrouping]="false" styleClass="w-full" /></div>
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="field-label">Observación</label>
                    <textarea pTextarea [(ngModel)]="nuevo.observacion" rows="2" placeholder="Notas del turno…"></textarea>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="dialogVisible = false" />
                <p-button label="Guardar registro" icon="pi pi-check" (onClick)="agregar()" [loading]="guardando()" [disabled]="!nuevo.fecha || !nuevo.turno" />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .sum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 0.5rem 0 1rem; }
        .sum__box { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.85rem 1rem; border-radius: 0.9rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .sum__box { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .sum__box--in { border-left: 4px solid #0369a1; }
        .sum__box--out { border-left: 4px solid #b45309; }
        .sum__box.is-pos { border-left: 4px solid var(--p-primary-500); }
        .sum__box.is-neg { border-left: 4px solid #be123c; }
        .sum__k { font-family: var(--font-mono); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--p-text-muted-color); }
        .sum__box b { font-family: var(--font-display); font-size: 1.4rem; color: var(--p-text-color); }
        .sum__box b small { font-size: 0.7rem; color: var(--p-text-muted-color); font-weight: 600; }
        .action-bar { display: flex; justify-content: flex-end; margin-bottom: 0.85rem; }
        .pos { color: #15803d; } .neg { color: #be123c; }
        .grp-title { display: flex; align-items: center; gap: 0.4rem; font-weight: 700; font-size: 0.8rem; margin-bottom: 0.5rem; }
        .grp-title .pi { font-size: 0.72rem; }
        .grp-title--in { color: #0369a1; } .grp-title--out { color: #b45309; }
        .grid3 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
        @media (min-width: 640px) { .grid3 { grid-template-columns: repeat(3, 1fr); } }
    `]
})
export class BalanceHidricoComponent {
    private route = inject(ActivatedRoute);
    private pacienteService = inject(PacienteService);
    private activo = inject(PacienteActivoService);
    private service = inject(CuidadosEnfermeriaService);
    private messageService = inject(MessageService);

    private routeId = toSignal(this.route.paramMap.pipe(map((pm) => (pm.get('pacienteId') ? +pm.get('pacienteId')! : null))), { initialValue: null });
    private loadedId: number | null = null;

    pacienteId = signal<number | null>(null);
    paciente = signal<Paciente | null>(null);
    doc = signal<BalanceHidrico | null>(null);
    loading = signal(true);
    guardando = signal(false);

    dialogVisible = false;
    nuevo: Partial<RegistroBalance> = this.vacio();

    readonly turnoOptions = [
        { label: 'Mañana', value: 'MANANA' },
        { label: 'Tarde', value: 'TARDE' },
        { label: 'Noche', value: 'NOCHE' }
    ];

    registros = computed(() => [...(this.doc()?.registros ?? [])].sort((a, b) =>
        a.fecha === b.fecha ? this.turnoIdx(a.turno) - this.turnoIdx(b.turno) : a.fecha.localeCompare(b.fecha)));

    totalIngresos = computed(() => this.registros().reduce((s, r) => s + this.ing(r), 0));
    totalEgresos = computed(() => this.registros().reduce((s, r) => s + this.egr(r), 0));
    balanceNeto = computed(() => this.totalIngresos() - this.totalEgresos());

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
        this.service.getBalance(id).subscribe({
            next: (d) => { this.doc.set(d); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el balance hídrico.' }); }
        });
    }

    ing(r: RegistroBalance): number { return (r.ingViaOral || 0) + (r.ingParenteral || 0) + (r.ingOtros || 0); }
    egr(r: RegistroBalance): number { return (r.egrOrina || 0) + (r.egrDrenajes || 0) + (r.egrVomito || 0) + (r.egrDeposiciones || 0) + (r.egrOtros || 0); }
    otrosEgr(r: RegistroBalance): number { return (r.egrDrenajes || 0) + (r.egrVomito || 0) + (r.egrDeposiciones || 0) + (r.egrOtros || 0); }
    turnoLabel(t: TurnoBalance): string { return { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' }[t]; }
    private turnoIdx(t: TurnoBalance): number { return { MANANA: 0, TARDE: 1, NOCHE: 2 }[t]; }

    abrir(): void { this.nuevo = this.vacio(); this.dialogVisible = true; }

    agregar(): void {
        const doc = this.doc();
        if (!doc || !this.nuevo.fecha || !this.nuevo.turno) return;
        const entrada: RegistroBalance = {
            fecha: this.nuevo.fecha!, turno: this.nuevo.turno as TurnoBalance,
            ingViaOral: this.nuevo.ingViaOral || 0, ingParenteral: this.nuevo.ingParenteral || 0, ingOtros: this.nuevo.ingOtros || 0,
            egrOrina: this.nuevo.egrOrina || 0, egrDrenajes: this.nuevo.egrDrenajes || 0, egrVomito: this.nuevo.egrVomito || 0,
            egrDeposiciones: this.nuevo.egrDeposiciones || 0, egrOtros: this.nuevo.egrOtros || 0,
            observacion: this.nuevo.observacion?.trim() || undefined
        };
        const updated: BalanceHidrico = { ...doc, registros: [...doc.registros, entrada] };
        this.guardando.set(true);
        this.service.saveBalance(updated).subscribe({
            next: (saved) => { this.doc.set(saved); this.guardando.set(false); this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Registro guardado', detail: `Balance de ${this.turnoLabel(entrada.turno)} · ${entrada.fecha}` }); },
            error: () => { this.guardando.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el registro.' }); }
        });
    }

    private vacio(): Partial<RegistroBalance> {
        return { fecha: new Date().toISOString().split('T')[0], turno: 'MANANA' };
    }
}
