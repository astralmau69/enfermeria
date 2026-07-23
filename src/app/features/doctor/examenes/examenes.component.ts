import { Component, inject, signal, effect, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
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
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

@Component({
    selector: 'app-examenes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TabsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        FileUploadModule,
        ToastModule,
        FormHeaderComponent,
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header
            title="Resultados Exámenes Complementarios"
            code="HC·M-009"
            subtitle="El médico solicita los exámenes y registra aquí los resultados de laboratorio y gabinete" />

        <div class="bg-surface-0 dark:bg-surface-900 p-5 md:p-6 doc-sheet mx-auto" style="max-width: 1000px;">

            <!-- Barra compacta del paciente -->
            @if (paciente(); as p) {
                <div class="pac-bar">
                    <div class="pac-bar__avatar">{{ initials() }}</div>
                    <div class="pac-bar__info">
                        <span class="pac-bar__name">{{ nombreCompleto() }}</span>
                        <span class="pac-bar__meta">
                            Carnet {{ p.carnetAsegurado }}
                            @if (p.edad) { · {{ p.edad }} años }
                            · {{ p.sexo === 'M' ? 'Masculino' : 'Femenino' }}
                            @if (p.grado) { · {{ p.grado }} }
                        </span>
                    </div>
                    <div class="pac-bar__badge">{{ p.tipoAsegurado }}</div>
                </div>
            }

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0">
                        <i class="pi pi-file-edit mr-1"></i>Registro de Texto
                    </p-tab>
                    <p-tab value="1">
                        <i class="pi pi-paperclip mr-1"></i>Archivos Adjuntos
                    </p-tab>
                </p-tablist>
                <p-tabpanels>

                    <!-- ── Tab: Registro de Texto ── -->
                    <p-tabpanel value="0">
                        <!-- Acciones al tope -->
                        <div class="tab-actions">
                            <p-button
                                label="Agregar Examen"
                                icon="pi pi-plus"
                                (onClick)="openNuevaEntradaDialog()"
                            />
                        </div>

                        <!-- Lista de exámenes en cards -->
                        <div class="exam-list">
                            @for (entrada of entradasTexto(); track entrada.id ?? $index) {
                                <div class="exam-card">
                                    <div class="exam-card__head">
                                        <span class="exam-type-badge">
                                            <i class="pi pi-file-edit"></i> Resultado
                                        </span>
                                        <span class="exam-date">
                                            <i class="pi pi-calendar"></i>
                                            {{ entrada.fecha }}
                                            @if (entrada.hora) {
                                                <span class="exam-date__time">{{ entrada.hora }}</span>
                                            }
                                        </span>
                                    </div>
                                    <div class="exam-body">{{ entrada.descripcion }}</div>
                                </div>
                            } @empty {
                                <div class="empty-state">
                                    <i class="pi pi-images"></i>
                                    <span class="empty-state__title">Sin exámenes registrados</span>
                                    <span>Usá «Agregar Examen» para registrar el primero.</span>
                                </div>
                            }
                        </div>
                    </p-tabpanel>

                    <!-- ── Tab: Archivos Adjuntos ── -->
                    <p-tabpanel value="1">
                        <div class="tab-actions">
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

                        <div class="adjuntos-grid">
                            @for (adjunto of entradasAdjuntos(); track adjunto.id ?? $index) {
                                <div class="adjunto-card">
                                    @if (isImage(adjunto.archivoNombre)) {
                                        <img
                                            [src]="adjunto.archivoUrl"
                                            [alt]="adjunto.archivoNombre"
                                            class="adjunto-card__img"
                                        />
                                    } @else {
                                        <div class="adjunto-card__pdf">
                                            <i class="pi pi-file-pdf"></i>
                                        </div>
                                    }
                                    <span class="adjunto-card__name">{{ adjunto.archivoNombre }}</span>
                                    <span class="adjunto-card__date">{{ adjunto.fecha }} {{ adjunto.hora }}</span>
                                </div>
                            }
                        </div>
                    </p-tabpanel>

                </p-tabpanels>
            </p-tabs>
        </div>

        <!-- ── Diálogo: Agregar Examen ── -->
        <p-dialog
            header="Registrar resultado de examen"
            [(visible)]="dialogVisible"
            [modal]="true"
            [draggable]="false"
            [dismissableMask]="true"
            [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '36rem' }"
        >
            <div class="dialog-body">

                <!-- Fecha + Hora -->
                <div class="dialog-row">
                    <div class="flex flex-col gap-1 flex-1">
                        <label for="nueva-fecha" class="field-label req">Fecha del examen</label>
                        <input pInputText id="nueva-fecha" type="date" [(ngModel)]="nuevaEntrada.fecha" />
                        <span class="field-hint">Fecha en que se realizó el examen.</span>
                    </div>
                    <div class="flex flex-col gap-1" style="width: 9rem;">
                        <label for="nueva-hora" class="field-label">Hora</label>
                        <input pInputText id="nueva-hora" type="time" [(ngModel)]="nuevaEntrada.hora" />
                        <span class="field-hint">Opcional.</span>
                    </div>
                </div>

                <!-- Tipo de examen -->
                <div class="flex flex-col gap-1">
                    <label for="nueva-tipo" class="field-label">Tipo de examen</label>
                    <input pInputText id="nueva-tipo" [(ngModel)]="nuevaEntrada.tipoExamen"
                        placeholder="Ej.: Hemograma completo" />
                    <span class="field-hint">Ej.: Hemograma completo, Radiografía de tórax, Ecografía abdominal.</span>
                </div>

                <!-- Resultado -->
                <div class="flex flex-col gap-1">
                    <label for="nueva-descripcion" class="field-label req">Resultado / Hallazgos</label>
                    <textarea pTextarea id="nueva-descripcion"
                        [(ngModel)]="nuevaEntrada.descripcion"
                        [rows]="4"
                        placeholder="Transcriba el resultado: valores, hallazgos, interpretación…"></textarea>
                    <span class="field-hint">Resultados, hallazgos o interpretación del examen. Si tiene el informe en papel o PDF, adjúntelo en la pestaña «Archivos Adjuntos».</span>
                </div>

            </div>

            <ng-template pTemplate="footer">
                <p-button
                    label="Cancelar"
                    icon="pi pi-times"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="dialogVisible = false"
                />
                <p-button
                    label="Guardar examen"
                    icon="pi pi-check"
                    (onClick)="guardarEntrada()"
                    [disabled]="!nuevaEntrada.fecha || !nuevaEntrada.descripcion"
                />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }

        /* ── Barra compacta del paciente ── */
        .pac-bar {
            display: flex; justify-content: space-between; align-items: center;
            flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem 1rem;
            background: var(--p-surface-0); border-radius: 0.75rem;
            border: 1px solid var(--p-surface-200);
            border-left: 3px solid var(--p-primary-500);
            margin-bottom: 1.25rem;
        }
        .pac-bar__avatar {
            flex: none; width: 2.4rem; height: 2.4rem; border-radius: 9999px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 0.85rem; color: #fff;
            background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700));
        }
        .pac-bar__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
        .pac-bar__name { font-weight: 700; font-size: 0.9rem; color: var(--p-text-color); }
        .pac-bar__meta { font-size: 0.75rem; color: var(--p-text-muted-color); }
        .pac-bar__badge {
            font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
            padding: 0.2rem 0.55rem; border-radius: 9999px;
            background: var(--p-primary-50); color: var(--p-primary-700);
            border: 1px solid var(--p-primary-200);
        }

        /* ── Acciones al tope de cada tab ── */
        .tab-actions {
            display: flex; align-items: center; justify-content: flex-end;
            gap: 0.5rem; padding: 0.85rem 0 1rem;
        }

        /* ── Lista de exámenes en cards ── */
        .exam-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .exam-card {
            border: 1px solid var(--p-surface-200); border-radius: 0.75rem;
            background: var(--p-surface-0); overflow: hidden;
            transition: box-shadow 0.15s ease;
        }
        .exam-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        :host-context(.app-dark) .exam-card { background: var(--p-surface-900); border-color: var(--p-surface-700); }

        .exam-card__head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0.55rem 0.85rem;
            background: var(--p-surface-50); border-bottom: 1px solid var(--p-surface-200);
        }
        :host-context(.app-dark) .exam-card__head { background: var(--p-surface-800); border-color: var(--p-surface-700); }

        .exam-type-badge {
            display: inline-flex; align-items: center; gap: 0.3rem;
            font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
            padding: 0.15rem 0.5rem; border-radius: 9999px;
            background: var(--p-primary-50); color: var(--p-primary-700);
            border: 1px solid var(--p-primary-200);
        }
        :host-context(.app-dark) .exam-type-badge {
            background: color-mix(in srgb, var(--p-primary-color) 20%, var(--p-surface-800));
            color: var(--p-primary-300); border-color: var(--p-surface-600);
        }

        .exam-date {
            display: inline-flex; align-items: center; gap: 0.3rem;
            font-family: var(--font-mono, ui-monospace); font-size: 0.74rem;
            color: var(--p-text-muted-color);
        }
        .exam-date__time {
            background: var(--p-surface-200); padding: 0.1rem 0.35rem;
            border-radius: 0.3rem; font-size: 0.7rem;
        }
        :host-context(.app-dark) .exam-date__time { background: var(--p-surface-700); }

        .exam-body {
            padding: 0.75rem 0.85rem; font-size: 0.84rem;
            color: var(--p-text-color); white-space: pre-wrap; line-height: 1.55;
        }

        /* ── Grid adjuntos ── */
        .adjuntos-grid {
            display: grid; gap: 1rem;
            grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
        }
        .adjunto-card {
            display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
            padding: 0.85rem 0.65rem; border-radius: 0.7rem;
            border: 1px solid var(--p-surface-200); background: var(--p-surface-50);
        }
        :host-context(.app-dark) .adjunto-card { background: var(--p-surface-800); border-color: var(--p-surface-700); }
        .adjunto-card__img { max-height: 8rem; object-fit: contain; border-radius: 0.4rem; }
        .adjunto-card__pdf {
            display: flex; align-items: center; justify-content: center;
            height: 8rem; width: 100%;
            background: var(--p-surface-100); border-radius: 0.4rem;
        }
        .adjunto-card__pdf .pi { font-size: 2.5rem; color: #e53e3e; }
        :host-context(.app-dark) .adjunto-card__pdf { background: var(--p-surface-700); }
        .adjunto-card__name {
            font-size: 0.75rem; color: var(--p-text-color);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            width: 100%; text-align: center;
        }
        .adjunto-card__date { font-size: 0.68rem; color: var(--p-text-muted-color); }

        /* ── Diálogo ── */
        .dialog-body { display: flex; flex-direction: column; gap: 1.1rem; padding-top: 0.5rem; }
        .dialog-row { display: flex; gap: 0.75rem; }
    `],
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

    nombreCompleto = computed(() => {
        const p = this.paciente();
        return p ? `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}` : 'Paciente';
    });

    initials = computed(() => {
        const p = this.paciente();
        return `${p?.apellidoPaterno?.[0] ?? ''}${p?.nombres?.[0] ?? ''}`.toUpperCase() || 'P';
    });

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
                    detail: 'Resultado de examen registrado correctamente.',
                });
                this.dialogVisible = false;
                this.loadExamenes(pid);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar el examen.',
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
                    detail: `Archivo "${file.name}" adjuntado correctamente.`,
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
            tipoExamen: '',
            descripcion: '',
        };
    }
}
