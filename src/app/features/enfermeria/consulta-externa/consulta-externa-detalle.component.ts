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
    min?: number;          // límite inferior del rango normal
    max?: number;          // límite superior del rango normal
    frac?: number;         // decimales del input
    rango: string;         // texto del rango normal (ayuda)
    evalua: boolean;       // ¿se evalúa normal/anormal?
    core?: boolean;        // ¿es una de las 5 básicas obligatorias?
    bajaLbl?: string;      // etiqueta cuando está bajo
    altaLbl?: string;      // etiqueta cuando está alto
    ayuda?: string;        // ayuda alternativa cuando no se evalúa
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

            <!-- Filiación del paciente -->
            <section class="ce-pac-strip">
                <span class="ce-pac-strip__avatar">{{ initials() }}</span>
                <div class="flex-1 min-w-0">
                    <div class="ce-pac-strip__name">{{ nombreCompleto() }}</div>
                    <div class="ce-pac-strip__meta">
                        {{ paciente()?.carnetAsegurado || '—' }} · {{ paciente()?.edad ?? '—' }} años ·
                        {{ paciente()?.sexo === 'M' ? 'Masculino' : 'Femenino' }} · {{ paciente()?.grado || paciente()?.tipoAsegurado }}
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span class="ce-turno">{{ consulta()?.numeroTurno }}</span>
                    @if (consulta(); as c) {
                        <p-tag [value]="estadoLabel(c.estado)" [severity]="estadoSeverity(c.estado)" styleClass="text-xs" />
                    }
                </div>
            </section>

            <!-- ░░ PASO 1 ░░ -->
            <div class="guia">
                <span class="guia__step">1</span>
                <div class="flex-1">
                    <div class="guia__title">Constantes vitales basales</div>
                    <div class="guia__desc">Escriba los signos del paciente. Debajo de cada casilla verá el rango normal; los valores fuera de rango se marcan en color automáticamente.</div>
                </div>
                <div class="guia__meter">
                    <div class="meter"><div class="meter__fill" [style.width.%]="progreso()"></div></div>
                    <span class="meter__label">{{ coreLlenas() }}/5 básicas</span>
                </div>
            </div>

            <div class="vit-grid">
                <!-- Presión arterial (dos casillas) -->
                <div class="vit" [attr.data-st]="paStatus() ?? 'idle'">
                    <label class="vit__label req">Presión arterial <span class="vit__unit">mmHg</span></label>
                    <div class="flex items-center gap-1">
                        <p-inputnumber [(ngModel)]="c.paSistolica" [min]="0" [max]="300" placeholder="Sist." inputStyleClass="w-full" styleClass="w-full" />
                        <span class="text-muted-color font-bold px-0.5">/</span>
                        <p-inputnumber [(ngModel)]="c.paDiastolica" [min]="0" [max]="200" placeholder="Diast." inputStyleClass="w-full" styleClass="w-full" />
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
                        @if (imcCategoria()) { <span class="ce-imc__cat" [class]="'ce-imc__cat--' + imcCategoria()!.tone">{{ imcCategoria()!.label }}</span> }
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

            <!-- ░░ PASO 2 ░░ -->
            <div class="guia">
                <span class="guia__step">2</span>
                <div>
                    <div class="guia__title">Datos de la consulta (Form. 002)</div>
                    <div class="guia__desc">Complete el motivo y los antecedentes que el médico necesita conocer.</div>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Motivo de consulta</label>
                    <textarea pTextarea [(ngModel)]="motivoConsulta" rows="2" placeholder="¿Por qué viene el paciente hoy? Ej.: «Control de presión», «Dolor de garganta hace 3 días»…"></textarea>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="field-label">Alergias conocidas</label>
                        <input pInputText [(ngModel)]="alergias" placeholder="Ej.: Penicilina. Si no tiene, escriba «Ninguna»." />
                        <span class="field-hint">Importante para evitar reacciones a medicamentos.</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="field-label">Antecedentes relevantes</label>
                        <input pInputText [(ngModel)]="antecedentes" placeholder="Ej.: Hipertensión, Diabetes, Asma…" />
                        <span class="field-hint">Enfermedades de base o cirugías previas.</span>
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label">Observaciones de enfermería</label>
                    <textarea pTextarea [(ngModel)]="observaciones" rows="2" placeholder="Cualquier dato adicional del triaje basal (estado general, dolor, etc.)"></textarea>
                    <span class="field-hint">Al enviar al médico, el registro se firma con su nombre de usuario.</span>
                </div>
            </div>

            <!-- Acciones -->
            <div class="acciones">
                @if (!coreCompletas()) {
                    <span class="acciones__hint"><i class="pi pi-info-circle"></i> Faltan {{ 5 - coreLlenas() }} constante(s) básica(s) (PA, FC, FR, Tº, SatO₂) para enviar al médico.</span>
                }
                <div class="flex gap-2">
                    <p-button label="Guardar borrador" icon="pi pi-save" severity="secondary" [outlined]="true"
                        (onClick)="guardar('EN_PREPARACION')" [loading]="saving()" />
                    <p-button label="Enviar al médico" icon="pi pi-send"
                        (onClick)="guardar('LISTO_MEDICO')" [loading]="saving()" [disabled]="!coreCompletas()" />
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host { display: block; }
        .ce-pac-strip { display: flex; align-items: center; gap: 0.9rem; padding: 0.9rem 1rem; margin-bottom: 1.25rem;
            border-radius: 0.9rem; background: var(--p-primary-50); border: 1px solid var(--p-primary-200); }
        :host-context(.app-dark) .ce-pac-strip { background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900)); border-color: var(--p-surface-700); }
        .ce-pac-strip__avatar { flex: none; width: 2.8rem; height: 2.8rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
            font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .ce-pac-strip__name { font-weight: 700; color: var(--p-text-color); }
        .ce-pac-strip__meta { font-size: 0.8rem; color: var(--p-text-muted-color); }
        .ce-turno { font-family: var(--font-mono); font-weight: 600; font-size: 0.8rem; color: var(--p-primary-700);
            background: var(--p-surface-0); padding: 0.2rem 0.55rem; border-radius: 0.45rem; border: 1px solid var(--p-primary-200); }
        :host-context(.app-dark) .ce-turno { background: var(--p-surface-800); color: var(--p-primary-200); border-color: var(--p-surface-600); }

        /* Guía de pasos */
        .guia { display: flex; align-items: center; gap: 0.85rem; margin: 1.6rem 0 1rem; padding: 0.85rem 1rem;
            border-radius: 0.8rem; background: var(--p-surface-50); border: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .guia { background: var(--p-surface-800); border-color: var(--p-surface-700); }
        .guia__step { flex: none; width: 1.9rem; height: 1.9rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
            font-family: var(--font-display); font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .guia__title { font-family: var(--font-display); font-weight: 700; color: var(--p-text-color); }
        .guia__desc { font-size: 0.8rem; color: var(--p-text-muted-color); margin-top: 0.1rem; }
        .guia__meter { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
        .meter { width: 7rem; height: 0.5rem; border-radius: 9999px; background: var(--p-surface-200); overflow: hidden; }
        :host-context(.app-dark) .meter { background: var(--p-surface-700); }
        .meter__fill { height: 100%; border-radius: 9999px; background: linear-gradient(90deg, var(--p-primary-400), var(--p-primary-600)); transition: width .3s ease; }
        .meter__label { font-family: var(--font-mono); font-size: 0.66rem; font-weight: 600; color: var(--p-text-muted-color); }

        /* Grid de vitales */
        .vit-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; }
        @media (min-width: 640px) { .vit-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 980px) { .vit-grid { grid-template-columns: repeat(3, 1fr); } }
        .vit { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.65rem 0.7rem; border-radius: 0.7rem;
            border: 1px solid var(--p-surface-200); background: var(--p-surface-0); transition: border-color .15s ease, background .15s ease; }
        :host-context(.app-dark) .vit { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .vit[data-st="alto"] { border-color: #f5a3ad; background: #fff5f6; }
        .vit[data-st="bajo"] { border-color: #9ad0f0; background: #f2f9fe; }
        .vit[data-st="normal"] { border-color: var(--p-primary-200); }
        :host-context(.app-dark) .vit[data-st="alto"] { background: color-mix(in srgb, #be123c 16%, var(--p-surface-900)); }
        :host-context(.app-dark) .vit[data-st="bajo"] { background: color-mix(in srgb, #0369a1 16%, var(--p-surface-900)); }
        .vit__label { font-weight: 600; font-size: 0.84rem; color: var(--p-text-color); }
        .vit__unit { font-family: var(--font-mono); font-size: 0.68rem; color: var(--p-text-muted-color); font-weight: 500; }
        .vit__hint { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; font-weight: 600; color: var(--p-text-muted-color); }
        .vit__hint .pi { font-size: 0.7rem; }
        .vit__hint[data-st="normal"] { color: var(--p-primary-700); }
        .vit__hint[data-st="alto"] { color: #be123c; }
        .vit__hint[data-st="bajo"] { color: #0369a1; }
        :host-context(.app-dark) .vit__hint[data-st="normal"] { color: var(--p-primary-300); }
        :host-context(.app-dark) .vit__hint[data-st="alto"] { color: #fda4af; }
        :host-context(.app-dark) .vit__hint[data-st="bajo"] { color: #7dd3fc; }

        .ce-imc { display: flex; align-items: center; gap: 0.6rem; height: 2.6rem; padding: 0 0.75rem; border-radius: 0.6rem;
            background: var(--p-surface-50); border: 1px dashed var(--p-surface-300); }
        :host-context(.app-dark) .ce-imc { background: var(--p-surface-800); border-color: var(--p-surface-600); }
        .ce-imc__value { font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; color: var(--p-text-color); }
        .ce-imc__cat { font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 9999px; }
        .ce-imc__cat--ok { background: var(--p-primary-50); color: var(--p-primary-700); }
        .ce-imc__cat--low { background: #e0f2fe; color: #0369a1; }
        .ce-imc__cat--warn { background: #fef3c7; color: #b45309; }
        .ce-imc__cat--high { background: #ffe4e6; color: #be123c; }

        /* Resumen de alertas / OK */
        .alert-box { display: flex; gap: 0.75rem; margin: 1.1rem 0; padding: 0.9rem 1rem; border-radius: 0.8rem;
            background: #fff5f6; border: 1px solid #f5a3ad; }
        :host-context(.app-dark) .alert-box { background: color-mix(in srgb, #be123c 16%, var(--p-surface-900)); border-color: color-mix(in srgb, #be123c 40%, var(--p-surface-700)); }
        .alert-box__icon { color: #be123c; font-size: 1.2rem; margin-top: 0.1rem; }
        .alert-box__title { font-weight: 700; color: #be123c; font-size: 0.86rem; }
        :host-context(.app-dark) .alert-box__title, :host-context(.app-dark) .alert-box__icon { color: #fda4af; }
        .alert-box__list { margin: 0.3rem 0 0; padding-left: 1.1rem; font-size: 0.8rem; color: var(--p-text-color); list-style: disc; }
        .ok-box { display: flex; align-items: center; gap: 0.5rem; margin: 1.1rem 0; padding: 0.7rem 1rem; border-radius: 0.8rem;
            font-weight: 600; font-size: 0.85rem; color: var(--p-primary-700); background: var(--p-primary-50); border: 1px solid var(--p-primary-200); }
        :host-context(.app-dark) .ok-box { background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900)); color: var(--p-primary-300); border-color: var(--p-surface-700); }

        .acciones { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .acciones__hint { display: inline-flex; align-items: center; gap: 0.35rem; margin-right: auto; font-size: 0.78rem; color: var(--p-text-muted-color); }
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

    // ── Evaluación de constantes (métodos: se reevalúan en cada CD) ──────────
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
        if (imc < 25) return { label: 'Normal', tone: 'ok' };
        if (imc < 30) return { label: 'Sobrepeso', tone: 'warn' };
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
                if (!consulta) { this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'La consulta no existe.' }); return; }
                this.consulta.set(consulta);
                this.c = { ...(consulta.constantes ?? {}) };
                this.motivoConsulta = consulta.motivoConsulta ?? '';
                this.alergias = consulta.alergias ?? '';
                this.antecedentes = consulta.antecedentes ?? '';
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
            alergias: this.alergias.trim() || undefined,
            antecedentes: this.antecedentes.trim() || undefined,
            observaciones: this.observaciones.trim() || undefined,
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
            error: () => { this.saving.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' }); }
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
