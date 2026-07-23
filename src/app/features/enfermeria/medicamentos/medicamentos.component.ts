import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { EnfermeriaService } from '@/app/core/services/enfermeria.service';
import { PacienteService } from '@/app/core/services/paciente.service';
import { RegistroMedicamentos, MedicamentoRegistro, AdministracionMedicamento } from '@/app/core/models/enfermeria.model';
import { Paciente } from '@/app/core/models/paciente.model';

@Component({
    selector: 'app-medicamentos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CheckboxModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        ToastModule,
    ],
    providers: [MessageService],
    styles: [`
        /* ── Patient bar ─────────────────────────────────────────────────────── */
        .pac-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background: var(--p-surface-0);
            border: 1px solid var(--p-surface-200);
            border-left: 3px solid var(--p-primary-500);
            border-radius: 0.75rem;
            margin-bottom: 1.25rem;
        }
        .pac-bar__name {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--p-text-color);
        }
        .pac-bar__meta {
            color: var(--p-text-muted-color);
            margin-top: 0.15rem;
        }
        .form-code {
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--p-primary-600);
            background: var(--p-primary-50);
            padding: 0.25rem 0.6rem;
            border-radius: 0.4rem;
            white-space: nowrap;
        }

        /* ── Action bar ──────────────────────────────────────────────────────── */
        .action-bar {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        /* ── Medication list & cards ─────────────────────────────────────────── */
        .med-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .med-card {
            background: var(--p-surface-0);
            border: 1px solid var(--p-surface-200);
            border-radius: 0.85rem;
            padding: 1rem 1.1rem;
            transition: box-shadow .15s ease;
        }
        .med-card:hover {
            box-shadow: 0 4px 16px -6px rgba(0, 0, 0, .12);
        }
        .med-card__head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }
        .med-pill {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .med-pill .pi {
            color: var(--p-primary-600);
            font-size: 0.9rem;
        }
        .med-name {
            font-size: 0.95rem;
            color: var(--p-text-color);
        }
        .med-tags {
            display: flex;
            gap: 0.35rem;
            flex-wrap: wrap;
        }
        .med-tag {
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 0.7rem;
            font-weight: 600;
            padding: 0.15rem 0.5rem;
            border-radius: 0.4rem;
        }
        .med-tag--via {
            background: #e0f2fe;
            color: #0369a1;
        }
        .med-tag--dosis {
            background: var(--p-primary-50);
            color: var(--p-primary-700);
        }

        /* ── Administration chips ────────────────────────────────────────────── */
        .med-card__body {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .med-body__label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--p-text-muted-color);
            margin-right: 0.25rem;
        }
        .adm-chip {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.3rem 0.6rem;
            border-radius: 0.5rem;
            border: 1px solid var(--p-surface-200);
            font-size: 0.8rem;
            background: var(--p-surface-50);
            transition: background .15s;
            cursor: pointer;
        }
        .adm-chip--ok {
            background: #dcfce7;
            border-color: #86efac;
        }
        .adm-chip--ok .adm-status {
            color: #15803d;
            font-weight: 600;
        }
        .adm-date {
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 0.72rem;
            color: var(--p-text-muted-color);
        }
        .adm-status {
            font-size: 0.72rem;
            color: var(--p-text-muted-color);
        }

        /* ── Via helper text ─────────────────────────────────────────────────── */
        .via-hint {
            font-size: 0.72rem;
            color: var(--p-text-muted-color);
            font-style: italic;
            margin-top: 0.2rem;
        }
    `],
    template: `
    <p-toast />

    <div class="bg-surface-0 dark:bg-surface-900 p-6 doc-sheet mx-auto" style="max-width: 1100px;">

        <!-- ===== PATIENT BAR ===== -->
        <div class="pac-bar">
            @if (paciente(); as pac) {
                <div class="pac-bar__info">
                    <div class="pac-bar__name">
                        {{ pac.apellidoPaterno }} {{ pac.apellidoMaterno }} {{ pac.nombres }}
                    </div>
                    <div class="pac-bar__meta font-mono text-xs">
                        {{ pac.carnetAsegurado }} · Cama {{ registro()?.cama }}
                    </div>
                </div>
                <div class="form-code">HCE·006</div>
            } @else {
                <div class="pac-bar__name" style="color: var(--p-text-muted-color);">
                    Cargando paciente…
                </div>
                <div class="form-code">HCE·006</div>
            }
        </div>

        <!-- ===== ACTION BUTTONS (top) ===== -->
        <div class="action-bar">
            <p-button
                label="Agregar Medicamento"
                icon="pi pi-plus"
                severity="success"
                (onClick)="showDialog = true"
            />
            <p-button
                label="Guardar"
                icon="pi pi-save"
                (onClick)="guardar()"
                [loading]="guardando()"
            />
        </div>

        <!-- ===== MEDICATION CARD LIST ===== -->
        <div class="med-list">
            @for (med of registro()?.medicamentos ?? []; track med.id ?? $index; let i = $index) {
                <div class="med-card">
                    <!-- Card header: name + via + dosis -->
                    <div class="med-card__head">
                        <div class="med-pill">
                            <i class="pi pi-box"></i>
                            <strong class="med-name">{{ med.nombre }}</strong>
                        </div>
                        <div class="med-tags">
                            <span class="med-tag med-tag--via">{{ med.via }}</span>
                            <span class="med-tag med-tag--dosis">{{ med.dosis }}</span>
                        </div>
                    </div>

                    <!-- Administration date chips -->
                    <div class="med-card__body">
                        <span class="med-body__label">Administraciones:</span>
                        @if (!uniqueDates().length) {
                            <span class="text-xs" style="color: var(--p-text-muted-color);">
                                Aún no hay fechas de administración
                            </span>
                        }
                        @for (date of uniqueDates(); track date) {
                            <div
                                class="adm-chip"
                                [class.adm-chip--ok]="getAdministracion(med, date).aplicado"
                            >
                                <p-checkbox
                                    [binary]="true"
                                    [(ngModel)]="getAdministracion(med, date).aplicado"
                                />
                                <span class="adm-date">{{ date }}</span>
                                <span class="adm-status">
                                    {{ getAdministracion(med, date).aplicado ? '✓' : 'Pendiente' }}
                                </span>
                            </div>
                        }
                    </div>
                </div>
            }

            @if (!(registro()?.medicamentos?.length)) {
                <div class="empty-state">
                    <i class="pi pi-box"></i>
                    <span class="empty-state__title">Sin medicamentos registrados</span>
                    <span>Presioná «Agregar Medicamento» para registrar el primero.</span>
                </div>
            }
        </div>

    </div>

    <!-- ===== DIALOG: New Medication ===== -->
    <p-dialog
        header="Nuevo medicamento"
        [(visible)]="showDialog"
        [modal]="true"
        [draggable]="false"
        [dismissableMask]="true"
        [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
        [style]="{ width: '38rem' }"
    >
        <div class="flex flex-col gap-4 pt-2">
            <!-- Nombre: full width -->
            <div class="flex flex-col gap-1">
                <label class="field-label req" for="nombre">Medicamento / Solución</label>
                <input
                    pInputText
                    id="nombre"
                    [(ngModel)]="nuevoMedicamento.nombre"
                    placeholder="Ej.: Cloruro de Sodio 0.9%, Amoxicilina, Metronidazol…"
                />
                <span class="field-hint">Nombre completo del medicamento o solución parenteral.</span>
            </div>

            <!-- Vía + Dosis: side by side -->
            <div class="flex gap-3">
                <div class="flex flex-col gap-1 w-36">
                    <label class="field-label req" for="via">Vía</label>
                    <input
                        pInputText
                        id="via"
                        [(ngModel)]="nuevoMedicamento.via"
                        placeholder="VO, EV, IM, SC…"
                    />
                    <span class="via-hint">VO=oral · EV=endovenosa · IM=intramuscular · SC=subcutánea</span>
                </div>
                <div class="flex flex-col gap-1 flex-1">
                    <label class="field-label req" for="dosis">Dosis y frecuencia</label>
                    <input
                        pInputText
                        id="dosis"
                        [(ngModel)]="nuevoMedicamento.dosis"
                        placeholder="Ej.: 500 mg c/8h · 1 g c/12h · 1000 mL/24h"
                    />
                    <span class="field-hint">Dosis unitaria y frecuencia de administración.</span>
                </div>
            </div>

            <!-- Observación: opcional, full width -->
            <div class="flex flex-col gap-1">
                <label class="field-label" for="obsmed">
                    Observación
                    <span style="font-weight: 400; color: var(--p-text-muted-color);">(opcional)</span>
                </label>
                <textarea
                    pInputText
                    id="obsmed"
                    rows="2"
                    [(ngModel)]="nuevoMedicamento.observacion"
                    placeholder="Ej.: Diluir en 100 mL SF, pasar en 30 min · Administrar con alimentos"
                    style="resize: vertical;"
                ></textarea>
                <span class="field-hint">Instrucciones especiales de preparación o administración.</span>
            </div>

            <span class="field-hint">
                Luego marcá las casillas por fecha en la tarjeta y presioná «Guardar» para confirmar.
            </span>
        </div>
        <ng-template #footer>
            <p-button
                label="Cancelar"
                severity="secondary"
                (onClick)="showDialog = false"
            />
            <p-button
                label="Agregar"
                icon="pi pi-check"
                (onClick)="addMedicamento()"
            />
        </ng-template>
    </p-dialog>
    `,
})
export class MedicamentosComponent {
    private route = inject(ActivatedRoute);
    private enfermeriaService = inject(EnfermeriaService);
    private pacienteService = inject(PacienteService);
    private messageService = inject(MessageService);
    private activo = inject(PacienteActivoService);

