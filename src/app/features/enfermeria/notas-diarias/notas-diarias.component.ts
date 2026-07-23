import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { PacienteService } from '@/app/core/services/paciente.service';
import { EnfermeriaService } from '@/app/core/services/enfermeria.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { NotaDiariaEnfermeria, EntradaNotaEnfermeria } from '@/app/core/models/enfermeria.model';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

type Turno = 'manana' | 'tarde' | 'noche';

@Component({
    selector: 'app-notas-diarias',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        ToastModule,
        SelectButtonModule,
        FormHeaderComponent,
    ],
    providers: [MessageService],
    styles: [`
        /* ── Patient info bar ─────────────────────────────────────────────── */
        .pac-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: var(--p-surface-0);
            border-radius: 0.75rem;
            border: 1px solid var(--p-surface-200);
            border-left: 3px solid var(--p-primary-500);
            box-shadow: 0 1px 3px rgba(0,0,0,.06);
            margin-bottom: 1rem;
        }
        .pac-bar__left {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
        .pac-bar__left .pi { color: var(--p-primary-500); font-size: 1rem; }
        .pac-bar .sep { color: var(--p-text-muted-color); }
        .pac-bar__right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.78rem;
            color: var(--p-text-muted-color);
        }
        .pac-bar__right span:first-child {
            font-family: var(--font-mono, monospace);
            font-weight: 700;
            color: var(--p-primary-600);
            background: color-mix(in srgb, var(--p-primary-500) 10%, transparent);
            padding: 0.15rem 0.45rem;
            border-radius: 0.35rem;
        }

        /* ── Timeline ─────────────────────────────────────────────────────── */
        .timeline {
            position: relative;
            padding-left: 2rem;
            border-left: 2px solid var(--p-surface-200);
        }
        .tl-item {
            position: relative;
            padding: 0 0 1rem 1.25rem;
        }
        .tl-dot {
            position: absolute;
            left: -0.5rem;
            top: 0.35rem;
            width: 0.85rem;
            height: 0.85rem;
            border-radius: 9999px;
            background: var(--p-primary-500);
            border: 2px solid white;
            box-shadow: 0 0 0 2px var(--p-surface-200);
        }
        .tl-item--manana .tl-dot { background: #0d9488; }
        .tl-item--tarde  .tl-dot { background: #d97706; }
        .tl-item--noche  .tl-dot { background: #4f46e5; }

        .tl-card {
            background: var(--p-surface-0);
            border: 1px solid var(--p-surface-200);
            border-radius: 0.75rem;
            padding: 0.85rem 1rem;
            transition: box-shadow .15s ease;
        }
        .tl-card:hover { box-shadow: 0 4px 12px -4px rgba(0,0,0,.12); }
        .app-dark .tl-card { border-color: var(--p-surface-700); }

        .tl-card__head {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem 0.75rem;
        }
        .tl-fecha {
            font-family: var(--font-mono, monospace);
            font-size: 0.75rem;
            color: var(--p-text-muted-color);
        }
        .tl-turno-badge {
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            padding: 0.1rem 0.45rem;
            border-radius: 9999px;
        }
        .tl-item--manana .tl-turno-badge {
            background: color-mix(in srgb, #0d9488 14%, transparent);
            color: #0d9488;
        }
        .tl-item--tarde .tl-turno-badge {
            background: color-mix(in srgb, #d97706 14%, transparent);
            color: #b45309;
        }
        .tl-item--noche .tl-turno-badge {
            background: color-mix(in srgb, #4f46e5 14%, transparent);
            color: #4f46e5;
        }
        .tl-proc {
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--p-text-color);
        }
        .tl-firma {
            margin-left: auto;
            font-size: 0.72rem;
            color: var(--p-text-muted-color);
            font-style: italic;
        }
        .tl-desc {
            margin-top: 0.5rem;
            font-size: 0.855rem;
            line-height: 1.55;
            white-space: pre-wrap;
            color: var(--p-text-color);
            margin-bottom: 0;
        }

        /* ── Turno selector buttons ───────────────────────────────────────── */
        .turno-opts {
            display: flex;
            gap: 0.5rem;
        }
        .turno-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            padding: 0.6rem 0.5rem;
            border-radius: 0.65rem;
            border: 2px solid var(--p-surface-200);
            background: var(--p-surface-50);
            cursor: pointer;
            font-size: 0.78rem;
            font-weight: 600;
            transition: border-color .15s, background .15s, color .15s;
            color: var(--p-text-muted-color);
        }
        .turno-btn i { font-size: 1.1rem; }
        .turno-btn--manana.turno-btn--active {
            border-color: #0d9488;
            background: color-mix(in srgb, #0d9488 10%, var(--p-surface-0));
            color: #0d9488;
        }
        .turno-btn--tarde.turno-btn--active {
            border-color: #d97706;
            background: color-mix(in srgb, #d97706 10%, var(--p-surface-0));
            color: #b45309;
        }
        .turno-btn--noche.turno-btn--active {
            border-color: #4f46e5;
            background: color-mix(in srgb, #4f46e5 10%, var(--p-surface-0));
            color: #4f46e5;
        }
        .hora-hint {
            font-size: 0.72rem;
            color: var(--p-text-muted-color);
            margin-top: 0.2rem;
        }
    `],
    template: `
    <p-toast />

    <div class="mx-auto" style="max-width: 1000px;">
        <app-form-header
            title="Notas Diarias de Enfermería"
            code="HCE-004"
            subtitle="Descripción de síntomas observados por turno" />
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 p-6 doc-sheet mx-auto" style="max-width: 1000px;">

        <!-- ===== COMPACT PATIENT BAR ===== -->
        <div class="pac-bar">
            <div class="pac-bar__left">
                <i class="pi pi-user"></i>
                <strong>{{ paciente()?.apellidoPaterno }} {{ paciente()?.apellidoMaterno }}
                    @if (paciente()?.apellidoEsposo) { · {{ paciente()?.apellidoEsposo }} }
                </strong>
                <span class="sep">·</span>
                <span>{{ paciente()?.nombres }}</span>
                @if (paciente()?.carnetAsegurado) {
                    <span class="sep">·</span>
                    <span class="font-mono text-xs">{{ paciente()?.carnetAsegurado }}</span>
                }
            </div>
            <div class="pac-bar__right">
                <span>HCE-004</span>
                <span>Notas Diarias de Enfermería</span>
                @if (notaDiaria()?.servicioSala) {
                    <span>{{ notaDiaria()?.servicioSala }}</span>
                }
                @if (notaDiaria()?.cama) {
                    <span>Cama {{ notaDiaria()?.cama }}</span>
                }
            </div>
        </div>

        <!-- Action bar -->
        <div class="flex justify-end mb-4">
            <p-button
                label="Nueva Nota"
                icon="pi pi-plus"
                size="small"
                (onClick)="abrirDialogNuevaNota()"
            />
        </div>

        <!-- ===== TIMELINE ===== -->
        <div class="timeline">
            @for (entrada of entradas(); track $index) {
                <div class="tl-item" [class]="'tl-item--' + getTurno(entrada.hora)">
                    <div class="tl-dot"></div>
                    <div class="tl-card">
                        <div class="tl-card__head">
                            <span class="tl-fecha">{{ entrada.fecha }} &nbsp; {{ entrada.hora }}</span>
                            <span class="tl-turno-badge">{{ getTurnoLabel(entrada.hora) }}</span>
                            <span class="tl-proc">{{ entrada.procedente }}</span>
                            <span class="tl-firma">{{ entrada.enfermeraNombre ?? '—' }}</span>
                        </div>
                        <p class="tl-desc">{{ entrada.descripcionSintomas }}</p>
                    </div>
                </div>
            } @empty {
                <div class="empty-state">
                    <i class="pi pi-pencil"></i>
                    <span class="empty-state__title">Aún no hay notas para este paciente</span>
                    <span>Usá «Nueva Nota» para registrar la primera observación del turno.</span>
                </div>
            }
        </div>

    </div>

    <!-- ===== DIALOG NUEVA NOTA ===== -->
    <p-dialog
        header="Nueva nota de enfermería"
        [(visible)]="dialogVisible"
        [modal]="true"
        [draggable]="false"
        [dismissableMask]="true"
        [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
        [style]="{ width: '36rem' }"
        [closable]="true"
    >
        <div class="flex flex-col gap-4 pt-2">

            <!-- Turno selector -->
            <div class="flex flex-col gap-2">
                <label class="field-label req">Turno</label>
                <div class="turno-opts">
                    <button
                        type="button"
                        class="turno-btn turno-btn--manana"
                        [class.turno-btn--active]="nuevaEntrada.turno === 'manana'"
                        (click)="seleccionarTurno('manana')"
                    >
                        <i class="pi pi-sun"></i>
                        Mañana
                        <span class="hora-hint">07:00 – 13:59</span>
                    </button>
                    <button
                        type="button"
                        class="turno-btn turno-btn--tarde"
                        [class.turno-btn--active]="nuevaEntrada.turno === 'tarde'"
                        (click)="seleccionarTurno('tarde')"
                    >
                        <i class="pi pi-cloud-sun"></i>
                        Tarde
                        <span class="hora-hint">14:00 – 20:59</span>
                    </button>
                    <button
                        type="button"
                        class="turno-btn turno-btn--noche"
                        [class.turno-btn--active]="nuevaEntrada.turno === 'noche'"
                        (click)="seleccionarTurno('noche')"
                    >
                        <i class="pi pi-moon"></i>
                        Noche
                        <span class="hora-hint">21:00 – 06:59</span>
                    </button>
                </div>
            </div>

            <!-- Fecha + Hora row -->
            <div class="flex gap-3">
                <div class="flex flex-col gap-1 flex-1">
                    <label for="fechaIso" class="field-label req">Fecha</label>
                    <input
                        pInputText
                        id="fechaIso"
                        type="date"
                        [(ngModel)]="nuevaEntrada.fechaIso"
                    />
                </div>
                <div class="flex flex-col gap-1 w-44">
                    <label for="hora" class="field-label">Hora</label>
                    <input pInputText id="hora" [(ngModel)]="nuevaEntrada.hora" type="time" />
                    <span class="hora-hint">Se ajusta automáticamente al turno</span>
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

    getTurno(hora: string): Turno {
        const h = parseInt(hora.split(':')[0] ?? '0', 10);
        return h >= 7 && h < 14 ? 'manana' : h >= 14 && h < 21 ? 'tarde' : 'noche';
    }

    getTurnoLabel(hora: string): string {
        return ({ manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' } as Record<Turno, string>)[this.getTurno(hora)];
    }

    seleccionarTurno(turno: Turno): void {
        this.nuevaEntrada.turno = turno;
        const horaDefecto: Record<Turno, string> = {
            manana: '08:00',
            tarde: '15:00',
            noche: '21:00',
        };
        this.nuevaEntrada.hora = horaDefecto[turno];
    }

    private cargarPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (paciente) => {
                this.paciente.set(paciente);
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
            this.nuevaEntrada.fechaIso?.trim() &&
            this.nuevaEntrada.hora &&
            this.nuevaEntrada.turno &&
            this.nuevaEntrada.procedente?.trim() &&
            this.nuevaEntrada.descripcionSintomas?.trim()
        );
    }

    guardarNota(): void {
        if (!this.esFormularioValido()) return;

        const fechaDDMMYYYY = this.isoToDDMMYYYY(this.nuevaEntrada.fechaIso);

        const entrada: EntradaNotaEnfermeria = {
            fecha: fechaDDMMYYYY,
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
        const horaActual = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const turno = this.getTurno(horaActual);
        const horaDefecto: Record<Turno, string> = { manana: '08:00', tarde: '15:00', noche: '21:00' };
        return {
            fechaIso: now.toISOString().slice(0, 10),
            fecha: '',
            hora: horaDefecto[turno],
            turno,
            procedente: '',
            descripcionSintomas: '',
        };
    }

    private isoToDDMMYYYY(iso: string): string {
        const parts = iso.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return iso;
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
    fechaIso: string;
    fecha: string;
    hora: string;
    turno: Turno;
    procedente: string;
    descripcionSintomas: string;
}
