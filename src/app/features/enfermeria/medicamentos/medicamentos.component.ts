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
import { MessageService } from 'primeng/api';
import { EnfermeriaService } from '@/app/core/services/enfermeria.service';
import { PacienteService } from '@/app/core/services/paciente.service';
import { RegistroMedicamentos, MedicamentoRegistro, AdministracionMedicamento } from '@/app/core/models/enfermeria.model';
import { Paciente } from '@/app/core/models/paciente.model';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

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
        ToastModule,
        FormHeaderComponent,
    ],
    providers: [MessageService],
    template: `
    <p-toast />

    <div class="mx-auto" style="max-width: 1100px;">
        <app-form-header
            title="Registro de Soluciones Parenterales y Medicamentos"
            code="HCE-006"
            subtitle="Control de administración por fecha y hora" />
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 p-6 doc-sheet mx-auto" style="max-width: 1100px;">

        <!-- ===== HEADER ===== -->
        <div class="border border-gray-400">
            <!-- Title row -->
            <div class="flex border-b border-gray-400">
                <div class="w-20 flex items-center justify-center border-r border-gray-400 p-1">
                    <i class="pi pi-shield text-3xl text-blue-800"></i>
                </div>
                <div class="flex-1 flex items-center justify-center p-2">
                    <h2 class="text-sm font-bold text-center m-0 uppercase tracking-wide">
                        Registro de Soluciones Parenterales y Medicamentos
                    </h2>
                </div>
                <div class="w-44 flex flex-col items-end justify-center border-l border-gray-400 p-2 text-xs">
                    <span class="font-semibold">Form. - HCE -006</span>
                    <span class="mt-1">Regional</span>
                </div>
            </div>

            @if (paciente(); as pac) {
                <!-- Row: C. Asegurado | V. DE SERVICIOS -->
                <div class="flex border-b border-gray-400 text-xs">
                    <div class="flex-1 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                        <span class="font-semibold whitespace-nowrap">C. Asegurado</span>
                        <span class="border-b border-gray-400 flex-1 px-1">{{ pac.carnetAsegurado }}</span>
                    </div>
                    <div class="flex-1 flex items-center gap-3 px-2 py-1">
                        <span class="font-semibold whitespace-nowrap">V. DE SERVICIOS:</span>
                        <label class="flex items-center gap-1">
                            <span>PT1</span>
                            <p-checkbox [binary]="true" [ngModel]="pac.vServicios?.pt1 ?? false" [disabled]="true" />
                        </label>
                        <label class="flex items-center gap-1">
                            <span>PIP</span>
                            <p-checkbox [binary]="true" [ngModel]="pac.vServicios?.pip ?? false" [disabled]="true" />
                        </label>
                        <label class="flex items-center gap-1">
                            <span>PAPA</span>
                            <p-checkbox [binary]="true" [ngModel]="pac.vServicios?.papa ?? false" [disabled]="true" />
                        </label>
                    </div>
                </div>

                <!-- Row: C. Beneficiario | PT2 PIPA PIC -->
                <div class="flex border-b border-gray-400 text-xs">
                    <div class="flex-1 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                        <span class="font-semibold whitespace-nowrap">C. Beneficiario</span>
                        <span class="border-b border-gray-400 flex-1 px-1">{{ pac.carnetBeneficiario ?? '' }}</span>
                    </div>
                    <div class="flex-1 flex items-center gap-3 px-2 py-1">
                        <label class="flex items-center gap-1">
                            <span>PT2</span>
                            <p-checkbox [binary]="true" [ngModel]="pac.vServicios?.pt2 ?? false" [disabled]="true" />
                        </label>
                        <label class="flex items-center gap-1">
                            <span>PIPA</span>
                            <p-checkbox [binary]="true" [ngModel]="pac.vServicios?.pipa ?? false" [disabled]="true" />
                        </label>
                        <label class="flex items-center gap-1">
                            <span>PIC</span>
                            <p-checkbox [binary]="true" [ngModel]="pac.vServicios?.pic ?? false" [disabled]="true" />
                        </label>
                    </div>
                </div>

                <!-- Row: Ap. Paterno | Ap. Materno | Nombres -->
                <div class="flex border-b border-gray-400 text-xs">
                    <div class="flex-1 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                        <span class="font-semibold whitespace-nowrap">Ap. Paterno</span>
                        <span class="border-b border-gray-400 flex-1 px-1">{{ pac.apellidoPaterno }}</span>
                    </div>
                    <div class="flex-1 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                        <span class="font-semibold whitespace-nowrap">Ap. Materno</span>
                        <span class="border-b border-gray-400 flex-1 px-1">{{ pac.apellidoMaterno }}</span>
                    </div>
                    <div class="flex-1 flex items-center gap-2 px-2 py-1">
                        <span class="font-semibold whitespace-nowrap">Nombres</span>
                        <span class="border-b border-gray-400 flex-1 px-1">{{ pac.nombres }}</span>
                    </div>
                </div>

                <!-- Row: Servicio, Unidad, Peso, Otros, Cama -->
                @if (registro(); as reg) {
                    <div class="flex text-xs">
                        <div class="flex-1 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                            <span class="font-semibold">Servicio</span>
                            <span class="border-b border-gray-400 flex-1 px-1">{{ reg.servicio }}</span>
                        </div>
                        <div class="flex-1 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                            <span class="font-semibold">Unidad</span>
                            <span class="border-b border-gray-400 flex-1 px-1">{{ reg.unidad }}</span>
                        </div>
                        <div class="w-24 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                            <span class="font-semibold">Peso</span>
                            <span class="border-b border-gray-400 flex-1 px-1">{{ reg.peso ?? '' }}</span>
                        </div>
                        <div class="flex-1 flex items-center gap-2 px-2 py-1 border-r border-gray-400">
                            <span class="font-semibold">Otros</span>
                            <span class="border-b border-gray-400 flex-1 px-1"></span>
                        </div>
                        <div class="w-24 flex items-center gap-2 px-2 py-1">
                            <span class="font-semibold">Cama</span>
                            <span class="border-b border-gray-400 flex-1 px-1">{{ reg.cama }}</span>
                        </div>
                    </div>
                }
            }
        </div>

        <!-- ===== MAIN TABLE ===== -->
        <div class="overflow-x-auto mt-4 border border-gray-400">
            <table class="w-full border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-100 dark:bg-surface-800">
                        <th class="border border-gray-400 px-2 py-2 text-left font-semibold" style="min-width: 260px;">
                            MEDICAMENTO VIA Y DOSIS
                        </th>
                        <th class="border border-gray-400 px-2 py-2 text-center font-semibold" style="min-width: 90px;">
                            HORA DE ADMIN.
                        </th>
                        <th class="border border-gray-400 px-1 py-2 text-center font-semibold"
                            [attr.colspan]="uniqueDates().length || 1">
                            FECHA
                        </th>
                    </tr>
                    @if (uniqueDates().length) {
                        <tr class="bg-gray-50 dark:bg-surface-800">
                            <th class="border border-gray-400"></th>
                            <th class="border border-gray-400"></th>
                            @for (date of uniqueDates(); track date) {
                                <th class="border border-gray-400 px-1 py-1 text-center font-medium" style="min-width: 70px;">
                                    {{ date }}
                                </th>
                            }
                        </tr>
                    }
                </thead>
                <tbody>
                    @for (med of registro()?.medicamentos ?? []; track med.id ?? $index) {
                        <tr>
                            <td class="border border-gray-400 px-2 py-1 font-medium">
                                {{ med.nombre }} - {{ med.via }} - {{ med.dosis }}
                            </td>
                            <td class="border border-gray-400 px-2 py-1 text-center">
                                @if (med.administraciones.length) {
                                    {{ med.administraciones[0].hora }}
                                }
                            </td>
                            @for (date of uniqueDates(); track date) {
                                <td class="border border-gray-400 px-1 py-1 text-center">
                                    <p-checkbox
                                        [binary]="true"
                                        [(ngModel)]="getAdministracion(med, date).aplicado"
                                    />
                                </td>
                            }
                            @if (!uniqueDates().length) {
                                <td class="border border-gray-400 px-1 py-1 text-center text-gray-400">
                                    ---
                                </td>
                            }
                        </tr>
                    }
                    @if (!(registro()?.medicamentos?.length)) {
                        <tr>
                            <td [attr.colspan]="2 + (uniqueDates().length || 1)" class="border border-gray-400">
                                <div class="empty-state">
                                    <i class="pi pi-box"></i>
                                    <span class="empty-state__title">Sin medicamentos registrados</span>
                                    <span>Agregá el primero con «Agregar Medicamento».</span>
                                </div>
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>

        <!-- Action buttons -->
        <div class="mt-4 flex justify-end gap-2">
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
    </div>

    <!-- ===== DIALOG: New Medication ===== -->
    <p-dialog
        header="Nuevo medicamento"
        [(visible)]="showDialog"
        [modal]="true"
        [draggable]="false"
        [dismissableMask]="true"
        [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
        [style]="{ width: '32rem' }"
    >
        <div class="flex flex-col gap-4 pt-2">
            <div class="flex flex-col gap-1">
                <label class="field-label req" for="nombre">Medicamento</label>
                <input pInputText id="nombre" [(ngModel)]="nuevoMedicamento.nombre" placeholder="Nombre del medicamento o solución" />
            </div>
            <div class="flex gap-3">
                <div class="flex flex-col gap-1 w-32">
                    <label class="field-label req" for="via">Vía</label>
                    <input pInputText id="via" [(ngModel)]="nuevoMedicamento.via" placeholder="VO, EV, IM…" />
                </div>
                <div class="flex flex-col gap-1 flex-1">
                    <label class="field-label req" for="dosis">Dosis y frecuencia</label>
                    <input pInputText id="dosis" [(ngModel)]="nuevoMedicamento.dosis" placeholder="Ej.: 500 mg c/8h" />
                </div>
            </div>
            <span class="field-hint">Luego marcá las casillas por fecha/hora y presioná «Guardar».</span>
        </div>
        <ng-template #footer>
            <p-button
                label="Cancelar"
                severity="secondary"
                (onClick)="showDialog = false"
            />
            <p-button
                label="Guardar"
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

    nuevoMedicamento: { nombre: string; via: string; dosis: string } = {
        nombre: '',
        via: '',
        dosis: '',
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
                detail: 'Complete todos los campos del medicamento.',
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
        this.nuevoMedicamento = { nombre: '', via: '', dosis: '' };

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