    private routeId = toSignal(
        this.route.paramMap.pipe(map((pm) => (pm.get('pacienteId') ? +pm.get('pacienteId')! : null))),
        { initialValue: null }
    );
    private loadedId: number | null = null;

    pacienteId = signal<number | null>(null);
    paciente = signal<Paciente | null>(null);
    registro = signal<RegistroMedicamentos | null>(null);
    showDialog = false;
    guardando = signal(false);

    nuevoMedicamento: { nombre: string; via: string; dosis: string; observacion?: string } = {
        nombre: '',
        via: '',
        dosis: '',
        observacion: '',
    };

    uniqueDates = computed<string[]>(() => {
        const reg = this.registro();
        if (!reg?.medicamentos?.length) return [];
        const dateSet = new Set<string>();
        for (const med of reg.medicamentos) {
            for (const adm of med.administraciones ?? []) {
                dateSet.add(adm.fecha);
            }
        }
        return [...dateSet].sort();
    });

    private adminCache = new Map<string, AdministracionMedicamento>();

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.loadPaciente(id);
            this.loadMedicamentos(id);
        });
    }

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (p) => this.paciente.set(p),
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la informacion del paciente.',
                }),
        });
    }

    private loadMedicamentos(id: number): void {
        this.enfermeriaService.getMedicamentosByPaciente(id).subscribe({
            next: (reg) => {
                this.registro.set(reg);
                this.adminCache.clear();
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el registro de medicamentos.',
                }),
        });
    }

    getAdministracion(med: MedicamentoRegistro, fecha: string): AdministracionMedicamento {
        const key = `${med.id ?? med.nombre}-${fecha}`;
        const cached = this.adminCache.get(key);
        if (cached) return cached;

        let adm = med.administraciones?.find((a) => a.fecha === fecha);
        if (!adm) {
            adm = { fecha, hora: '', aplicado: false };
            if (!med.administraciones) {
                med.administraciones = [];
            }
            med.administraciones.push(adm);
        }
        this.adminCache.set(key, adm);
        return adm;
    }

    addMedicamento(): void {
        const { nombre, via, dosis } = this.nuevoMedicamento;
        if (!nombre.trim() || !via.trim() || !dosis.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campos requeridos',
                detail: 'Complete nombre, vía y dosis del medicamento.',
            });
            return;
        }

        const reg = this.registro();
        if (!reg) return;

        const nuevo: MedicamentoRegistro = {
            nombre: nombre.trim(),
            via: via.trim(),
            dosis: dosis.trim(),
            administraciones: [],
        };

        const updated: RegistroMedicamentos = {
            ...reg,
            medicamentos: [...reg.medicamentos, nuevo],
        };

        this.registro.set(updated);
        this.adminCache.clear();
        this.showDialog = false;
        this.nuevoMedicamento = { nombre: '', via: '', dosis: '', observacion: '' };

        this.messageService.add({
            severity: 'success',
            summary: 'Medicamento agregado',
            detail: `${nuevo.nombre} fue agregado al registro. No olvide guardar.`,
        });
    }

    guardar(): void {
        const reg = this.registro();
        if (!reg) return;

        this.guardando.set(true);
        this.enfermeriaService.saveMedicamentos(reg).subscribe({
            next: (saved) => {
                this.registro.set(saved);
                this.adminCache.clear();
                this.guardando.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: 'Registro de medicamentos guardado correctamente.',
                });
            },
            error: () => {
                this.guardando.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar el registro de medicamentos.',
                });
            },
        });
    }
}
