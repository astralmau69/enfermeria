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
import { PacienteHeaderComponent } from '@/app/shared/components/paciente-header/paciente-header.component';
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
        DividerModule, PacienteHeaderComponent, ServiciosCheckboxComponent, FormHeaderComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header
            title="Autorizaci\u00f3n y Consentimiento Informado"
            code="HC\u00b7M-003"
            subtitle="Consentimiento del paciente o familiar \u00b7 alta solicitada" />

        <p-card>
            @if (paciente()) {
                <app-paciente-header [paciente]="paciente()!" />
            }

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="flex flex-col gap-1">
                    <label for="fechaConsentimiento" class="font-semibold text-sm">Fecha</label>
                    <input pInputText id="fechaConsentimiento" [(ngModel)]="fecha" placeholder="DD/MM/AAAA" />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="horaConsentimiento" class="font-semibold text-sm">Hora</label>
                    <input pInputText id="horaConsentimiento" [(ngModel)]="hora" placeholder="HH:mm" />
                </div>
            </div>

            <p-fieldset legend="Servicios" styleClass="mb-4">
                <app-servicios-checkbox [(vServicios)]="vServicios" />
            </p-fieldset>

            <p-divider />

            <!-- Legal text block -->
            <div class="bg-gray-50 border border-gray-200 rounded p-4 my-4 text-sm leading-relaxed text-justify">
                <p class="mb-2">
                    Autorizo a los profesionales m\u00e9dicos y personal de salud de esta instituci\u00f3n a realizar los procedimientos
                    diagn\u00f3sticos y terap\u00e9uticos que sean necesarios para mi atenci\u00f3n m\u00e9dica, incluyendo pero no limit\u00e1ndose a:
                    ex\u00e1menes cl\u00ednicos, estudios de laboratorio, im\u00e1genes diagn\u00f3sticas, procedimientos quir\u00fargicos, administraci\u00f3n
                    de medicamentos, transfusiones sangu\u00edneas y dem\u00e1s intervenciones que el equipo m\u00e9dico considere pertinentes.
                </p>
                <p class="mb-2">
                    Declaro que he sido informado(a) de manera clara, oportuna y suficiente sobre mi estado de salud,
                    el diagn\u00f3stico presuntivo o definitivo, las alternativas de tratamiento propuestas, los beneficios esperados,
                    los posibles riesgos y complicaciones, as\u00ed como las consecuencias de no realizar el tratamiento.
                </p>
                <p class="mb-2">
                    Comprendo que la pr\u00e1ctica m\u00e9dica no es una ciencia exacta y que el resultado de los procedimientos no puede
                    ser garantizado. Asimismo, autorizo la disposici\u00f3n de tejidos, \u00f3rganos o partes del cuerpo que sean removidos
                    durante intervenciones quir\u00fargicas, para fines diagn\u00f3sticos, terap\u00e9uticos o de investigaci\u00f3n, seg\u00fan
                    corresponda y conforme a la normativa vigente.
                </p>
                <p>
                    He le\u00eddo y comprendido el contenido de este documento, y otorgo mi consentimiento de manera libre,
                    voluntaria e informada, sin haber sido sometido(a) a coacci\u00f3n alguna.
                </p>
            </div>

            <p-divider />

            <!-- Signature section -->
            <p-fieldset legend="Firma del Consentimiento" styleClass="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1">
                        <label for="firmaNombre" class="font-semibold text-sm">Nombre Completo</label>
                        <input pInputText id="firmaNombre" [(ngModel)]="firmante.nombre" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label for="firmaCI" class="font-semibold text-sm">C.I.</label>
                        <input pInputText id="firmaCI" [(ngModel)]="firmante.ci" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label for="firmaTipo" class="font-semibold text-sm">Tipo</label>
                        <p-select id="firmaTipo" [(ngModel)]="firmante.tipo" [options]="tiposFirma" optionLabel="label" optionValue="value" placeholder="Seleccione..." />
                    </div>
                </div>
            </p-fieldset>

            <!-- Alta Solicitada toggle -->
            <div class="flex items-center gap-3 mb-4">
                <p-toggleSwitch [(ngModel)]="mostrarAlta" />
                <span class="font-semibold">Alta Solicitada</span>
            </div>

            @if (mostrarAlta) {
                <p-fieldset legend="Alta Solicitada" styleClass="mb-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex flex-col gap-1">
                            <label for="altaNombre" class="font-semibold text-sm">Nombre Completo</label>
                            <input pInputText id="altaNombre" [(ngModel)]="altaSolicitada.nombre" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="altaCI" class="font-semibold text-sm">C.I.</label>
                            <input pInputText id="altaCI" [(ngModel)]="altaSolicitada.ci" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="altaTipo" class="font-semibold text-sm">Tipo</label>
                            <p-select id="altaTipo" [(ngModel)]="altaSolicitada.tipo" [options]="tiposFirma" optionLabel="label" optionValue="value" placeholder="Seleccione..." />
                        </div>
                    </div>
                </p-fieldset>
            }

            <div class="flex justify-end gap-2 mt-4">
                <p-button label="Guardar" icon="pi pi-save" (onClick)="guardar()" />
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
