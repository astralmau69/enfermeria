import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PacienteService } from '@/app/core/services/paciente.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { EvolucionService } from '@/app/core/services/evolucion.service';
import { EntradaEvolucion } from '@/app/core/models/evolucion.model';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

@Component({
    selector: 'app-evolucion',
    standalone: true,
    imports: [
        FormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        ToastModule,
        FormHeaderComponent,
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header
            title="Evolución y Tratamiento"
            code="HC·M-007"
            subtitle="Nota clínica diaria — Subjetivo · Objetivo · Análisis · Plan" />

        <!-- ── Barra paciente ─────────────────────────────────────────────── -->
        @if (paciente()) {
            <div class="pac-bar">
                <div class="pac-bar__left">
                    <i class="pi pi-user"></i>
                    <strong>{{ paciente()!.apellidoPaterno }} {{ paciente()!.apellidoMaterno }}</strong>
                    <span class="sep">·</span>
                    <span>{{ paciente()!.nombres }}</span>
                </div>
                <div class="pac-bar__right">
                    <span class="form-code">HC·M-007</span>
                    <span>Evolución y Tratamiento</span>
                </div>
            </div>
        }

        <!-- ── Boton nueva entrada ────────────────────────────────────────── -->
        <div class="action-bar">
            <p-button
                label="Nueva Entrada"
                icon="pi pi-plus"
                size="small"
                (onClick)="openDialog()"
            />
        </div>

        <!-- ── Timeline ───────────────────────────────────────────────────── -->
        <div class="timeline">
            @for (entrada of entradas(); track $index) {
                <div class="tl-item" [class]="'tl-item--' + getTurno(entrada.hora)">
                    <div class="tl-dot"></div>
                    <div class="tl-card">
                        <div class="tl-card__head">
                            <span class="tl-fecha">{{ entrada.fecha }} · {{ entrada.hora }}</span>
                            <span class="tl-turno-badge tl-turno-badge--{{ getTurno(entrada.hora) }}">
                                {{ getTurnoLabel(entrada.hora) }}
                            </span>
                            <span class="tl-firma">{{ entrada.medicoNombre ?? '—' }}</span>
                        </div>

                        <div class="soap-grid">
                            <div class="soap-block soap-block--s">
                                <span class="soap-block__eyebrow">S — Subjetivo</span>
                                <p class="soap-block__body">{{ entrada.subjetivo || '—' }}</p>
                            </div>
                            <div class="soap-block soap-block--o">
                                <span class="soap-block__eyebrow">O — Objetivo</span>
                                <p class="soap-block__body">{{ entrada.objetivo || '—' }}</p>
                            </div>
                            <div class="soap-block soap-block--a">
                                <span class="soap-block__eyebrow">A — Análisis</span>
                                <p class="soap-block__body">{{ entrada.analisis || '—' }}</p>
                            </div>
                            <div class="soap-block soap-block--p">
                                <span class="soap-block__eyebrow">P — Plan</span>
                                <p class="soap-block__body">{{ entrada.plan || '—' }}</p>
                            </div>
                        </div>

                        @if (entrada.tratamiento) {
                            <div class="tl-tratamiento">
                                <span class="tl-tratamiento__label">Tratamiento</span>
                                <p class="tl-tratamiento__body">{{ entrada.tratamiento }}</p>
                            </div>
                        }
                    </div>
                </div>
            } @empty {
                <div class="empty-state">
                    <i class="pi pi-list"></i>
                    <span class="empty-state__title">Sin evoluciones registradas</span>
                    <span>Usá «Nueva Entrada» para escribir la primera nota SOAP.</span>
                </div>
            }
        </div>

        <!-- ── Dialog nueva entrada ───────────────────────────────────────── -->
        <p-dialog
            header="Nueva entrada de evolución"
            [(visible)]="dialogVisible"
            [modal]="true"
            [draggable]="false"
            [dismissableMask]="true"
            [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '44rem' }"
            [closable]="true"
        >
            <div class="dialog-body">

                <!-- Turno selector -->
                <div class="turno-opts">
                    <button
                        type="button"
                        class="turno-btn turno-btn--manana"
                        [class.turno-btn--active]="turno === 'manana'"
                        (click)="setTurno('manana')"
                    >
                        <i class="pi pi-sun"></i>
                        Mañana
                        <span class="hora-hint">07:00 – 13:59</span>
                    </button>
                    <button
                        type="button"
                        class="turno-btn turno-btn--tarde"
                        [class.turno-btn--active]="turno === 'tarde'"
                        (click)="setTurno('tarde')"
                    >
                        <i class="pi pi-cloud-sun"></i>
                        Tarde
                        <span class="hora-hint">14:00 – 20:59</span>
                    </button>
                    <button
                        type="button"
                        class="turno-btn turno-btn--noche"
                        [class.turno-btn--active]="turno === 'noche'"
                        (click)="setTurno('noche')"
                    >
                        <i class="pi pi-moon"></i>
                        Noche
                        <span class="hora-hint">21:00 – 06:59</span>
                    </button>
                </div>

                <!-- Fecha y hora -->
                <div class="field-row">
                    <div class="field-col">
                        <label for="fechaIso" class="field-label req">Fecha</label>
                        <input
                            pInputText
                            id="fechaIso"
                            type="date"
                            [(ngModel)]="nuevaEntrada.fechaIso"
                        />
                    </div>
                    <div class="field-col field-col--narrow">
                        <label for="hora" class="field-label req">Hora</label>
                        <input
                            pInputText
                            id="hora"
                            type="time"
                            [(ngModel)]="nuevaEntrada.hora"
                        />
                    </div>
                </div>

                <!-- S — Subjetivo -->
                <div class="field-group">
                    <label for="subjetivo" class="field-label req soap-label soap-label--s">
                        S &mdash; Subjetivo
                    </label>
                    <textarea
                        pTextarea
                        id="subjetivo"
                        [(ngModel)]="nuevaEntrada.subjetivo"
                        rows="3"
                        class="w-full"
                        placeholder="Lo que el paciente refiere…"
                    ></textarea>
                    <span class="field-hint">Lo que el paciente refiere: dolor, molestias, estado general.</span>
                </div>

                <!-- O — Objetivo -->
                <div class="field-group">
                    <label for="objetivo" class="field-label req soap-label soap-label--o">
                        O &mdash; Objetivo
                    </label>
                    <textarea
                        pTextarea
                        id="objetivo"
                        [(ngModel)]="nuevaEntrada.objetivo"
                        rows="3"
                        class="w-full"
                        placeholder="Hallazgos del examen físico…"
                    ></textarea>
                    <span class="field-hint">Hallazgos del examen físico, signos vitales, laboratorio.</span>
                </div>

                <!-- A — Análisis -->
                <div class="field-group">
                    <label for="analisis" class="field-label req soap-label soap-label--a">
                        A &mdash; Análisis
                    </label>
                    <textarea
                        pTextarea
                        id="analisis"
                        [(ngModel)]="nuevaEntrada.analisis"
                        rows="3"
                        class="w-full"
                        placeholder="Diagnóstico o diagnóstico diferencial…"
                    ></textarea>
                    <span class="field-hint">Diagnóstico o diagnóstico diferencial según subjetivo y objetivo.</span>
                </div>

                <!-- P — Plan -->
                <div class="field-group">
                    <label for="plan" class="field-label req soap-label soap-label--p">
                        P &mdash; Plan
                    </label>
                    <textarea
                        pTextarea
                        id="plan"
                        [(ngModel)]="nuevaEntrada.plan"
                        rows="3"
                        class="w-full"
                        placeholder="Conducta: tratamiento, indicaciones, interconsultas…"
                    ></textarea>
                    <span class="field-hint">Conducta: tratamiento, indicaciones, interconsultas.</span>
                </div>

                <!-- Tratamiento -->
                <div class="field-group">
                    <label for="tratamiento" class="field-label soap-label soap-label--t">
                        Tratamiento
                    </label>
                    <textarea
                        pTextarea
                        id="tratamiento"
                        [(ngModel)]="nuevaEntrada.tratamiento"
                        rows="3"
                        class="w-full"
                        placeholder="Medicación indicada con dosis y frecuencia…"
                    ></textarea>
                    <span class="field-hint">Medicación indicada con dosis y frecuencia.</span>
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
                        (onClick)="guardarEntrada()"
                        [disabled]="!esFormularioValido()"
                    />
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        /* ── Barra paciente ─────────────────────────────────────────────── */
        .pac-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.65rem 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid #0d9488;
            background: var(--p-surface-0);
            border-radius: 0 0.65rem 0.65rem 0;
            border-top: 1px solid var(--p-surface-200);
            border-right: 1px solid var(--p-surface-200);
            border-bottom: 1px solid var(--p-surface-200);
            font-size: 0.9rem;
        }
        :host-context(.app-dark) .pac-bar {
            background: var(--p-surface-900);
            border-color: var(--p-surface-700);
            border-left-color: #0d9488;
        }
        .pac-bar__left {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
        }
        .pac-bar__left i { color: #0d9488; }
        .pac-bar__right {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: var(--p-text-muted-color);
        }
        .sep { color: var(--p-text-muted-color); }

        /* ── Código formulario ──────────────────────────────────────────── */
        .form-code {
            font-family: var(--font-mono, monospace);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.15rem 0.5rem;
            border-radius: 0.4rem;
            background: color-mix(in srgb, #0d9488 12%, transparent);
            color: #0d9488;
            border: 1px solid color-mix(in srgb, #0d9488 30%, transparent);
        }

        /* ── Barra de acción ─────────────────────────────────────────────── */
        .action-bar {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 1rem;
        }

        /* ── Timeline ────────────────────────────────────────────────────── */
        .timeline {
            display: flex;
            flex-direction: column;
            gap: 0;
            padding-left: 1.5rem;
            border-left: 2px solid var(--p-surface-300);
            margin-left: 0.5rem;
        }
        :host-context(.app-dark) .timeline { border-left-color: var(--p-surface-600); }

        .tl-item {
            position: relative;
            padding: 0 0 1.5rem 1.5rem;
        }
        .tl-item:last-child { padding-bottom: 0; }

        /* Dot */
        .tl-dot {
            position: absolute;
            left: -1.625rem;
            top: 0.75rem;
            width: 1.05rem;
            height: 1.05rem;
            border-radius: 50%;
            background: var(--p-surface-400);
            border: 3px solid var(--p-surface-0);
            box-shadow: 0 0 0 2px var(--p-surface-300);
        }
        :host-context(.app-dark) .tl-dot {
            border-color: var(--p-surface-900);
            box-shadow: 0 0 0 2px var(--p-surface-600);
        }
        .tl-item--manana .tl-dot { background: #0d9488; box-shadow: 0 0 0 2px color-mix(in srgb, #0d9488 30%, transparent); }
        .tl-item--tarde   .tl-dot { background: #d97706; box-shadow: 0 0 0 2px color-mix(in srgb, #d97706 30%, transparent); }
        .tl-item--noche   .tl-dot { background: #4f46e5; box-shadow: 0 0 0 2px color-mix(in srgb, #4f46e5 30%, transparent); }

        /* Card */
        .tl-card {
            background: var(--p-surface-0);
            border: 1px solid var(--p-surface-200);
            border-radius: 0.85rem;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 6px 18px -10px rgba(0,0,0,.15);
        }
        :host-context(.app-dark) .tl-card {
            background: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }

        /* Card head */
        .tl-card__head {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.65rem 1rem;
            border-bottom: 1px solid var(--p-surface-200);
            background: var(--p-surface-50);
            flex-wrap: wrap;
        }
        :host-context(.app-dark) .tl-card__head {
            background: var(--p-surface-800);
            border-bottom-color: var(--p-surface-700);
        }
        .tl-fecha {
            font-family: var(--font-mono, monospace);
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--p-text-color);
            flex: 1;
        }
        .tl-turno-badge {
            font-size: 0.7rem;
            font-weight: 700;
            padding: 0.15rem 0.55rem;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .tl-turno-badge--manana { background: color-mix(in srgb, #0d9488 14%, transparent); color: #0d9488; }
        .tl-turno-badge--tarde  { background: color-mix(in srgb, #d97706 14%, transparent); color: #b45309; }
        .tl-turno-badge--noche  { background: color-mix(in srgb, #4f46e5 14%, transparent); color: #4338ca; }
        .tl-firma {
            font-size: 0.8rem;
            color: var(--p-text-muted-color);
            font-style: italic;
        }

        /* SOAP grid */
        .soap-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
        }
        @media (max-width: 600px) {
            .soap-grid { grid-template-columns: 1fr; }
        }
        .soap-block {
            padding: 0.75rem 1rem;
            border-right: 1px solid var(--p-surface-200);
            border-bottom: 1px solid var(--p-surface-200);
        }
        .soap-block:nth-child(even) { border-right: none; }
        .soap-block:nth-last-child(-n+2) { border-bottom: none; }
        :host-context(.app-dark) .soap-block {
            border-color: var(--p-surface-700);
        }
        .soap-block__eyebrow {
            display: block;
            font-size: 0.68rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.3rem;
        }
        .soap-block--s .soap-block__eyebrow { color: #1d4ed8; }
        .soap-block--o .soap-block__eyebrow { color: #15803d; }
        .soap-block--a .soap-block__eyebrow { color: #b45309; }
        .soap-block--p .soap-block__eyebrow { color: #0f766e; }
        .soap-block__body {
            margin: 0;
            font-size: 0.85rem;
            line-height: 1.5;
            color: var(--p-text-color);
            white-space: pre-wrap;
        }

        /* Tratamiento */
        .tl-tratamiento {
            padding: 0.65rem 1rem;
            border-top: 1px solid var(--p-surface-200);
            background: var(--p-surface-50);
        }
        :host-context(.app-dark) .tl-tratamiento {
            background: var(--p-surface-800);
            border-top-color: var(--p-surface-700);
        }
        .tl-tratamiento__label {
            font-size: 0.68rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #7c3aed;
            display: block;
            margin-bottom: 0.2rem;
        }
        .tl-tratamiento__body {
            margin: 0;
            font-size: 0.84rem;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        /* ── Dialog ─────────────────────────────────────────────────────── */
        .dialog-body {
            display: flex;
            flex-direction: column;
            gap: 1.1rem;
            padding-top: 0.25rem;
        }

        /* Turno opts */
        .turno-opts {
            display: flex;
            gap: 0.5rem;
        }
        .turno-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.2rem;
            padding: 0.65rem 0.5rem;
            border-radius: 0.65rem;
            border: 2px solid var(--p-surface-300);
            background: var(--p-surface-0);
            cursor: pointer;
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--p-text-color);
            transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        :host-context(.app-dark) .turno-btn {
            background: var(--p-surface-800);
            border-color: var(--p-surface-600);
        }
        .turno-btn i { font-size: 1.2rem; }
        .hora-hint { font-size: 0.68rem; font-weight: 400; color: var(--p-text-muted-color); }

        .turno-btn--manana.turno-btn--active {
            border-color: #0d9488;
            background: color-mix(in srgb, #0d9488 10%, transparent);
            color: #0d9488;
        }
        .turno-btn--tarde.turno-btn--active {
            border-color: #d97706;
            background: color-mix(in srgb, #d97706 10%, transparent);
            color: #b45309;
        }
        .turno-btn--noche.turno-btn--active {
            border-color: #4f46e5;
            background: color-mix(in srgb, #4f46e5 10%, transparent);
            color: #4338ca;
        }
        .turno-btn:hover:not(.turno-btn--active) {
            border-color: var(--p-primary-color);
            background: var(--p-primary-50);
        }

        /* Fecha / hora row */
        .field-row {
            display: flex;
            gap: 0.75rem;
        }
        .field-col { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
        .field-col--narrow { flex: 0 0 9rem; }

        /* Field group */
        .field-group { display: flex; flex-direction: column; gap: 0.3rem; }

        /* SOAP label colours in dialog */
        .soap-label { font-size: 0.82rem; }
        .soap-label--s { color: #1d4ed8; }
        .soap-label--o { color: #15803d; }
        .soap-label--a { color: #b45309; }
        .soap-label--p { color: #0f766e; }
        .soap-label--t { color: #7c3aed; }
    `]
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
    turno: 'manana' | 'tarde' | 'noche' = 'manana';
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

    // ── Turno helpers ───────────────────────────────────────────────────────

    getTurno(hora: string): 'manana' | 'tarde' | 'noche' {
        const h = parseInt(hora.split(':')[0] ?? '0', 10);
        return h >= 7 && h < 14 ? 'manana' : h >= 14 && h < 21 ? 'tarde' : 'noche';
    }

    getTurnoLabel(hora: string): string {
        return ({ manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' })[this.getTurno(hora)];
    }

    setTurno(t: 'manana' | 'tarde' | 'noche'): void {
        this.turno = t;
        const defaults: Record<string, string> = {
            manana: '07:00',
            tarde: '14:00',
            noche: '21:00',
        };
        this.nuevaEntrada.hora = defaults[t] ?? '07:00';
    }

    // ── Dialog ──────────────────────────────────────────────────────────────

    openDialog(): void {
        this.nuevaEntrada = this.crearEntradaVacia();
        const currentHora = this.nuevaEntrada.hora;
        this.turno = this.getTurno(currentHora);
        this.dialogVisible = true;
    }

    esFormularioValido(): boolean {
        return !!(
            this.nuevaEntrada.fechaIso &&
            this.nuevaEntrada.hora &&
            (this.nuevaEntrada.subjetivo?.trim() ||
             this.nuevaEntrada.objetivo?.trim() ||
             this.nuevaEntrada.analisis?.trim() ||
             this.nuevaEntrada.plan?.trim())
        );
    }

    guardarEntrada(): void {
        const pid = this.pacienteId();
        if (!pid) return;

        if (!this.esFormularioValido()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Debe completar al menos un campo SOAP.'
            });
            return;
        }

        const entrada: EntradaEvolucion = {
            fecha: this.isoToDDMMYYYY(this.nuevaEntrada.fechaIso),
            hora: this.nuevaEntrada.hora,
            subjetivo: this.nuevaEntrada.subjetivo,
            objetivo: this.nuevaEntrada.objetivo,
            analisis: this.nuevaEntrada.analisis,
            plan: this.nuevaEntrada.plan,
            tratamiento: this.nuevaEntrada.tratamiento,
        };

        this.evolucionService.addEntradaEvolucion(pid, entrada).subscribe({
            next: (saved) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: 'Entrada de evolución registrada correctamente.'
                });
                this.dialogVisible = false;
                const updated = [saved, ...this.entradas()].sort(
                    (a, b) => this.toSortKey(b) - this.toSortKey(a)
                );
                this.entradas.set(updated);
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

    // ── Loaders ─────────────────────────────────────────────────────────────

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (data) => this.paciente.set(data),
            error: () => console.error('Error loading paciente')
        });
    }

    private loadEvolucion(pacienteId: number): void {
        this.evolucionService.getEvolucionByPaciente(pacienteId).subscribe({
            next: (data) => {
                const sorted = [...(data.entradas ?? [])].sort(
                    (a, b) => this.toSortKey(b) - this.toSortKey(a)
                );
                this.entradas.set(sorted);
            },
            error: () => this.entradas.set([])
        });
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private crearEntradaVacia(): EntradaEvolucionForm {
        const now = new Date();
        const hora = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');
        const y = now.getFullYear();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        const d = now.getDate().toString().padStart(2, '0');
        return {
            fechaIso: `${y}-${m}-${d}`,
            hora,
            subjetivo: '',
            objetivo: '',
            analisis: '',
            plan: '',
            tratamiento: '',
        };
    }

    private isoToDDMMYYYY(iso: string): string {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    }

    private toSortKey(entry: EntradaEvolucion): number {
        const parts = entry.fecha.split('/');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${entry.hora || '00:00'}`).getTime();
        }
        return 0;
    }
}

interface EntradaEvolucionForm {
    fechaIso: string;
    hora: string;
    subjetivo: string;
    objetivo: string;
    analisis: string;
    plan: string;
    tratamiento: string;
}
