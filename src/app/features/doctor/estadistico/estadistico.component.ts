import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FieldsetModule } from 'primeng/fieldset';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { PacienteService } from '@/app/core/services/paciente.service';
import { HistoriaClinicaService } from '@/app/core/services/historia-clinica.service';
import { InformeEstadistico, IngresoEstadistico, EgresoEstadistico, CausaAlta, CondicionEgreso } from '@/app/core/models/historia-clinica.model';
import { Paciente } from '@/app/core/models/paciente.model';

@Component({
    selector: 'app-estadistico',
    standalone: true,
    imports: [
        CommonModule, FormsModule, CardModule, TabsModule, InputTextModule,
        ButtonModule, RadioButtonModule, FieldsetModule,
        InputNumberModule, ToastModule, FormHeaderComponent
    ],
    providers: [MessageService],
    styles: [`
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
            margin-bottom: 1.25rem;
        }
        .pac-bar__left {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
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

        .form-section { margin-bottom: 1.5rem; }
        .form-section__title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.82rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: var(--p-primary-600);
            border-bottom: 1px solid var(--p-surface-200);
            padding-bottom: 0.4rem;
            margin-bottom: 1rem;
        }
        .form-section__body { display: grid; gap: 1rem; }

        .radio-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            padding: 0.75rem;
            background: var(--p-surface-50);
            border: 1px solid var(--p-surface-200);
            border-radius: 0.5rem;
        }
        .radio-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.875rem;
            cursor: pointer;
        }

        .tab-body { padding-top: 1.25rem; }
    `],
    template: `
        <p-toast />

        <app-form-header
            title="Informe Estadístico de Admisión y Egreso"
            code="HC-005"
            subtitle="Datos de ingreso y egreso de hospitalización" />

        <p-card>
            @if (paciente()) {
                <div class="pac-bar">
                    <div class="pac-bar__left">
                        <i class="pi pi-user" style="color: var(--p-primary-500)"></i>
                        <strong>{{ paciente()!.apellidoPaterno }} {{ paciente()!.apellidoMaterno }}, {{ paciente()!.nombres }}</strong>
                    </div>
                    <div class="pac-bar__right">
                        <span>{{ paciente()!.carnetAsegurado }}</span>
                        <span>HC-005</span>
                    </div>
                </div>
            } @else {
                <div class="empty-state" style="padding: 1rem 0 0.5rem;">
                    <i class="pi pi-user" style="font-size: 1.5rem; color: var(--p-text-muted-color)"></i>
                    <p>Sin paciente seleccionado</p>
                </div>
            }

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0">
                        <i class="pi pi-sign-in" style="margin-right: 0.4rem;"></i>
                        Ingreso
                    </p-tab>
                    <p-tab value="1">
                        <i class="pi pi-sign-out" style="margin-right: 0.4rem;"></i>
                        Egreso
                    </p-tab>
                </p-tablist>

                <p-tabpanels>

                    <!-- ===== TAB INGRESO ===== -->
                    <p-tabpanel value="0">
                        <div class="tab-body">

                            <!-- Datos de Ingreso -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-calendar"></i>
                                    Datos de Ingreso
                                </div>
                                <div class="form-section__body grid grid-cols-2 gap-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="fechaIngreso">Fecha de Ingreso</label>
                                        <input type="date" id="fechaIngreso" class="p-inputtext" [(ngModel)]="ingreso.fechaIngreso" />
                                        <span class="field-hint">Fecha en que el paciente ingresó al hospital.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="horaIngreso">Hora de Ingreso</label>
                                        <input type="time" id="horaIngreso" class="p-inputtext" [(ngModel)]="ingreso.horaIngreso" />
                                        <span class="field-hint">Hora exacta de admisión.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="sala">Sala</label>
                                        <input pInputText id="sala" [(ngModel)]="ingreso.sala" />
                                        <span class="field-hint">Sala o servicio donde se interió al paciente.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label" for="cama">Número de Cama</label>
                                        <input pInputText id="cama" [(ngModel)]="ingreso.cama" />
                                        <span class="field-hint">Número o código de la cama asignada.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Prestación y Origen -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-building"></i>
                                    Prestación y Unidad de Origen
                                </div>
                                <div class="form-section__body grid grid-cols-2 gap-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="tipoPrestacion">Tipo de Prestación</label>
                                        <input pInputText id="tipoPrestacion" [(ngModel)]="ingreso.tipoPrestacion" />
                                        <span class="field-hint">Ej.: Hospitalización, Cirugía, Maternidad.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label" for="unidadOrigen">Unidad Sanitaria de Origen</label>
                                        <input pInputText id="unidadOrigen" [(ngModel)]="ingreso.unidadSanitariaOrigen" />
                                        <span class="field-hint">Centro o policlínico que refirió al paciente.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Tipo de Admisión -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-list"></i>
                                    Tipo de Admisión
                                </div>
                                <div class="form-section__body">
                                    <div class="radio-group">
                                        <label class="radio-item">
                                            <p-radioButton name="tipoAdmision" value="CONSULTORIO_EXTERNO" [(ngModel)]="ingreso.tipoAdmision" inputId="admConsultorio" />
                                            <span for="admConsultorio">Consultorio Externo</span>
                                        </label>
                                        <label class="radio-item">
                                            <p-radioButton name="tipoAdmision" value="EMERGENCIA" [(ngModel)]="ingreso.tipoAdmision" inputId="admEmergencia" />
                                            <span for="admEmergencia">Emergencia</span>
                                        </label>
                                        <label class="radio-item">
                                            <p-radioButton name="tipoAdmision" value="OTRO" [(ngModel)]="ingreso.tipoAdmision" inputId="admOtro" />
                                            <span for="admOtro">Otro</span>
                                        </label>
                                    </div>
                                    <span class="field-hint">Vía por la que el paciente ingresó a hospitalización.</span>
                                </div>
                            </div>

                            <!-- Diagnóstico de Ingreso -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-heart"></i>
                                    Diagnóstico de Ingreso
                                </div>
                                <div class="form-section__body">
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="diagPresuntivo">Diagnóstico Presuntivo</label>
                                        <input pInputText id="diagPresuntivo" [(ngModel)]="ingreso.diagnosticoPresuntivo" />
                                        <span class="field-hint">Diagnóstico según CIE-10. Ej.: J18.9 — Neumonía no especificada.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label" for="codDiagIngreso">Código CIE-10</label>
                                        <input pInputText id="codDiagIngreso" [(ngModel)]="ingreso.codigoDiagnostico" style="max-width: 14rem;" />
                                        <span class="field-hint">Código de clasificación internacional de la enfermedad.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Médico Solicitante -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-id-card"></i>
                                    Médico Solicitante
                                </div>
                                <div class="form-section__body grid grid-cols-2 gap-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="medicoSolicita">Nombre del Médico</label>
                                        <input pInputText id="medicoSolicita" [(ngModel)]="ingreso.medicoSolicita" />
                                        <span class="field-hint">Nombre completo del médico que ordena la internación.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label" for="claveMedico">Matrícula / Clave</label>
                                        <input pInputText id="claveMedico" [(ngModel)]="ingreso.claveMedico" />
                                        <span class="field-hint">Número de matrícula o clave interna del médico.</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </p-tabpanel>

                    <!-- ===== TAB EGRESO ===== -->
                    <p-tabpanel value="1">
                        <div class="tab-body">

                            <!-- Datos de Egreso -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-calendar"></i>
                                    Datos de Egreso
                                </div>
                                <div class="form-section__body grid grid-cols-2 gap-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="fechaEgreso">Fecha de Egreso</label>
                                        <input type="date" id="fechaEgreso" class="p-inputtext" [(ngModel)]="egreso.fechaEgreso" />
                                        <span class="field-hint">Fecha en que el paciente fue dado de alta o egresó.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="diasEstada">Días de Estancia</label>
                                        <p-inputNumber
                                            id="diasEstada"
                                            [(ngModel)]="egreso.diasEstada"
                                            [min]="0"
                                            [showButtons]="true"
                                            buttonLayout="horizontal"
                                            decrementButtonIcon="pi pi-minus"
                                            incrementButtonIcon="pi pi-plus" />
                                        <span class="field-hint">Número de días entre admisión y egreso hospitalario.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="medicoTratante">Médico Tratante</label>
                                        <input pInputText id="medicoTratante" [(ngModel)]="egreso.medicoTratante" />
                                        <span class="field-hint">Nombre del médico responsable del alta.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Diagnóstico de Egreso -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-heart"></i>
                                    Diagnósticos de Egreso
                                </div>
                                <div class="form-section__body">
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label req" for="diagDefinitivo">Diagnóstico Principal (Definitivo)</label>
                                        <input pInputText id="diagDefinitivo" [(ngModel)]="egreso.diagnosticoDefinitivo" />
                                        <span class="field-hint">Diagnóstico según CIE-10. Ej.: J18.9 — Neumonía no especificada.</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="field-label" for="codDiagEgreso">Código CIE-10</label>
                                        <input pInputText id="codDiagEgreso" [(ngModel)]="egreso.codigoDiagnostico" style="max-width: 14rem;" />
                                        <span class="field-hint">Código de clasificación internacional de la enfermedad.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Causa de Alta / Egreso -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-clipboard"></i>
                                    Causa de Egreso
                                </div>
                                <div class="form-section__body">
                                    <div class="radio-group">
                                        @for (causa of causasAlta; track causa) {
                                            <label class="radio-item">
                                                <p-radioButton
                                                    name="causaAlta"
                                                    [value]="causa"
                                                    [(ngModel)]="egreso.causaAlta"
                                                    [inputId]="'causa_' + causa" />
                                                <span>{{ causaAltaLabel(causa) }}</span>
                                            </label>
                                        }
                                    </div>
                                    <span class="field-hint">Alta, Defunción, Traslado, Fuga, etc. Seleccione la causa que corresponde al egreso.</span>
                                </div>
                            </div>

                            <!-- Condición de Egreso -->
                            <div class="form-section">
                                <div class="form-section__title">
                                    <i class="pi pi-chart-bar"></i>
                                    Condición al Egreso
                                </div>
                                <div class="form-section__body">
                                    <div class="radio-group">
                                        @for (cond of condicionesEgreso; track cond) {
                                            <label class="radio-item">
                                                <p-radioButton
                                                    name="condicionEgreso"
                                                    [value]="cond"
                                                    [(ngModel)]="egreso.condicionEgreso"
                                                    [inputId]="'cond_' + cond" />
                                                <span>{{ condicionEgresoLabel(cond) }}</span>
                                            </label>
                                        }
                                    </div>
                                    <span class="field-hint">Estado clínico del paciente en el momento del egreso.</span>
                                </div>
                            </div>

                        </div>
                    </p-tabpanel>

                </p-tabpanels>
            </p-tabs>

            <div class="flex justify-end gap-2" style="margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--p-surface-200);">
                <p-button label="Guardar Informe" icon="pi pi-save" (onClick)="guardar()" />
            </div>
        </p-card>
    `
})
export class EstadisticoComponent {
    private route = inject(ActivatedRoute);
    private pacienteService = inject(PacienteService);
    private hcService = inject(HistoriaClinicaService);
    private messageService = inject(MessageService);
    private activo = inject(PacienteActivoService);

