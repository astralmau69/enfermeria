import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PacienteService } from '@/app/core/services/paciente.service';
import { EnfermeriaService } from '@/app/core/services/enfermeria.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { NotaDiariaEnfermeria, EntradaNotaEnfermeria } from '@/app/core/models/enfermeria.model';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

@Component({
    selector: 'app-notas-diarias',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        CheckboxModule,
        ToastModule,
        FormHeaderComponent,
    ],
    providers: [MessageService],
    template: `
    <p-toast />

    <div class="mx-auto" style="max-width: 1000px;">
        <app-form-header
            title="Notas Diarias de Enfermería"
            code="HCE-004"
            subtitle="Descripción de síntomas observados por turno" />
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 p-6 doc-sheet mx-auto" style="max-width: 1000px;">

        <!-- ===== HEADER ===== -->
        <div class="border border-black">

            <!-- Top row: Logo | Title | Form number -->
            <div class="flex border-b border-black">
                <!-- Logo -->
                <div class="w-20 flex items-center justify-center border-r border-black p-1">
                    <i class="pi pi-shield text-3xl text-blue-800"></i>
                </div>
                <!-- Title -->
                <div class="flex-1 flex items-center justify-center p-2">
                    <span class="text-sm font-bold tracking-wide">NOTAS DIARIAS DE ENFERMERIA</span>
                </div>
                <!-- Form number / Regional -->
                <div class="w-36 border-l border-black p-1 text-xs flex flex-col justify-center items-center">
                    <span class="font-semibold">Form. - HCE -004</span>
                    <span>Regional</span>
                </div>
            </div>

            <!-- Row: C. Asegurado | V. DE SERVICIOS (PT1 PIP PAPA) -->
            <div class="flex border-b border-black text-xs">
                <div class="flex-1 flex items-center gap-1 px-2 py-1 border-r border-black">
                    <span class="font-semibold whitespace-nowrap">C. Asegurado</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="paciente()?.carnetAsegurado ?? ''" readonly />
                </div>
                <div class="flex-1 flex items-center gap-2 px-2 py-1 flex-wrap">
                    <span class="font-semibold whitespace-nowrap">V. DE SERVICIOS:</span>
                    <label class="flex items-center gap-1">
                        <p-checkbox [(ngModel)]="vServicios.pt1" [binary]="true" />
                        <span>PT1</span>
                    </label>
                    <label class="flex items-center gap-1">
                        <p-checkbox [(ngModel)]="vServicios.pip" [binary]="true" />
                        <span>PIP</span>
                    </label>
                    <label class="flex items-center gap-1">
                        <p-checkbox [(ngModel)]="vServicios.papa" [binary]="true" />
                        <span>PAPA</span>
                    </label>
                </div>
            </div>

            <!-- Row: C. Beneficiario | PT2 PIPA PIC -->
            <div class="flex border-b border-black text-xs">
                <div class="flex-1 flex items-center gap-1 px-2 py-1 border-r border-black">
                    <span class="font-semibold whitespace-nowrap">C. Beneficiario</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="paciente()?.carnetBeneficiario ?? ''" readonly />
                </div>
                <div class="flex-1 flex items-center gap-2 px-2 py-1 flex-wrap">
                    <label class="flex items-center gap-1">
                        <p-checkbox [(ngModel)]="vServicios.pt2" [binary]="true" />
                        <span>PT2</span>
                    </label>
                    <label class="flex items-center gap-1">
                        <p-checkbox [(ngModel)]="vServicios.pipa" [binary]="true" />
                        <span>PIPA</span>
                    </label>
                    <label class="flex items-center gap-1">
                        <p-checkbox [(ngModel)]="vServicios.pic" [binary]="true" />
                        <span>PIC</span>
                    </label>
                </div>
            </div>

            <!-- Row: Ap. Paterno | Ap. Materno | Ap. Esposo | Nombres -->
            <div class="flex border-b border-black text-xs">
                <div class="flex-1 flex items-center gap-1 px-2 py-1 border-r border-black">
                    <span class="font-semibold whitespace-nowrap">Ap. Paterno</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="paciente()?.apellidoPaterno ?? ''" readonly />
                </div>
                <div class="flex-1 flex items-center gap-1 px-2 py-1 border-r border-black">
                    <span class="font-semibold whitespace-nowrap">Ap. Materno</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="paciente()?.apellidoMaterno ?? ''" readonly />
                </div>
                <div class="flex-1 flex items-center gap-1 px-2 py-1 border-r border-black">
                    <span class="font-semibold whitespace-nowrap">Ap. Esposo</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="paciente()?.apellidoEsposo ?? ''" readonly />
                </div>
                <div class="flex-1 flex items-center gap-1 px-2 py-1">
                    <span class="font-semibold whitespace-nowrap">Nombres</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="paciente()?.nombres ?? ''" readonly />
                </div>
            </div>

            <!-- Row: Establecimiento | Servicio - Sala | Cama N° -->
            <div class="flex text-xs">
                <div class="flex-1 flex items-center gap-1 px-2 py-1 border-r border-black">
                    <span class="font-semibold whitespace-nowrap">Establecimiento</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="notaDiaria()?.establecimiento ?? ''" readonly />
                </div>
                <div class="flex-1 flex items-center gap-1 px-2 py-1 border-r border-black">
                    <span class="font-semibold whitespace-nowrap">Servicio - Sala</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="notaDiaria()?.servicioSala ?? ''" readonly />
                </div>
                <div class="w-40 flex items-center gap-1 px-2 py-1">
                    <span class="font-semibold whitespace-nowrap">Cama N°</span>
                    <input pInputText class="w-full p-1 text-xs" [value]="notaDiaria()?.cama ?? ''" readonly />
                </div>
            </div>

        </div>
        <!-- END HEADER -->

        <!-- Action bar -->
        <div class="flex justify-end my-3">
            <p-button
                label="Nueva Nota"
                icon="pi pi-plus"
                size="small"
                (onClick)="abrirDialogNuevaNota()"
            />
        </div>

        <!-- ===== TABLE ===== -->
        <p-table
            [value]="entradas()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[5, 10, 20]"
            [sortField]="'fecha'"
            [sortOrder]="-1"
            [tableStyle]="{ 'min-width': '50rem' }"
            styleClass="p-datatable-sm p-datatable-gridlines"
        >
            <ng-template #header>
                <tr class="text-xs">
                    <th pSortableColumn="fecha" style="width: 10%">
                        FECHA <p-sortIcon field="fecha" />
                    </th>
                    <th pSortableColumn="hora" style="width: 8%">
                        HORA <p-sortIcon field="hora" />
                    </th>
                    <th style="width: 14%">PROCEDENTE</th>
                    <th style="width: 53%">DESCRIPCION DE SINTOMAS OBSERVADOS</th>
                    <th style="width: 15%">FIRMA</th>
                </tr>
            </ng-template>
            <ng-template #body let-entrada>
                <tr class="text-xs">
                    <td>{{ entrada.fecha }}</td>
                    <td>{{ entrada.hora }}</td>
                    <td>{{ entrada.procedente }}</td>
                    <td class="whitespace-pre-wrap">{{ entrada.descripcionSintomas }}</td>
                    <td>{{ entrada.enfermeraNombre ?? '---' }}</td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <i class="pi pi-pencil"></i>
                            <span class="empty-state__title">Aún no hay notas para este paciente</span>
                            <span>Usá «Nueva Nota» para registrar la primera observación del turno.</span>
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

    </div>

    <!-- ===== DIALOG NUEVA NOTA ===== -->
    <p-dialog
        header="Nueva nota de enfermería"
        [(visible)]="dialogVisible"
        [modal]="true"
        [draggable]="false"
        [dismissableMask]="true"
        [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
        [style]="{ width: '34rem' }"
        [closable]="true"
    >
        <div class="flex flex-col gap-4 pt-2">
            <div class="flex gap-3">
                <div class="flex flex-col gap-1 flex-1">
                    <label for="fecha" class="field-label req">Fecha</label>
                    <input pInputText id="fecha" [(ngModel)]="nuevaEntrada.fecha" placeholder="DD/MM/AAAA" />
                </div>
                <div class="flex flex-col gap-1 w-40">
                    <label for="hora" class="field-label req">Hora</label>
                    <input pInputText id="hora" [(ngModel)]="nuevaEntrada.hora" type="time" />
                </div>
            </div>

            <div class="flex flex-col gap-1">
                <label for="procedente" class="field-label req">Procedente</label>
                <input pInputText id="procedente" [(ngModel)]="nuevaEntrada.procedente" placeholder="Ej.: Emergencia, Quirófano, Oncología…" />
            </div>

            <div class="flex flex-col gap-1">
                <label for="descripcion" class="field-label req">Síntomas observados</label>
                <textarea pTextarea id="descripcion" [(ngModel)]="nuevaEntrada.descripcionSintomas" rows="5"
                    placeholder="Describa lo observado en el turno: estado de conciencia, vía, diuresis, tolerancia, etc."></textarea>
                <span class="field-hint">La nota se firmará automáticamente con su nombre de usuario.</span>
            </div>
        </div>

        <ng-template #footer>
            <div class="flex justify-end gap-2">
                <p-button
                    label="Cancelar"
                    icon="pi pi-times"
                    severity="secondary"
                    (onClick)="dialogVisible = false"
                />
                <p-button
                    label="Guardar"
                    icon="pi pi-check"
                    (onClick)="guardarNota()"
                    [disabled]="!esFormularioValido()"
                />
            </div>
        </ng-template>
    </p-dialog>
    `,
})
export class NotasDiariasComponent {
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
    notaDiaria = signal<NotaDiariaEnfermeria | null>(null);
    entradas = signal<EntradaNotaEnfermeria[]>([]);

