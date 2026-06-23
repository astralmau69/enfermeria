import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { PacienteService } from '@/app/core/services/paciente.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { EvolucionService } from '@/app/core/services/evolucion.service';
import { EvolucionTratamiento, EntradaEvolucion } from '@/app/core/models/evolucion.model';
import { PacienteHeaderComponent } from '@/app/shared/components/paciente-header/paciente-header.component';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

@Component({
    selector: 'app-evolucion',
    standalone: true,
    imports: [
        FormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        DatePickerModule,
        ToastModule,
        CardModule,
        PacienteHeaderComponent,
        FormHeaderComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header
            title="Evolución y Tratamiento"
            code="HC·M-007"
            subtitle="Nota clínica diaria — Subjetivo · Objetivo · Análisis · Plan" />

        <p-card>
            @if (paciente()) {
                <app-paciente-header [paciente]="paciente()!" />
            }

            <div class="flex justify-end mb-3">
                <p-button
                    label="Nueva Entrada"
                    icon="pi pi-plus"
                    (onClick)="openDialog()"
                />
            </div>

            <p-table
                [value]="entradas()"
                [paginator]="true"
                [rows]="5"
                [rowsPerPageOptions]="[5, 10, 20]"
                [sortField]="'fecha'"
                [sortOrder]="-1"
                [tableStyle]="{ 'min-width': '60rem' }"
                stripedRows
            >
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="fecha" class="w-28">
                            FECHA
                            <p-sortIcon field="fecha" />
                        </th>
                        <th class="w-24">HORA</th>
                        <th>Evolucion (Subjetivo-Objetivo, Analisis-Plan)</th>
                        <th class="w-72">Tratamiento</th>
                    </tr>
                </ng-template>
                <ng-template #body let-entrada>
                    <tr>
                        <td>{{ entrada.fecha }}</td>
                        <td>{{ entrada.hora }}</td>
                        <td>
                            <div class="flex flex-col gap-2">
                                <div>
                                    <span class="font-bold text-blue-700">S: </span>
                                    <span>{{ entrada.subjetivo }}</span>
                                </div>
                                <div>
                                    <span class="font-bold text-green-700">O: </span>
                                    <span>{{ entrada.objetivo }}</span>
                                </div>
                                <div>
                                    <span class="font-bold text-orange-700">A: </span>
                                    <span>{{ entrada.analisis }}</span>
                                </div>
                                <div>
                                    <span class="font-bold text-purple-700">P: </span>
                                    <span>{{ entrada.plan }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="whitespace-pre-line">{{ entrada.tratamiento }}</td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="4">
                            <div class="empty-state">
                                <i class="pi pi-list"></i>
                                <span class="empty-state__title">Sin evoluciones registradas</span>
                                <span>Usá «Nueva Entrada» para escribir la primera nota SOAP.</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </p-card>

        <p-dialog
            header="Nueva entrada de evolución"
            [(visible)]="dialogVisible"
            [modal]="true"
            [draggable]="false"
            [dismissableMask]="true"
            [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '40rem' }"
            [closable]="true"
        >
            <div class="flex flex-col gap-4 pt-2">
                <div class="flex gap-4">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="font-semibold" for="fecha">Fecha</label>
                        <p-datepicker
                            [(ngModel)]="nuevaEntrada.fechaDate"
                            inputId="fecha"
                            dateFormat="dd/mm/yy"
                            [showIcon]="true"
                        />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="font-semibold" for="hora">Hora</label>
                        <input
                            pInputText
                            id="hora"
                            [(ngModel)]="nuevaEntrada.hora"
                            placeholder="HH:MM"
                        />
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-semibold" for="subjetivo">Subjetivo (S)</label>
                    <textarea
                        pTextarea
                        id="subjetivo"
                        [(ngModel)]="nuevaEntrada.subjetivo"
                        [rows]="3"
                        class="w-full"
                        placeholder="Sintomas referidos por el paciente..."
                    ></textarea>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-semibold" for="objetivo">Objetivo (O)</label>
                    <textarea
                        pTextarea
                        id="objetivo"
                        [(ngModel)]="nuevaEntrada.objetivo"
                        [rows]="3"
                        class="w-full"
                        placeholder="Hallazgos del examen fisico..."
                    ></textarea>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-semibold" for="analisis">Analisis (A)</label>
                    <textarea
                        pTextarea
                        id="analisis"
                        [(ngModel)]="nuevaEntrada.analisis"
                        [rows]="3"
                        class="w-full"
                        placeholder="Diagnostico y analisis..."
                    ></textarea>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-semibold" for="plan">Plan (P)</label>
                    <textarea
                        pTextarea
                        id="plan"
                        [(ngModel)]="nuevaEntrada.plan"
                        [rows]="3"
                        class="w-full"
                        placeholder="Plan de tratamiento..."
                    ></textarea>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-semibold" for="tratamiento">Tratamiento</label>
                    <textarea
                        pTextarea
                        id="tratamiento"
                        [(ngModel)]="nuevaEntrada.tratamiento"
                        [rows]="3"
                        class="w-full"
                        placeholder="Medicamentos, dosis, via, frecuencia..."
                    ></textarea>
                </div>
            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button
                        label="Cancelar"
                        severity="secondary"
                        (onClick)="dialogVisible = false"
                    />
                    <p-button
                        label="Guardar"
                        icon="pi pi-check"
                        (onClick)="guardarEntrada()"
                    />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class EvolucionComponent {
    private route = inject(ActivatedRoute);
    private pacienteService = inject(PacienteService);
    private evolucionService = inject(EvolucionService);
    private messageService = inject(MessageService);
    private activo = inject(PacienteActivoService);

    private routeId = toSignal(
        this.route.paramMap.pipe(map((pm) => (pm.get('pacienteId') ? +pm.get('pacienteId')! : null))),
        { initialValue: null }
    );
    private loadedId: number | null = null;

    pacienteId = signal<number | null>(null);
    paciente = signal<Paciente | null>(null);
    entradas = signal<EntradaEvolucion[]>([]);

    dialogVisible = false;
    nuevaEntrada = this.crearEntradaVacia();

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.loadPaciente(id);
            this.loadEvolucion(id);
        });
    }

    openDialog(): void {
        this.nuevaEntrada = this.crearEntradaVacia();
        this.dialogVisible = true;
    }

    guardarEntrada(): void {
        const pid = this.pacienteId();
        if (!pid) return;

        if (!this.nuevaEntrada.subjetivo && !this.nuevaEntrada.objetivo &&
            !this.nuevaEntrada.analisis && !this.nuevaEntrada.plan) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validacion',
                detail: 'Debe completar al menos un campo SOAP.'
            });
            return;
        }

        const entrada: EntradaEvolucion = {
            fecha: this.formatDate(this.nuevaEntrada.fechaDate),
            hora: this.nuevaEntrada.hora,
            subjetivo: this.nuevaEntrada.subjetivo,
            objetivo: this.nuevaEntrada.objetivo,
            analisis: this.nuevaEntrada.analisis,
            plan: this.nuevaEntrada.plan,
            tratamiento: this.nuevaEntrada.tratamiento
        };

        this.evolucionService.addEntradaEvolucion(pid, entrada).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: 'Entrada de evolucion registrada correctamente.'
                });
                this.dialogVisible = false;
                this.loadEvolucion(pid);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar la entrada.'
                });
            }
        });
    }

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (data) => this.paciente.set(data),
            error: () => console.error('Error loading paciente')
        });
    }

    private loadEvolucion(pacienteId: number): void {
        this.evolucionService.getEvolucionByPaciente(pacienteId).subscribe({
            next: (data) => this.entradas.set(data.entradas ?? []),
            error: () => this.entradas.set([])
        });
    }

    private crearEntradaVacia() {
        const now = new Date();
        const hora = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');
        return {
            fechaDate: now,
            hora,
            subjetivo: '',
            objetivo: '',
            analisis: '',
            plan: '',
            tratamiento: ''
        };
    }

    private formatDate(date: Date): string {
        if (!date) return '';
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
    }
}
