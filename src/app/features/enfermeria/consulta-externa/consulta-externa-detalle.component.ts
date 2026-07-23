import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { PacienteService } from '@/app/core/services/paciente.service';
import { ConsultaExternaService } from '@/app/core/services/consulta-externa.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { ConsultaExterna, ConstantesBasales, EstadoConsulta } from '@/app/core/models/consulta-externa.model';

type VitalKey = 'fc' | 'fr' | 'temperatura' | 'saturacion' | 'glucemia' | 'peso' | 'talla';
type Estado = 'normal' | 'bajo' | 'alto' | null;

interface VitalCfg {
    key: VitalKey;
    label: string;
    unit: string;
    min?: number;
    max?: number;
    frac?: number;
    rango: string;
    evalua: boolean;
    core?: boolean;
    bajaLbl?: string;
    altaLbl?: string;
    ayuda?: string;
}

@Component({
    selector: 'app-consulta-externa-detalle',
    standalone: true,
    imports: [
        CommonModule, FormsModule, InputNumberModule, InputTextModule, TextareaModule,
        ButtonModule, TagModule, ToastModule, TooltipModule, FormHeaderComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="mx-auto" style="max-width: 1000px;">
            <app-form-header title="Consulta Externa — Constantes Basales" code="FORM. 002"
                [subtitle]="resumen()">
                <button pButton type="button" icon="pi pi-arrow-left" label="Volver"
                    class="p-button-text p-button-sm" (click)="volver()"></button>
            </app-form-header>
        </div>

        <div class="bg-surface-0 dark:bg-surface-900 p-5 md:p-6 doc-sheet mx-auto" style="max-width: 1000px;">

            <!-- Barra compacta del paciente -->
            @if (paciente(); as p) {
                <div class="pac-bar">
                    <div class="pac-bar__avatar">{{ initials() }}</div>
                    <div class="pac-bar__info">
                        <span class="pac-bar__name">{{ nombreCompleto() }}</span>
                        <span class="pac-bar__meta">
                            {{ p.carnetAsegurado || '—' }}
                            @if (p.edad) { · {{ p.edad }} años }
                            · {{ p.sexo === 'M' ? 'Masculino' : 'Femenino' }}
                            @if (p.grado || p.tipoAsegurado) { · {{ p.grado || p.tipoAsegurado }} }
                        </span>
                    </div>
                    <div class="pac-bar__right">
                        @if (consulta(); as c) {
                            <span class="pac-bar__turno">{{ c.numeroTurno }}</span>
                            <p-tag [value]="estadoLabel(c.estado)" [severity]="estadoSeverity(c.estado)" styleClass="text-xs" />
                        }
                    </div>
                </div>
            }

            <!-- Indicador visual de pasos -->
            <div class="step-indicator">
                <div class="step-dot" [class.active]="true">
                    <i class="pi pi-heart-fill"></i>
                </div>
                <div class="step-dot__label" [class.active]="true">Constantes vitales</div>
                <div class="step-line"></div>
                <div class="step-dot" [class.active]="true">
                    <i class="pi pi-clipboard"></i>
                </div>
                <div class="step-dot__label" [class.active]="true">Formulario 002</div>
            </div>

            <!-- ░░ PASO 1 — Constantes vitales ░░ -->
            <div class="form-section">
                <div class="form-section__title">
                    <i class="pi pi-heart-fill"></i>
                    Paso 1 — Constantes Vitales Basales
                    <span class="section-progress" [class.complete]="coreCompletas()">
                        <i class="pi" [class.pi-check-circle]="coreCompletas()" [class.pi-circle]="!coreCompletas()"></i>
                        {{ coreLlenas() }}/5 básicas
                    </span>
                </div>
                <div class="form-section__body">
                    <div class="progress-track">
                        <div class="progress-track__bar">
                            <div class="progress-track__fill" [style.width.%]="progreso()"></div>
                        </div>
                        <span class="progress-track__label">
                            @if (coreCompletas()) {
                                <i class="pi pi-check-circle" style="color: var(--p-primary-600)"></i> Todas las constantes básicas completadas
                            } @else {
                                Faltan {{ 5 - coreLlenas() }} constante(s) básica(s) — PA, FC, FR, Temperatura, SatO&#8322;
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div class="vit-grid">
                <!-- Presión arterial (dos casillas) -->
                <div class="vit" [attr.data-st]="paStatus() ?? 'idle'">
                    <label class="vit__label req">Presión arterial <span class="vit__unit">mmHg</span></label>
                    <div class="flex items-center gap-1">
                        <p-inputnumber [(ngModel)]="c.paSistolica" [min]="0" [max]="300" placeholder="Sist."
                            inputStyleClass="w-full" styleClass="w-full" />
                        <span class="text-muted-color font-bold px-0.5">/</span>
                        <p-inputnumber [(ngModel)]="c.paDiastolica" [min]="0" [max]="200" placeholder="Diast."
                            inputStyleClass="w-full" styleClass="w-full" />
                    </div>
                    <div class="vit__hint" [attr.data-st]="paStatus() ?? 'idle'">
                        <i class="pi" [ngClass]="iconFor(paStatus())"></i> {{ paHint() }}
                    </div>
                </div>

                <!-- Vitales de una casilla -->
                @for (v of vitales; track v.key) {
                    <div class="vit" [attr.data-st]="estado(v) ?? 'idle'">
                        <label class="vit__label" [class.req]="v.core">{{ v.label }} <span class="vit__unit">{{ v.unit }}</span></label>
                        <p-inputnumber [ngModel]="c[v.key] ?? null" (ngModelChange)="setVital(v, $event)"
                            [min]="0" [max]="v.key === 'glucemia' ? 600 : (v.key === 'peso' ? 400 : 300)"
                            [minFractionDigits]="v.frac ?? 0" [maxFractionDigits]="v.frac ?? 0"
                            inputStyleClass="w-full" styleClass="w-full" />
                        <div class="vit__hint" [attr.data-st]="estado(v) ?? 'idle'">
                            <i class="pi" [ngClass]="iconFor(estado(v))"></i> {{ hint(v) }}
                        </div>
                    </div>
                }

                <!-- IMC calculado -->
                <div class="vit">
                    <label class="vit__label">IMC <span class="vit__unit">kg/m²</span></label>
                    <div class="ce-imc">
                        <span class="ce-imc__value tabular">{{ c.imc ? c.imc.toFixed(1) : '—' }}</span>
                        @if (imcCategoria()) {
                            <span class="ce-imc__cat" [class]="'ce-imc__cat--' + imcCategoria()!.tone">{{ imcCategoria()!.label }}</span>
                        }
                    </div>
                    <div class="vit__hint" data-st="idle"><i class="pi pi-calculator"></i> Se calcula con peso y talla</div>
                </div>
            </div>

            <!-- Resumen de alertas -->
            @if (alertas().length) {
                <div class="alert-box">
                    <i class="pi pi-exclamation-triangle alert-box__icon"></i>
                    <div>
                        <div class="alert-box__title">{{ alertas().length }} valor(es) fuera de rango — verifique antes de enviar</div>
                        <ul class="alert-box__list">
                            @for (a of alertas(); track $index) { <li>{{ a }}</li> }
                        </ul>
                    </div>
                </div>
            } @else if (algunDato()) {
                <div class="ok-box"><i class="pi pi-check-circle"></i> Constantes registradas dentro de rango normal.</div>
            }

            <!-- ░░ PASO 2 — Formulario 002 ░░ -->
            <div class="form-section" style="margin-top: 2rem;">
                <div class="form-section__title">
                    <i class="pi pi-clipboard"></i>
                    Paso 2 — Datos de la Consulta (Form. 002)
                </div>
                <div class="form-section__body">
                    <p class="step-desc">Complete el motivo y los antecedentes que el médico necesita conocer.</p>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <!-- Motivo de consulta -->
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Motivo de consulta</label>
                    <textarea pTextarea [(ngModel)]="motivoConsulta" rows="2"
                        placeholder="¿Por qué viene el paciente hoy? Ej.: «Control de presión», «Dolor de garganta hace 3 días»…"></textarea>
                    <span class="field-hint">Razón principal de la consulta en las palabras del paciente.</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Alergias -->
                    <div class="flex flex-col gap-1">
                        <label class="field-label req">Alergias conocidas</label>
                        <input pInputText [(ngModel)]="alergias"
                            placeholder="Ej.: Penicilina. Si no tiene, escriba «NIEGA»." />
                        <span class="field-hint">Alergias conocidas a medicamentos, alimentos u otros. Escribir NIEGA si no hay.</span>
                    </div>
                    <!-- Antecedentes -->
                    <div class="flex flex-col gap-1">
                        <label class="field-label">Antecedentes relevantes</label>
                        <input pInputText [(ngModel)]="antecedentes"
                            placeholder="Ej.: Hipertensión, Diabetes, Asma…" />
                        <span class="field-hint">Enfermedades previas, cirugías, hospitalizaciones relevantes.</span>
                    </div>
                </div>

                <!-- Observaciones -->
                <div class="flex flex-col gap-1">
                    <label class="field-label">Observaciones de enfermería</label>
                    <textarea pTextarea [(ngModel)]="observaciones" rows="2"
                        placeholder="Cualquier dato adicional del triaje basal (estado general, dolor, etc.)"></textarea>
                    <span class="field-hint">Cualquier otro dato clínico relevante para el médico. Al enviar, el registro se firma con su nombre de usuario.</span>
                </div>
            </div>

            <!-- Acciones -->
            <div class="acciones">
                @if (!coreCompletas()) {
                    <span class="acciones__hint">
                        <i class="pi pi-info-circle"></i>
                        Faltan {{ 5 - coreLlenas() }} constante(s) básica(s) (PA, FC, FR, T°, SatO&#8322;) para enviar al médico.
                    </span>
                }
                <div class="flex gap-2">
                    <p-button label="Guardar borrador" icon="pi pi-save" severity="secondary" [outlined]="true"
                        (onClick)="guardar('EN_PREPARACION')" [loading]="saving()" />
                    <p-button label="Enviar al médico" icon="pi pi-send" severity="success"
                        (onClick)="guardar('LISTO_MEDICO')" [loading]="saving()" [disabled]="!coreCompletas()" />
                </div>
            </div>
        </div>
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
        .pac-bar__right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
        .pac-bar__turno {
            font-family: var(--font-mono, ui-monospace); font-weight: 600; font-size: 0.8rem;
            color: var(--p-primary-700); background: var(--p-surface-0);
            padding: 0.2rem 0.55rem; border-radius: 0.45rem; border: 1px solid var(--p-primary-200);
        }
        :host-context(.app-dark) .pac-bar__turno { background: var(--p-surface-800); color: var(--p-primary-200); border-color: var(--p-surface-600); }

        /* ── Indicador de pasos ── */
        .step-indicator {
            display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;
            padding: 0.75rem 1rem; border-radius: 0.75rem;
            background: var(--p-surface-50); border: 1px solid var(--p-surface-200);
        }
        :host-context(.app-dark) .step-indicator { background: var(--p-surface-800); border-color: var(--p-surface-700); }
        .step-dot {
            flex: none; width: 2rem; height: 2rem; border-radius: 9999px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 0.8rem;
            background: var(--p-surface-200); color: var(--p-text-muted-color);
            border: 2px solid var(--p-surface-300);
            transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .step-dot.active {
            background: var(--p-primary-500); color: #fff;
            border-color: var(--p-primary-600);
        }
        .step-dot__label {
            font-size: 0.78rem; font-weight: 600; color: var(--p-text-muted-color);
        }
        .step-dot__label.active { color: var(--p-text-color); }
        .step-line {
            flex: 1; height: 2px; border-radius: 9999px;
            background: var(--p-primary-200);
        }
        :host-context(.app-dark) .step-line { background: var(--p-surface-600); }

        /* ── Secciones de formulario ── */
        .form-section { margin-bottom: 1.5rem; }
        .form-section__title {
            display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem;
            font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--p-primary-600); border-bottom: 1px solid var(--p-surface-200);
            padding-bottom: 0.4rem; margin-bottom: 1rem;
        }
        :host-context(.app-dark) .form-section__title { color: var(--p-primary-300); border-color: var(--p-surface-700); }
        .form-section__body { display: grid; gap: 1rem; }
        .section-progress {
            margin-left: auto; display: inline-flex; align-items: center; gap: 0.3rem;
            font-size: 0.75rem; font-weight: 700; text-transform: none; letter-spacing: 0;
            padding: 0.2rem 0.55rem; border-radius: 9999px;
            background: var(--p-surface-100); color: var(--p-text-muted-color);
            border: 1px solid var(--p-surface-200); transition: all 0.2s;
        }
        .section-progress.complete {
            background: var(--p-primary-50); color: var(--p-primary-700);
            border-color: var(--p-primary-200);
        }
        :host-context(.app-dark) .section-progress { background: var(--p-surface-700); color: var(--p-text-muted-color); border-color: var(--p-surface-600); }
        :host-context(.app-dark) .section-progress.complete { background: color-mix(in srgb, var(--p-primary-color) 20%, var(--p-surface-800)); color: var(--p-primary-300); border-color: var(--p-surface-600); }

        /* ── Barra de progreso de básicas ── */
        .progress-track { display: flex; flex-direction: column; gap: 0.4rem; }
        .progress-track__bar {
            width: 100%; height: 0.55rem; border-radius: 9999px;
            background: var(--p-surface-200); overflow: hidden;
        }
        :host-context(.app-dark) .progress-track__bar { background: var(--p-surface-700); }
        .progress-track__fill {
            height: 100%; border-radius: 9999px;
            background: linear-gradient(90deg, var(--p-primary-400), var(--p-primary-600));
            transition: width 0.3s ease;
        }
        .progress-track__label {
            display: flex; align-items: center; gap: 0.35rem;
            font-size: 0.78rem; color: var(--p-text-muted-color);
        }
        .step-desc { font-size: 0.82rem; color: var(--p-text-muted-color); margin: 0; }

        /* ── Grid de vitales ── */
        .vit-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; margin-bottom: 1rem; }
        @media (min-width: 640px) { .vit-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 980px) { .vit-grid { grid-template-columns: repeat(3, 1fr); } }

        .vit {
            display: flex; flex-direction: column; gap: 0.3rem; padding: 0.65rem 0.7rem;
            border-radius: 0.7rem; border: 1px solid var(--p-surface-200);
            background: var(--p-surface-0); transition: border-color .15s ease, background .15s ease;
        }
        :host-context(.app-dark) .vit { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .vit[data-st="alto"]   { border-color: #f5a3ad; background: #fff5f6; }
        .vit[data-st="bajo"]   { border-color: #9ad0f0; background: #f2f9fe; }
        .vit[data-st="normal"] { border-color: var(--p-primary-200); }
        :host-context(.app-dark) .vit[data-st="alto"]  { background: color-mix(in srgb, #be123c 16%, var(--p-surface-900)); }
        :host-context(.app-dark) .vit[data-st="bajo"]  { background: color-mix(in srgb, #0369a1 16%, var(--p-surface-900)); }

        .vit__label { font-weight: 600; font-size: 0.84rem; color: var(--p-text-color); }
        .vit__unit  { font-family: var(--font-mono, ui-monospace); font-size: 0.68rem; color: var(--p-text-muted-color); font-weight: 500; }
        .vit__hint  { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; font-weight: 600; color: var(--p-text-muted-color); }
        .vit__hint .pi { font-size: 0.7rem; }
        .vit__hint[data-st="normal"] { color: var(--p-primary-700); }
        .vit__hint[data-st="alto"]   { color: #be123c; }
        .vit__hint[data-st="bajo"]   { color: #0369a1; }
        :host-context(.app-dark) .vit__hint[data-st="normal"] { color: var(--p-primary-300); }
        :host-context(.app-dark) .vit__hint[data-st="alto"]   { color: #fda4af; }
        :host-context(.app-dark) .vit__hint[data-st="bajo"]   { color: #7dd3fc; }

        /* ── IMC calculado ── */
        .ce-imc {
            display: flex; align-items: center; gap: 0.6rem; height: 2.6rem; padding: 0 0.75rem;
            border-radius: 0.6rem; background: var(--p-surface-50); border: 1px dashed var(--p-surface-300);
        }
        :host-context(.app-dark) .ce-imc { background: var(--p-surface-800); border-color: var(--p-surface-600); }
        .ce-imc__value { font-family: var(--font-display, sans-serif); font-weight: 700; font-size: 1.3rem; color: var(--p-text-color); }
        .ce-imc__cat   { font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 9999px; }
        .ce-imc__cat--ok   { background: var(--p-primary-50);  color: var(--p-primary-700); }
        .ce-imc__cat--low  { background: #e0f2fe; color: #0369a1; }
        .ce-imc__cat--warn { background: #fef3c7; color: #b45309; }
        .ce-imc__cat--high { background: #ffe4e6; color: #be123c; }

        /* ── Caja de alertas / OK ── */
        .alert-box {
            display: flex; gap: 0.75rem; margin: 1.1rem 0; padding: 0.9rem 1rem;
            border-radius: 0.8rem; background: #fff5f6; border: 1px solid #f5a3ad;
        }
        :host-context(.app-dark) .alert-box {
            background: color-mix(in srgb, #be123c 16%, var(--p-surface-900));
            border-color: color-mix(in srgb, #be123c 40%, var(--p-surface-700));
        }
        .alert-box__icon  { color: #be123c; font-size: 1.2rem; margin-top: 0.1rem; }
        .alert-box__title { font-weight: 700; color: #be123c; font-size: 0.86rem; }
        :host-context(.app-dark) .alert-box__title,
        :host-context(.app-dark) .alert-box__icon  { color: #fda4af; }
        .alert-box__list  { margin: 0.3rem 0 0; padding-left: 1.1rem; font-size: 0.8rem; color: var(--p-text-color); list-style: disc; }

        .ok-box {
            display: flex; align-items: center; gap: 0.5rem; margin: 1.1rem 0; padding: 0.7rem 1rem;
            border-radius: 0.8rem; font-weight: 600; font-size: 0.85rem;
            color: var(--p-primary-700); background: var(--p-primary-50); border: 1px solid var(--p-primary-200);
        }
        :host-context(.app-dark) .ok-box {
            background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900));
            color: var(--p-primary-300); border-color: var(--p-surface-700);
        }

        /* ── Acciones ── */
        .acciones {
            display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end;
            gap: 0.75rem; margin-top: 1.75rem; padding-top: 1.25rem;
            border-top: 1px solid var(--p-surface-200);
        }
        :host-context(.app-dark) .acciones { border-color: var(--p-surface-700); }
        .acciones__hint {
            display: inline-flex; align-items: center; gap: 0.35rem; margin-right: auto;
            font-size: 0.78rem; color: var(--p-text-muted-color);
        }
        .acciones__hint .pi { color: var(--p-primary-500); }
    `]
})
export class ConsultaExternaDetalleComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private service = inject(ConsultaExternaService);
    private pacienteService = inject(PacienteService);
    private messageService = inject(MessageService);

    private routeId = toSignal(
        this.route.paramMap.pipe(map((pm) => (pm.get('id') ? +pm.get('id')! : null))),
        { initialValue: null }
    );
    private loadedId: number | null = null;

    consulta = signal<ConsultaExterna | null>(null);
    paciente = signal<Paciente | null>(null);
    saving = signal(false);

    // Campos editables
    c: ConstantesBasales = {};
    motivoConsulta = '';
    alergias = '';
    antecedentes = '';
    observaciones = '';

    /** Configuración de las constantes de una sola casilla (con rangos normales del adulto). */
    readonly vitales: VitalCfg[] = [
        { key: 'fc', label: 'Frec. cardíaca', unit: 'lpm', min: 60, max: 100, rango: '60–100', evalua: true, core: true, bajaLbl: 'Bradicardia (baja)', altaLbl: 'Taquicardia (alta)' },
        { key: 'fr', label: 'Frec. respiratoria', unit: 'rpm', min: 12, max: 20, rango: '12–20', evalua: true, core: true, bajaLbl: 'Baja', altaLbl: 'Taquipnea (alta)' },
        { key: 'temperatura', label: 'Temperatura', unit: '°C', min: 36, max: 37.5, frac: 1, rango: '36.0–37.5', evalua: true, core: true, bajaLbl: 'Hipotermia', altaLbl: 'Fiebre' },
        { key: 'saturacion', label: 'Saturación O₂', unit: '%', min: 95, max: 100, rango: '≥ 95', evalua: true, core: true, bajaLbl: 'Hipoxemia (baja)', altaLbl: '' },
        { key: 'glucemia', label: 'Glucemia capilar', unit: 'mg/dL', min: 70, max: 140, rango: '70–140', evalua: true, bajaLbl: 'Hipoglucemia', altaLbl: 'Hiperglucemia' },
        { key: 'peso', label: 'Peso', unit: 'kg', frac: 1, rango: '', evalua: false, ayuda: 'Para calcular el IMC' },
        { key: 'talla', label: 'Talla', unit: 'cm', rango: '', evalua: false, ayuda: 'Para calcular el IMC' }
    ];

    nombreCompleto = computed(() => {
        const p = this.paciente();
        return p ? `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}` : 'Paciente';
    });

    initials = computed(() => {
        const p = this.paciente();
        return `${p?.apellidoPaterno?.[0] ?? ''}${p?.nombres?.[0] ?? ''}`.toUpperCase() || 'P';
    });

    resumen = computed(() => {
        const c = this.consulta();
        return c ? `${c.especialidad}${c.medico ? ' · ' + c.medico : ''}` : 'Toma de signos basales y Formulario 002';
    });

    // ── Evaluación de constantes ──────────────────────────────────────────────
    estado(v: VitalCfg): Estado {
        if (!v.evalua) return null;
        const val = this.c[v.key];
        if (val == null) return null;
        if (v.min != null && val < v.min) return 'bajo';
        if (v.max != null && val > v.max) return 'alto';
        return 'normal';
    }

    hint(v: VitalCfg): string {
        if (!v.evalua) return v.ayuda ?? '';
        const st = this.estado(v);
        if (st == null) return `Normal ${v.rango}`;
        if (st === 'normal') return `Normal (${v.rango})`;
        return st === 'bajo' ? (v.bajaLbl || 'Bajo') : (v.altaLbl || 'Alto');
    }

    paStatus(): Estado {
        const s = this.c.paSistolica, d = this.c.paDiastolica;
        if (s == null && d == null) return null;
        if ((s != null && s >= 140) || (d != null && d >= 90)) return 'alto';
        if ((s != null && s < 90) || (d != null && d < 60)) return 'bajo';
        return (s != null && d != null) ? 'normal' : null;
    }

    paHint(): string {
        const st = this.paStatus();
        if (st == null) return 'Normal 90–129 / 60–84';
        if (st === 'alto') return 'Presión elevada';
        if (st === 'bajo') return 'Presión baja';
        return 'Normal';
    }

    iconFor(st: Estado): string {
        if (st === 'alto') return 'pi-arrow-up';
        if (st === 'bajo') return 'pi-arrow-down';
        if (st === 'normal') return 'pi-check';
        return 'pi-info-circle';
    }

    alertas(): string[] {
        const out: string[] = [];
        const pa = this.paStatus();
        if (pa === 'alto') out.push(`PA ${this.c.paSistolica}/${this.c.paDiastolica} mmHg — Elevada`);
        if (pa === 'bajo') out.push(`PA ${this.c.paSistolica}/${this.c.paDiastolica} mmHg — Baja`);
        for (const v of this.vitales) {
            const st = this.estado(v);
            if (st === 'alto') out.push(`${v.label} ${this.c[v.key]} ${v.unit} — ${v.altaLbl || 'Alto'}`);
            if (st === 'bajo') out.push(`${v.label} ${this.c[v.key]} ${v.unit} — ${v.bajaLbl || 'Bajo'}`);
        }
        return out;
    }

    coreLlenas(): number {
        let n = 0;
        if (this.c.paSistolica != null && this.c.paDiastolica != null) n++;
        if (this.c.fc != null) n++;
        if (this.c.fr != null) n++;
        if (this.c.temperatura != null) n++;
        if (this.c.saturacion != null) n++;
        return n;
    }
    coreCompletas(): boolean { return this.coreLlenas() === 5; }
    progreso(): number { return (this.coreLlenas() / 5) * 100; }
    algunDato(): boolean { return this.coreLlenas() > 0 || this.c.glucemia != null; }

    imcCategoria = computed(() => {
        const imc = this.c.imc;
        if (!imc) return null;
        if (imc < 18.5) return { label: 'Bajo peso', tone: 'low' };
        if (imc < 25)   return { label: 'Normal',    tone: 'ok' };
        if (imc < 30)   return { label: 'Sobrepeso', tone: 'warn' };
        return { label: 'Obesidad', tone: 'high' };
    });

    constructor() {
        effect(() => {
            const id = this.routeId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.cargar(id);
        });
    }

    private cargar(id: number): void {
        this.service.getById(id).subscribe({
            next: (consulta) => {
                if (!consulta) {
                    this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'La consulta no existe.' });
                    return;
                }
                this.consulta.set(consulta);
                this.c = { ...(consulta.constantes ?? {}) };
                this.motivoConsulta = consulta.motivoConsulta ?? '';
                this.alergias      = consulta.alergias      ?? '';
                this.antecedentes  = consulta.antecedentes  ?? '';
                this.observaciones = consulta.observaciones ?? '';
                this.recalcImc();
                this.cargarPaciente(consulta.pacienteId);
                if (consulta.estado === 'EN_ESPERA') {
                    this.service.actualizar(id, { estado: 'EN_PREPARACION' }).subscribe((u) => this.consulta.set(u));
                }
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la consulta.' })
        });
    }

    private cargarPaciente(pacienteId: number): void {
        this.pacienteService.getById(pacienteId).subscribe({
            next: (p) => this.paciente.set(p),
            error: () => { /* filiación opcional */ }
        });
    }

    /** Actualiza una constante y recalcula IMC si corresponde. */
    setVital(v: VitalCfg, value: number | null): void {
        (this.c as Record<VitalKey, number | undefined>)[v.key] = value ?? undefined;
        if (v.key === 'peso' || v.key === 'talla') this.recalcImc();
    }

    recalcImc(): void {
        const peso = this.c.peso, tallaCm = this.c.talla;
        if (peso && tallaCm) {
            const m = tallaCm / 100;
            this.c.imc = Math.round((peso / (m * m)) * 10) / 10;
        } else {
            this.c.imc = undefined;
        }
    }

    guardar(estado: EstadoConsulta): void {
        const consulta = this.consulta();
        if (!consulta?.id) return;
        if (estado === 'LISTO_MEDICO' && !this.coreCompletas()) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan constantes', detail: 'Registre PA, FC, FR, Tº y SatO₂ antes de enviar al médico.' });
            return;
        }
        this.saving.set(true);
        const now = new Date();
        const payload: Partial<ConsultaExterna> = {
            constantes: { ...this.c },
            motivoConsulta: this.motivoConsulta.trim() || undefined,
            alergias:       this.alergias.trim()       || undefined,
            antecedentes:   this.antecedentes.trim()   || undefined,
            observaciones:  this.observaciones.trim()  || undefined,
            estado,
            horaConstantes: consulta.horaConstantes || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            enfermeraNombre: consulta.enfermeraNombre || this.usuarioActual()
        };
        this.service.actualizar(consulta.id, payload).subscribe({
            next: (saved) => {
                this.consulta.set(saved);
                this.saving.set(false);
                if (estado === 'LISTO_MEDICO') {
                    this.messageService.add({ severity: 'success', summary: 'Enviado al médico', detail: `${saved.numeroTurno} listo para atención.` });
                    setTimeout(() => this.volver(), 700);
                } else {
                    this.messageService.add({ severity: 'success', summary: 'Borrador guardado', detail: 'Las constantes se guardaron.' });
                }
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' });
            }
        });
    }

    private usuarioActual(): string {
        try {
            const raw = localStorage.getItem('user_data');
            return raw ? (JSON.parse(raw).name ?? '') : '';
        } catch { return ''; }
    }

    volver(): void { this.router.navigate(['/app/enfermeria/consulta-externa']); }

    estadoLabel(e: EstadoConsulta): string {
        return { EN_ESPERA: 'En espera', EN_PREPARACION: 'En preparación', LISTO_MEDICO: 'Listo p/ médico', ATENDIDO: 'Atendido' }[e];
    }

    estadoSeverity(e: EstadoConsulta): 'warn' | 'info' | 'success' | 'secondary' {
        return ({ EN_ESPERA: 'warn', EN_PREPARACION: 'info', LISTO_MEDICO: 'success', ATENDIDO: 'secondary' } as const)[e];
    }
}