    vServicios = { pt1: false, pt2: false, pip: false, pipa: false, papa: false, pic: false };

    dialogVisible = false;
    nuevaEntrada: EntradaNotaEnfermeriaForm = this.crearEntradaVacia();

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.cargarPaciente(id);
            this.cargarNotas(id);
        });
    }

    private cargarPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (paciente) => {
                this.paciente.set(paciente);
                if (paciente.vServicios) {
                    this.vServicios = { ...paciente.vServicios };
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar los datos del paciente.',
                }),
        });
    }

    private cargarNotas(pacienteId: number): void {
        this.enfermeriaService.getNotasByPaciente(pacienteId).subscribe({
            next: (nota) => {
                this.notaDiaria.set(nota);
                if (nota.vServicios) {
                    this.vServicios = { ...nota.vServicios };
                }
                const sorted = [...(nota.entradas ?? [])].sort(
                    (a, b) => this.toSortKey(b) - this.toSortKey(a),
                );
                this.entradas.set(sorted);
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las notas de enfermeria.',
                }),
        });
    }

    abrirDialogNuevaNota(): void {
        this.nuevaEntrada = this.crearEntradaVacia();
        this.dialogVisible = true;
    }

    esFormularioValido(): boolean {
        return !!(
            this.nuevaEntrada.fecha?.trim() &&
            this.nuevaEntrada.hora &&
            this.nuevaEntrada.procedente?.trim() &&
            this.nuevaEntrada.descripcionSintomas?.trim()
        );
    }

    guardarNota(): void {
        if (!this.esFormularioValido()) return;

        const entrada: EntradaNotaEnfermeria = {
            fecha: this.nuevaEntrada.fecha.trim(),
            hora: this.nuevaEntrada.hora,
            procedente: this.nuevaEntrada.procedente.trim(),
            descripcionSintomas: this.nuevaEntrada.descripcionSintomas.trim(),
        };

        const pacienteId = this.pacienteId();
        if (pacienteId) {
            this.enfermeriaService.addNota(pacienteId, entrada).subscribe({
                next: (saved) => {
                    const current = this.entradas();
                    const updated = [saved, ...current].sort(
                        (a, b) => this.toSortKey(b) - this.toSortKey(a),
                    );
                    this.entradas.set(updated);
                    this.dialogVisible = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Nota registrada',
                        detail: 'La nota de enfermeria fue guardada correctamente.',
                    });
                },
                error: () =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo guardar la nota.',
                    }),
            });
        }
    }

    private crearEntradaVacia(): EntradaNotaEnfermeriaForm {
        const now = new Date();
        const d = now.getDate().toString().padStart(2, '0');
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        const y = now.getFullYear();
        return {
            fecha: `${d}/${m}/${y}`,
            hora: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            procedente: '',
            descripcionSintomas: '',
        };
    }

    private toSortKey(entry: EntradaNotaEnfermeria): number {
        const parts = entry.fecha.split('/');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${entry.hora || '00:00'}`).getTime();
        }
        return 0;
    }
}

interface EntradaNotaEnfermeriaForm {
    fecha: string;
    hora: string;
    procedente: string;
    descripcionSintomas: string;
}
