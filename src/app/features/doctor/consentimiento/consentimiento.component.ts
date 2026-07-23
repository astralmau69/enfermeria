import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FieldsetModule } from 'primeng/fieldset';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { ServiciosCheckboxComponent } from '@/app/shared/components/servicios-checkbox/servicios-checkbox.component';
import { PacienteService } from '@/app/core/services/paciente.service';
import { HistoriaClinicaService } from '@/app/core/services/historia-clinica.service';
import { ConsentimientoInformado, FirmaConsentimiento, AltaSolicitada } from '@/app/core/models/historia-clinica.model';
import { Paciente, VServicios } from '@/app/core/models/paciente.model';

@Component({
    selector: 'app-consentimiento',
    standalone: true,
    imports: [
        CommonModule, FormsModule, CardModule, InputTextModule, ButtonModule,
        SelectModule, ToggleSwitchModule, FieldsetModule, ToastModule,
        DividerModule, ServiciosCheckboxComponent, FormHeaderComponent
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

        .consent-text {
            background: var(--p-surface-50);
            border: 1px solid var(--p-surface-200);
            border-radius: 0.5rem;
            padding: 1rem 1.25rem;
            font-size: 0.875rem;
            line-height: 1.7;
            text-align: justify;
            color: var(--p-text-color);
        }
        .consent-text p + p { margin-top: 0.75rem; }

        .firma-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 0.2rem 0.6rem;
            border-radius: 1rem;
            background: color-mix(in srgb, var(--p-green-500) 12%, transparent);
            color: var(--p-green-600);
            border: 1px solid color-mix(in srgb, var(--p-green-500) 25%, transparent);
        }

        .alta-toggle-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background: var(--p-surface-50);
            border: 1px solid var(--p-surface-200);
            border-radius: 0.5rem;
            margin-bottom: 1rem;
        }
        .alta-toggle-row label {
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
        }
    `],
    template: `
        <p-toast />

        <app-form-header
            title="Autorización y Consentimiento Informado"
            code="HC·M-003"
            subtitle="Consentimiento del paciente o familiar · alta solicitada" />

        <p-card>
            @if (paciente()) {
                <div class="pac-bar">
                    <div class="pac-bar__left">
                        <i class="pi pi-user" style="color: var(--p-primary-500)"></i>
                        <strong>{{ paciente()!.apellidoPaterno }} {{ paciente()!.apellidoMaterno }}, {{ paciente()!.nombres }}</strong>
                    </div>
                    <div class="pac-bar__right">
                        <span>{{ paciente()!.carnetAsegurado }}</span>
                        <span>HC·M-003</span>
                    </div>
                </div>
            } @else {
                <div class="empty-state" style="padding: 1rem 0 0.5rem;">
                    <i class="pi pi-user" style="font-size: 1.5rem; color: var(--p-text-muted-color)"></i>
                    <p>Sin paciente seleccionado</p>
                </div>
            }

            <!-- Sección: Fecha y Hora -->
            <div class="form-section">
                <div class="form-section__title">
                    <i class="pi pi-calendar"></i>
                    Fecha y Hora del Consentimiento
                </div>
                <div class="form-section__body grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="field-label req" for="fechaConsentimiento">Fecha</label>
                        <input type="date" id="fechaConsentimiento" class="p-inputtext" [(ngModel)]="fecha" />
                        <span class="field-hint">Fecha en que se firma el consentimiento.</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="field-label req" for="horaConsentimiento">Hora</label>
                        <input type="time" id="horaConsentimiento" class="p-inputtext" [(ngModel)]="hora" />
                        <span class="field-hint">Hora exacta de la firma.</span>
                    </div>
                </div>
            </div>

            <!-- Sección: Servicios -->
            <div class="form-section">
                <div class="form-section__title">
                    <i class="pi pi-th-large"></i>
                    Servicios Autorizados
                </div>
                <div class="form-section__body">
                    <app-servicios-checkbox [(vServicios)]="vServicios" />
                    <span class="field-hint">Marque los servicios que el paciente autoriza durante su internación.</span>
                </div>
            </div>

            <!-- Texto del Consentimiento -->
            <div class="form-section">
                <div class="form-section__title">
                    <i class="pi pi-file-edit"></i>
                    Texto del Consentimiento Informado
                </div>
                <div class="form-section__body">
                    <div class="consent-text">
                        <p>
                            Autorizo a los profesionales médicos y personal de salud de esta institución a realizar los procedimientos
                            diagnósticos y terapéuticos que sean necesarios para mi atención médica, incluyendo pero no limitándose a:
                            exámenes clínicos, estudios de laboratorio, imágenes diagnósticas, procedimientos quirúrgicos, administración
                            de medicamentos, transfusiones sanguíneas y demás intervenciones que el equipo médico considere pertinentes.
                        </p>
                        <p>
                            Declaro que he sido informado(a) de manera clara, oportuna y suficiente sobre mi estado de salud,
                            el diagnóstico presuntivo o definitivo, las alternativas de tratamiento propuestas, los beneficios esperados,
                            los posibles riesgos y complicaciones, así como las consecuencias de no realizar el tratamiento.
                        </p>
                        <p>
                            Comprendo que la práctica médica no es una ciencia exacta y que el resultado de los procedimientos no puede
                            ser garantizado. Asimismo, autorizo la disposición de tejidos, órganos o partes del cuerpo que sean removidos
                            durante intervenciones quirúrgicas, para fines diagnósticos, terapéuticos o de investigación, según
                            corresponda y conforme a la normativa vigente.
                        </p>
                        <p>
                            He leído y comprendido el contenido de este documento, y otorgo mi consentimiento de manera libre,
                            voluntaria e informada, sin haber sido sometido(a) a coacción alguna.
                        </p>
                    </div>
                    <div class="flex flex-col gap-1" style="margin-top: 0.75rem;">
                        <label class="field-label" for="textoCons">Texto adicional o aclaraciones</label>
                        <textarea
                            id="textoCons"
                            class="p-inputtext"
                            rows="8"
                            style="resize: vertical; font-size: 0.875rem; line-height: 1.6;"
                            placeholder="Registre aquí el procedimiento específico, riesgos particulares y alternativas informadas al paciente..."
                        ></textarea>
                        <span class="field-hint">Texto del consentimiento informado. Incluya el procedimiento, riesgos y alternativas.</span>
                    </div>
                </div>
            </div>

            <!-- Sección: Firma del Paciente -->
            <div class="form-section">
                <div class="form-section__title">
                    <i class="pi pi-pen-to-square"></i>
                    Firma del Paciente o Representante Legal
                    @if (firmante.nombre) {
                        <span class="firma-badge" style="margin-left: auto;">
                            <i class="pi pi-check-circle"></i>
                            Firmado
                        </span>
                    }
                </div>
                <div class="form-section__body grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1" style="grid-column: 1 / -1;">
                        <label class="field-label req" for="firmaNombre">Nombre Completo</label>
                        <input pInputText id="firmaNombre" [(ngModel)]="firmante.nombre" />
                        <span class="field-hint">Nombre completo del paciente o representante legal que firma.</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="field-label req" for="firmaCI">Cédula de Identidad</label>
                        <input pInputText id="firmaCI" [(ngModel)]="firmante.ci" />
                        <span class="field-hint">Número de C.I. del firmante.</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="field-label req" for="firmaTipo">Tipo de Firmante</label>
                        <div class="p-select-wrapper" style="display: contents;">
                            <p-select
                                id="firmaTipo"
                                [(ngModel)]="firmante.tipo"
                                [options]="tiposFirma"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccione tipo..." />
                        </div>
                        <span class="field-hint">Indique si firma el paciente, un familiar o un testigo.</span>
                    </div>
                </div>
            </div>

            <!-- Sección: Firma del Médico -->
            <div class="form-section">
                <div class="form-section__title">
                    <i class="pi pi-id-card"></i>
                    Firma del Médico Solicitante
                </div>
                <div class="form-section__body grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="field-label req" for="medicoNombre">Nombre del Médico</label>
                        <input pInputText id="medicoNombre" />
                        <span class="field-hint">Nombre y matrícula del médico que solicita el consentimiento.</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="field-label" for="medicoMatricula">Matrícula Profesional</label>
                        <input pInputText id="medicoMatricula" />
                        <span class="field-hint">Número de registro o matrícula del médico tratante.</span>
                    </div>
                </div>
            </div>

            <!-- Toggle: Alta Solicitada -->
            <div class="alta-toggle-row">
                <p-toggleSwitch [(ngModel)]="mostrarAlta" inputId="togAlta" />
                <label for="togAlta">
                    <i class="pi pi-sign-out" style="margin-right: 0.35rem; color: var(--p-primary-500);"></i>
                    El paciente solicita alta voluntaria
                </label>
            </div>

            @if (mostrarAlta) {
                <!-- Sección: Alta Solicitada -->
                <div class="form-section">
                    <div class="form-section__title">
                        <i class="pi pi-sign-out"></i>
                        Alta Solicitada — Responsable
                    </div>
                    <div class="form-section__body grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1" style="grid-column: 1 / -1;">
                            <label class="field-label req" for="altaNombre">Nombre Completo del Responsable</label>
                            <input pInputText id="altaNombre" [(ngModel)]="altaSolicitada.nombre" />
                            <span class="field-hint">Persona que asume la responsabilidad del alta voluntaria.</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="altaCI">Cédula de Identidad</label>
                            <input pInputText id="altaCI" [(ngModel)]="altaSolicitada.ci" />
                            <span class="field-hint">C.I. del responsable del alta.</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="altaTipo">Relación con el Paciente</label>
                            <p-select
                                id="altaTipo"
                                [(ngModel)]="altaSolicitada.tipo"
                                [options]="tiposFirma"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccione tipo..." />
                            <span class="field-hint">Parentesco o vínculo con el paciente.</span>
                        </div>
                    </div>
                </div>
            }

            <div class="flex justify-end gap-2" style="margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--p-surface-200);">
                <p-button label="Guardar Consentimiento" icon="pi pi-save" (onClick)="guardar()" />
            </div>
        </p-card>
    `
})
export class ConsentimientoComponent {
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

    fecha = '';
    hora = '';
    vServicios: VServicios = { pt1: false, pt2: false, pip: false, pipa: false, papa: false, pic: false };

    firmante: FirmaConsentimiento = { nombre: '', ci: '', tipo: 'PACIENTE' };
    altaSolicitada: AltaSolicitada = { nombre: '', ci: '', tipo: 'FAMILIAR' };
    mostrarAlta = false;

    tiposFirma = [
        { label: 'Paciente', value: 'PACIENTE' },
        { label: 'Familiar', value: 'FAMILIAR' },
        { label: 'Testigo', value: 'TESTIGO' }
    ];

    private consentimientoId?: number;

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.loadPaciente(id);
            this.loadConsentimiento(id);
        });
    }

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (data) => this.paciente.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el paciente' })
        });
    }

    private loadConsentimiento(pacienteId: number): void {
        this.hcService.getConsentimientoByPaciente(pacienteId).subscribe({
            next: (data) => {
                if (data) {
                    this.consentimientoId = data.id;
                    this.fecha = data.fecha;
                    this.hora = data.hora;
                    this.vServicios = { ...data.vServicios };
                    this.firmante = { ...data.firmante };
                    if (data.altaSolicitada) {
                        this.mostrarAlta = true;
                        this.altaSolicitada = { ...data.altaSolicitada };
                    }
                }
            },
            error: () => {} // No existing record, use defaults
        });
    }

    guardar(): void {
        const pac = this.paciente();
        if (!pac) return;

        const consentimiento: ConsentimientoInformado = {
            id: this.consentimientoId,
            pacienteId: pac.id!,
            carnetAsegurado: pac.carnetAsegurado,
            carnetBeneficiario: pac.carnetBeneficiario,
            fecha: this.fecha,
            hora: this.hora,
            vServicios: this.vServicios,
            firmante: this.firmante,
            altaSolicitada: this.mostrarAlta ? this.altaSolicitada : undefined
        };

        this.hcService.saveConsentimiento(consentimiento).subscribe({
            next: (saved) => {
                this.consentimientoId = saved.id;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Consentimiento guardado correctamente' });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el consentimiento' })
        });
    }
}