    private routeId = toSignal(
        this.route.paramMap.pipe(map((pm) => (pm.get('pacienteId') ? +pm.get('pacienteId')! : null))),
        { initialValue: null }
    );
    private loadedId: number | null = null;

    pacienteId = signal<number | null>(null);
    paciente = signal<Paciente | null>(null);

    ingreso: IngresoEstadistico = {
        tipoPrestacion: '',
        unidadSanitariaOrigen: '',
        fechaIngreso: '',
        horaIngreso: '',
        sala: '',
        cama: '',
        diagnosticoPresuntivo: '',
        codigoDiagnostico: '',
        tipoAdmision: 'CONSULTORIO_EXTERNO',
        medicoSolicita: '',
        claveMedico: ''
    };

    egreso: EgresoEstadistico = {
        fechaEgreso: '',
        diagnosticoDefinitivo: '',
        codigoDiagnostico: '',
        causaAlta: 'MEDICA',
        condicionEgreso: 'SANO',
        diasEstada: 0,
        medicoTratante: ''
    };

    causasAlta: CausaAlta[] = ['MEDICA', 'SOLICITADA', 'ABANDONO', 'DISCIPLINARIA', 'TRANSFERENCIA', 'TERMINACION_DERECHO'];
    condicionesEgreso: CondicionEgreso[] = ['SANO', 'MEJORADO', 'NO_MEJORADO', 'NO_TRATADO', 'MUERTE_INSTITUCIONAL'];

