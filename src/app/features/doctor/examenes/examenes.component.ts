import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PacienteService } from '@/app/core/services/paciente.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { EvolucionService } from '@/app/core/services/evolucion.service';
import { EntradaExamen } from '@/app/core/models/evolucion.model';
import { PacienteHeaderComponent } from '@/app/shared/components/paciente-header/paciente-header.component';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

@Component({
    selector: 'app-examenes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TabsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        FileUploadModule,
        ToastModule,
        PacienteHeaderComponent,
        FormHeaderComponent,
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header
            title="Resultados Exámenes Complementarios"
            code="HC·M-009"
            subtitle="El médico solicita los exámenes y registra aquí los resultados de laboratorio y gabinete" />

        <p-card>
            @if (paciente()) {
                <app-paciente-header [paciente]="paciente()!" />
            }

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0">Registro Texto</p-tab>
                    <p-tab value="1">Adjuntos</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <!-- Tab Registro Texto -->
                    <p-tabpanel value="0">
                        <div class="flex justify-end mb-3 mt-3">
                            <p-button
                                label="Nueva Entrada"
                                icon="pi pi-plus"
                                (onClick)="openNuevaEntradaDialog()"
                            />
                        </div>

                        <p-table
                            [value]="entradasTexto()"
                            [paginator]="true"
                            [rows]="10"
                            [rowsPerPageOptions]="[5, 10, 20]"
                            [sortField]="'fecha'"
                            [sortOrder]="-1"
                            styleClass="p-datatable-striped"
                        >
                            <ng-template pTemplate="header">
                                <tr>
                                    <th pSortableColumn="fecha" class="w-32">
                                        FECHA <p-sortIcon field="fecha" />
                                    </th>
                                    <th class="w-24">HORA</th>
                                    <th>Evolucion (Subjetivo-Objetivo, Analisis-Plan)</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-entrada>
                                <tr>
                                    <td>{{ entrada.fecha }}</td>
                                    <td>{{ entrada.hora }}</td>
                                    <td class="whitespace-pre-wrap">{{ entrada.descripcion }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="3">
                                        <div class="empty-state">
                                            <i class="pi pi-file-edit"></i>
                                            <span class="empty-state__title">Sin resultados cargados</span>
                                            <span>Registrá un resultado con «Nueva Entrada» o adjuntá el informe en la pestaña «Adjuntos».</span>
                                        </div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <!-- Tab Adjuntos -->
                    <p-tabpanel value="1">
                        <div class="mb-4 mt-3">
                            <p-fileUpload
                                mode="basic"
                                chooseLabel="Subir Archivo"
                                chooseIcon="pi pi-upload"
                                accept="image/*,.pdf"
                                [auto]="true"
                                (onSelect)="onFileSelect($event)"
                            />
                        </div>

                        @if (entradasAdjuntos().length === 0) {
                            <div class="empty-state">
                                <i class="pi pi-paperclip"></i>
                                <span class="empty-state__title">Sin archivos adjuntos</span>
                                <span>Subí una imagen o PDF del resultado con «Subir Archivo».</span>
                            </div>
                        }

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            @for (adjunto of entradasAdjuntos(); track adjunto.id ?? $index) {
                                <div class="border rounded-lg p-3 flex flex-col items-center gap-2 bg-gray-50">
                                    @if (isImage(adjunto.archivoNombre)) {
                                        <img
                                            [src]="adjunto.archivoUrl"
                                            [alt]="adjunto.archivoNombre"
                                            class="max-h-48 object-contain rounded"
                                        />
                                    } @else {
                                        <div class="flex items-center justify-center h-32 w-full bg-gray-200 rounded">
                                            <i class="pi pi-file-pdf text-4xl text-red-500"></i>
                                        </div>
                                    }
                                    <span class="text-sm text-gray-700 truncate w-full text-center">
                                        {{ adjunto.archivoNombre }}
                                    </span>
                                    <span class="text-xs text-gray-400">
                                        {{ adjunto.fecha }} {{ adjunto.hora }}
                                    </span>
                                </div>
                            }
                        </div>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </p-card>

        <!-- Dialog Nueva Entrada -->
        <p-dialog
            header="Nueva entrada de examen"
            [(visible)]="dialogVisible"
            [modal]="true"
            [draggable]="false"
            [dismissableMask]="true"
            [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '34rem' }"
        >
            <div class="flex flex-col gap-4 pt-2">
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label for="fecha" class="field-label req">Fecha</label>
                        <input pInputText id="fecha" type="date" [(ngModel)]="nuevaEntrada.fecha" />
                    </div>
                    <div class="flex flex-col gap-1 w-40">
                        <label for="hora" class="field-label req">Hora</label>
                        <input pInputText id="hora" type="time" [(ngModel)]="nuevaEntrada.hora" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label for="descripcion" class="field-label req">Resultado del examen</label>
                    <textarea pTextarea id="descripcion" [(ngModel)]="nuevaEntrada.descripcion" rows="6"
                        placeholder="Transcriba el resultado: hemograma, química, imagenología, etc."></textarea>
                    <span class="field-hint">¿Tiene el informe en papel o PDF? Adjúntelo en la pestaña «Adjuntos».</span>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button
                    label="Cancelar"
                    icon="pi pi-times"
                    severity="secondary"
                    (onClick)="dialogVisible = false"
                />
                <p-button
                    label="Guardar"
                    icon="pi pi-check"
                    (onClick)="guardarEntrada()"
                    [disabled]="!nuevaEntrada.fecha || !nuevaEntrada.hora || !nuevaEntrada.descripcion"
                />
            </ng-template>
        </p-dialog>
    `,
})
export class ExamenesComponent {
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
    entradasTexto = signal<EntradaExamen[]>([]);
    entradasAdjuntos = signal<EntradaExamen[]>([]);

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
            this.loadExamenes(id);
        });
    }

    openNuevaEntradaDialog(): void {
        this.nuevaEntrada = this.crearEntradaVacia();
        this.dialogVisible = true;
    }

    guardarEntrada(): void {
        const pid = this.pacienteId();
        if (!pid) return;

        const entrada: EntradaExamen = {
            fecha: this.nuevaEntrada.fecha,
            hora: this.nuevaEntrada.hora,
            tipo: 'TEXTO',
            descripcion: this.nuevaEntrada.descripcion,
        };

        this.evolucionService.addEntradaExamen(pid, entrada).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: 'Entrada registrada correctamente.',
                });
                this.dialogVisible = false;
                this.loadExamenes(pid);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar la entrada.',
                });
            },
        });
    }

    onFileSelect(event: any): void {
        const pid = this.pacienteId();
        if (!pid) return;

        const file: File = event.files?.[0] ?? event.currentFiles?.[0];
        if (!file) return;

        const now = new Date();
        const entrada: EntradaExamen = {
            fecha: now.toISOString().split('T')[0],
            hora: now.toTimeString().slice(0, 5),
            tipo: 'ADJUNTO',
            archivoNombre: file.name,
            archivoUrl: URL.createObjectURL(file),
        };

        this.evolucionService.addEntradaExamen(pid, entrada).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Subido',
                    detail: `Archivo "${file.name}" adjuntado.`,
                });
                this.loadExamenes(pid);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo subir el archivo.',
                });
            },
        });
    }

    isImage(filename?: string): boolean {
        if (!filename) return false;
        return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(filename);
    }

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (data) => this.paciente.set(data),
            error: () => console.error('Error loading paciente'),
        });
    }

    private loadExamenes(id: number): void {
        this.evolucionService.getExamenesByPaciente(id).subscribe({
            next: (data) => {
                const entradas = data.entradas ?? [];
                this.entradasTexto.set(
                    entradas
                        .filter((e) => e.tipo === 'TEXTO')
                        .sort((a, b) => b.fecha.localeCompare(a.fecha))
                );
                this.entradasAdjuntos.set(
                    entradas.filter((e) => e.tipo === 'ADJUNTO')
                );
            },
            error: () => {
                this.entradasTexto.set([]);
                this.entradasAdjuntos.set([]);
            },
        });
    }

    private crearEntradaVacia() {
        const now = new Date();
        return {
            fecha: now.toISOString().split('T')[0],
            hora: now.toTimeString().slice(0, 5),
            descripcion: '',
        };
    }
}
