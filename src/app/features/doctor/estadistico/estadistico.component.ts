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
import { DatePickerModule } from 'primeng/datepicker';
import { FieldsetModule } from 'primeng/fieldset';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PacienteHeaderComponent } from '@/app/shared/components/paciente-header/paciente-header.component';
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
        ButtonModule, RadioButtonModule, DatePickerModule, FieldsetModule,
        InputNumberModule, ToastModule, PacienteHeaderComponent, FormHeaderComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header
            title="Informe Estad\u00edstico de Admisi\u00f3n y Egreso"
            code="HC-005"
            subtitle="Datos de ingreso y egreso de hospitalizaci\u00f3n" />

        <p-card>
            @if (paciente()) {
                <app-paciente-header [paciente]="paciente()!" />
            }

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0">Ingreso</p-tab>
                    <p-tab value="1">Egreso</p-tab>
                </p-tablist>
                <p-tabpanels>
                <!-- Tab Ingreso -->
                <p-tabpanel value="0">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <div class="flex flex-col gap-1">
                            <label for="tipoPrestacion" class="font-semibold text-sm">Tipo de Prestaci\u00f3n</label>
                            <input pInputText id="tipoPrestacion" [(ngModel)]="ingreso.tipoPrestacion" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="unidadOrigen" class="font-semibold text-sm">Unidad Sanitaria de Origen</label>
                            <input pInputText id="unidadOrigen" [(ngModel)]="ingreso.unidadSanitariaOrigen" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="fechaIngreso" class="font-semibold text-sm">Fecha de Ingreso</label>
                            <p-datePicker id="fechaIngreso" [(ngModel)]="fechaIngreso" dateFormat="dd/mm/yy" [showIcon]="true" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="horaIngreso" class="font-semibold text-sm">Hora</label>
                            <input pInputText id="horaIngreso" [(ngModel)]="ingreso.horaIngreso" placeholder="HH:mm" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="sala" class="font-semibold text-sm">Sala</label>
                            <input pInputText id="sala" [(ngModel)]="ingreso.sala" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="cama" class="font-semibold text-sm">Cama</label>
                            <input pInputText id="cama" [(ngModel)]="ingreso.cama" />
                        </div>
                        <div class="flex flex-col gap-1 md:col-span-2">
                            <label for="diagPresuntivo" class="font-semibold text-sm">Diagn\u00f3stico Presuntivo</label>
                            <input pInputText id="diagPresuntivo" [(ngModel)]="ingreso.diagnosticoPresuntivo" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="codDiagIngreso" class="font-semibold text-sm">C\u00f3digo Diagn\u00f3stico</label>
                            <input pInputText id="codDiagIngreso" [(ngModel)]="ingreso.codigoDiagnostico" />
                        </div>
                    </div>

                    <p-fieldset legend="Tipo de Admisi\u00f3n" styleClass="mt-4">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <p-radioButton name="tipoAdmision" value="CONSULTORIO_EXTERNO" [(ngModel)]="ingreso.tipoAdmision" inputId="admConsultorio" />
                                <label for="admConsultorio">Consultorio Externo</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <p-radioButton name="tipoAdmision" value="EMERGENCIA" [(ngModel)]="ingreso.tipoAdmision" inputId="admEmergencia" />
                                <label for="admEmergencia">Emergencia</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <p-radioButton name="tipoAdmision" value="OTRO" [(ngModel)]="ingreso.tipoAdmision" inputId="admOtro" />
                                <label for="admOtro">Otro</label>
                            </div>
                        </div>
                    </p-fieldset>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div class="flex flex-col gap-1">
                            <label for="medicoSolicita" class="font-semibold text-sm">M\u00e9dico que Solicita</label>
                            <input pInputText id="medicoSolicita" [(ngModel)]="ingreso.medicoSolicita" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="claveMedico" class="font-semibold text-sm">Clave M\u00e9dico</label>
                            <input pInputText id="claveMedico" [(ngModel)]="ingreso.claveMedico" />
                        </div>
                    </div>
                </p-tabpanel>

                <!-- Tab Egreso -->
                <p-tabpanel value="1">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <div class="flex flex-col gap-1">
                            <label for="fechaEgreso" class="font-semibold text-sm">Fecha de Egreso</label>
                            <p-datePicker id="fechaEgreso" [(ngModel)]="fechaEgreso" dateFormat="dd/mm/yy" [showIcon]="true" />
                        </div>
                        <div class="flex flex-col gap-1 md:col-span-2">
                            <label for="diagDefinitivo" class="font-semibold text-sm">Diagn\u00f3stico Definitivo</label>
                            <input pInputText id="diagDefinitivo" [(ngModel)]="egreso.diagnosticoDefinitivo" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="codDiagEgreso" class="font-semibold text-sm">C\u00f3digo Diagn\u00f3stico</label>
                            <input pInputText id="codDiagEgreso" [(ngModel)]="egreso.codigoDiagnostico" />
                        </div>
                    </div>

                    <p-fieldset legend="Causa de Alta" styleClass="mt-4">
                        <div class="flex flex-wrap gap-4">
                            @for (causa of causasAlta; track causa) {
                                <div class="flex items-center gap-2">
                                    <p-radioButton name="causaAlta" [value]="causa" [(ngModel)]="egreso.causaAlta" [inputId]="'causa_' + causa" />
                                    <label [for]="'causa_' + causa">{{ causa }}</label>
                                </div>
                            }
                        </div>
                    </p-fieldset>

                    <p-fieldset legend="Condici\u00f3n de Egreso" styleClass="mt-4">
                        <div class="flex flex-wrap gap-4">
                            @for (cond of condicionesEgreso; track cond) {
                                <div class="flex items-center gap-2">
                                    <p-radioButton name="condicionEgreso" [value]="cond" [(ngModel)]="egreso.condicionEgreso" [inputId]="'cond_' + cond" />
                                    <label [for]="'cond_' + cond">{{ cond }}</label>
                                </div>
                            }
                        </div>
                    </p-fieldset>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div class="flex flex-col gap-1">
                            <label for="diasEstada" class="font-semibold text-sm">D\u00edas de Estad\u00eda</label>
                            <p-inputNumber id="diasEstada" [(ngModel)]="egreso.diasEstada" [min]="0" [showButtons]="true" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="medicoTratante" class="font-semibold text-sm">M\u00e9dico Tratante</label>
                            <input pInputText id="medicoTratante" [(ngModel)]="egreso.medicoTratante" />
                        </div>
                    </div>
                </p-tabpanel>
                </p-tabpanels>
            </p-tabs>

            <div class="flex justify-end gap-2 mt-4">
                <p-button label="Guardar" icon="pi pi-save" (onClick)="guardar()" />
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

    fechaIngreso: Date | null = null;
    fechaEgreso: Date | null = null;

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
                    if (data.ingreso.fechaIngreso) {
                        this.fechaIngreso = new Date(data.ingreso.fechaIngreso);
                    }
                    if (data.egreso) {
                        this.egreso = { ...this.egreso, ...data.egreso };
                        if (data.egreso.fechaEgreso) {
                            this.fechaEgreso = new Date(data.egreso.fechaEgreso);
                        }
                    }
                }
            },
            error: () => {} // No existing record, use defaults
        });
    }

    guardar(): void {
        const pac = this.paciente();
        if (!pac) return;

        if (this.fechaIngreso) {
            this.ingreso.fechaIngreso = this.fechaIngreso.toISOString().split('T')[0];
        }
        if (this.fechaEgreso) {
            this.egreso.fechaEgreso = this.fechaEgreso.toISOString().split('T')[0];
        }

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
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Informe estad\u00edstico guardado correctamente' });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el informe' })
        });
    }
}