    private informeId?: number;

    causaAltaLabel(causa: CausaAlta): string {
        const labels: Record<CausaAlta, string> = {
            MEDICA: 'Alta Médica',
            SOLICITADA: 'Solicitada',
            ABANDONO: 'Abandono',
            DISCIPLINARIA: 'Disciplinaria',
            TRANSFERENCIA: 'Transferencia',
            TERMINACION_DERECHO: 'Terminación de Derecho'
        };
        return labels[causa] ?? causa;
    }

    condicionEgresoLabel(cond: CondicionEgreso): string {
        const labels: Record<CondicionEgreso, string> = {
            SANO: 'Sano',
            MEJORADO: 'Mejorado',
            NO_MEJORADO: 'No Mejorado',
            NO_TRATADO: 'No Tratado',
            MUERTE_INSTITUCIONAL: 'Muerte Institucional'
        };
        return labels[cond] ?? cond;
    }

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.loadPaciente(id);
            this.loadEstadistico(id);
        });
    }

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (data) => this.paciente.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el paciente' })
        });
    }

    private loadEstadistico(pacienteId: number): void {
        this.hcService.getEstadisticoByPaciente(pacienteId).subscribe({
            next: (data) => {
                if (data) {
                    this.informeId = data.id;
                    this.ingreso = { ...this.ingreso, ...data.ingreso };
                    if (data.egreso) {
                        this.egreso = { ...this.egreso, ...data.egreso };
                    }
                }
            },
            error: () => {} // No existing record, use defaults
        });
    }

    guardar(): void {
        const pac = this.paciente();
        if (!pac) return;

        const informe: InformeEstadistico = {
            id: this.informeId,
            pacienteId: pac.id!,
            carnetAsegurado: pac.carnetAsegurado,
            carnetBeneficiario: pac.carnetBeneficiario,
            establecimiento: '',
            localidad: '',
            esNuevo: !this.informeId,
            ingreso: this.ingreso,
            egreso: this.egreso
        };

        this.hcService.saveEstadistico(informe).subscribe({
            next: (saved) => {
                this.informeId = saved.id;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Informe estadístico guardado correctamente' });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el informe' })
        });
    }
}
