import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PacienteService } from '@/app/core/services/paciente.service';
import { HistoriaClinicaService } from '@/app/core/services/historia-clinica.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { PacienteSearchComponent } from '@/app/shared/components/paciente-search/paciente-search.component';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

@Component({
    selector: 'app-admision',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        InputTextModule, TextareaModule, ButtonModule, SelectModule,
        RadioButtonModule, CheckboxModule, DatePickerModule,
        ToastModule, PacienteSearchComponent, FormHeaderComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <!-- Buscar paciente si no hay uno seleccionado -->
        @if (!paciente()) {
            <div class="border border-surface-300 dark:border-surface-600 rounded p-4 mb-4 bg-surface-0 dark:bg-surface-900">
                <h3 class="mt-0 mb-3 text-lg">Buscar Paciente para Admisión</h3>
                <app-paciente-search (pacienteSelected)="onPacienteSelected($event)" />
            </div>
        }

        <div class="mx-auto" style="max-width: 1000px;">
            <app-form-header
                title="Hoja de Admisión Hospitalaria"
                code="HC·M-002"
                subtitle="Datos del paciente y familiares · diagnóstico de admisión" />
        </div>

        <!-- FORMULARIO TIPO DOCUMENTO -->
        <div class="bg-surface-0 dark:bg-surface-900 p-6 doc-sheet mx-auto" style="max-width: 1000px;">

            <!-- FILA: Datos control + V. Servicios -->
            <div class="grid grid-cols-12 gap-0 border border-surface-300 dark:border-surface-600 text-sm mt-3">
                <!-- Izquierda: Carnets, fecha, hora -->
                <div class="col-span-5 border-r border-surface-300 dark:border-surface-600 p-2">
                    <div class="grid grid-cols-2 gap-y-1 gap-x-2">
                        <label class="font-semibold text-xs">C. Asegurado</label>
                        <input pInputText [(ngModel)]="form.carnetAsegurado" class="w-full p-1 text-sm" />
                        <label class="font-semibold text-xs">C. Beneficiario</label>
                        <input pInputText [(ngModel)]="form.carnetBeneficiario" class="w-full p-1 text-sm" />
                        <label class="font-semibold text-xs">Fecha</label>
                        <input pInputText [(ngModel)]="form.fecha" class="w-full p-1 text-sm" placeholder="DD/MM/YYYY" />
                        <label class="font-semibold text-xs">Hora - Solicitud</label>
                        <input pInputText [(ngModel)]="form.horaSolicitud" class="w-full p-1 text-sm" placeholder="HH:MM" />
                        <label class="font-semibold text-xs">Hora - Entrega</label>
                        <input pInputText [(ngModel)]="form.horaEntrega" class="w-full p-1 text-sm" placeholder="HH:MM" />
                    </div>
                </div>

                <!-- Centro: V. DE SERVICIOS -->
                <div class="col-span-4 border-r border-surface-300 dark:border-surface-600 p-2">
                    <div class="text-center font-bold text-xs mb-2">V. DE SERVICIOS</div>
                    <div class="grid grid-cols-3 gap-1 text-xs">
                        <div class="flex items-center gap-1">
                            <span class="font-semibold">PT 1</span>
                            <p-checkbox [(ngModel)]="form.vServicios.pt1" [binary]="true" />
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-semibold">PIP</span>
                            <p-checkbox [(ngModel)]="form.vServicios.pip" [binary]="true" />
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-semibold">PAPA</span>
                            <p-checkbox [(ngModel)]="form.vServicios.papa" [binary]="true" />
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-semibold">PT 2</span>
                            <p-checkbox [(ngModel)]="form.vServicios.pt2" [binary]="true" />
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-semibold">PIPA</span>
                            <p-checkbox [(ngModel)]="form.vServicios.pipa" [binary]="true" />
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-semibold">PIC</span>
                            <p-checkbox [(ngModel)]="form.vServicios.pic" [binary]="true" />
                        </div>
                    </div>
                </div>

                <!-- Derecha: Estado, Servicio, Cama -->
                <div class="col-span-3 p-2">
                    <div class="grid grid-cols-1 gap-y-1 text-xs">
                        <div>
                            <label class="font-semibold">Estado:</label>
                            <input pInputText [(ngModel)]="form.estado" class="w-full p-1 text-sm" />
                        </div>
                        <div>
                            <label class="font-semibold">Servicio:</label>
                            <input pInputText [(ngModel)]="form.servicio" class="w-full p-1 text-sm" />
                        </div>
                        <div>
                            <label class="font-semibold">Cama:</label>
                            <input pInputText [(ngModel)]="form.cama" class="w-full p-1 text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- DATOS DEL PACIENTE -->
            <div class="border border-surface-300 dark:border-surface-600 mt-3">
                <div class="bg-surface-100 dark:bg-surface-800 text-center font-bold py-1 text-sm border-b border-surface-300 dark:border-surface-600">
                    DATOS DEL PACIENTE
                </div>
                <div class="p-3 text-sm">
                    <!-- Fila 1: Apellidos y Nombres -->
                    <div class="grid grid-cols-4 gap-3 mb-3">
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Ap. Paterno</label>
                            <input pInputText [(ngModel)]="form.apellidoPaterno" class="w-full p-1 text-sm font-semibold" />
                        </div>
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Ap. Materno</label>
                            <input pInputText [(ngModel)]="form.apellidoMaterno" class="w-full p-1 text-sm font-semibold" />
                        </div>
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Ap. Esposo</label>
                            <input pInputText [(ngModel)]="form.apellidoEsposo" class="w-full p-1 text-sm" />
                        </div>
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Nombres</label>
                            <input pInputText [(ngModel)]="form.nombres" class="w-full p-1 text-sm font-semibold" />
                        </div>
                    </div>

                    <!-- Fila 2: Edad, Estado Civil, Sexo -->
                    <div class="grid grid-cols-12 gap-3 mb-3">
                        <div class="col-span-2">
                            <label class="block text-xs text-muted-color mb-1">Edad</label>
                            <div class="flex items-center gap-1">
                                <input pInputText [(ngModel)]="form.edad" class="w-16 p-1 text-sm" />
                                <span class="text-xs">Años</span>
                            </div>
                        </div>
                        <div class="col-span-3">
                            <label class="block text-xs text-muted-color mb-1">Estado Civil</label>
                            <p-select [(ngModel)]="form.estadoCivil" [options]="estadosCiviles" placeholder="Seleccione" styleClass="w-full" size="small" />
                        </div>
                        <div class="col-span-4">
                            <label class="block text-xs text-muted-color mb-1">Sexo</label>
                            <div class="flex gap-3 mt-1">
                                <div class="flex items-center gap-1">
                                    <p-radiobutton [(ngModel)]="form.sexo" value="M" name="sexo" inputId="sM" />
                                    <label for="sM" class="text-xs">MASCULINO</label>
                                </div>
                                <div class="flex items-center gap-1">
                                    <p-radiobutton [(ngModel)]="form.sexo" value="F" name="sexo" inputId="sF" />
                                    <label for="sF" class="text-xs">FEMENINO</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Fila 3: Asegurado (izq) + Datos laborales (der) -->
                    <div class="grid grid-cols-12 gap-3 mb-3">
                        <!-- Tipo Asegurado -->
                        <div class="col-span-3 border-r border-surface-200 dark:border-surface-700 pr-3">
                            <label class="block text-xs font-semibold mb-1">Asegurado</label>
                            <div class="flex flex-col gap-1">
                                @for (tipo of tiposAsegurado; track tipo.value) {
                                    <div class="flex items-center gap-1">
                                        <p-radiobutton [(ngModel)]="form.tipoAsegurado" [value]="tipo.value" name="tipoAseg" [inputId]="'ta' + tipo.value" />
                                        <label [for]="'ta' + tipo.value" class="text-xs">{{ tipo.label }}</label>
                                    </div>
                                }
                            </div>
                        </div>

                        <!-- Datos laborales/militares -->
                        <div class="col-span-6">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-xs text-muted-color mb-1">Lugar de Nacimiento</label>
                                    <input pInputText [(ngModel)]="form.lugarNacimiento" class="w-full p-1 text-sm" />
                                </div>
                                <div>
                                    <label class="block text-xs text-muted-color mb-1">Ocupación</label>
                                    <input pInputText [(ngModel)]="form.ocupacion" class="w-full p-1 text-sm" />
                                </div>
                                <div>
                                    <label class="block text-xs text-muted-color mb-1">Lugar de Trabajo</label>
                                    <input pInputText [(ngModel)]="form.lugarTrabajo" class="w-full p-1 text-sm" />
                                </div>
                                <div>
                                    <label class="block text-xs text-muted-color mb-1">Unidad</label>
                                    <input pInputText [(ngModel)]="form.unidad" class="w-full p-1 text-sm" />
                                </div>
                                <div>
                                    <label class="block text-xs text-muted-color mb-1">Grado</label>
                                    <input pInputText [(ngModel)]="form.grado" class="w-full p-1 text-sm" />
                                </div>
                            </div>
                        </div>

                        <!-- Fuerza -->
                        <div class="col-span-3">
                            <label class="block text-xs font-semibold mb-1">Fuerza:</label>
                            <div class="flex flex-col gap-1">
                                <div class="flex items-center gap-1">
                                    <p-radiobutton [(ngModel)]="form.fuerza" value="EJERCITO" name="fuerza" inputId="fE" />
                                    <label for="fE" class="text-xs">Ejército</label>
                                </div>
                                <div class="flex items-center gap-1">
                                    <p-radiobutton [(ngModel)]="form.fuerza" value="AEREA" name="fuerza" inputId="fA" />
                                    <label for="fA" class="text-xs">Aérea</label>
                                </div>
                                <div class="flex items-center gap-1">
                                    <p-radiobutton [(ngModel)]="form.fuerza" value="NAVAL" name="fuerza" inputId="fN" />
                                    <label for="fN" class="text-xs">Naval</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Fila 4: Seguro -->
                    <div class="flex items-center gap-4 mb-3 border-t border-surface-200 dark:border-surface-700 pt-2">
                        <span class="text-xs font-semibold">Seguro CDS (SEGURO COSSMIL):</span>
                        <div class="flex items-center gap-1">
                            <p-checkbox [(ngModel)]="form.seguroEnfermedad" [binary]="true" inputId="segEnf" />
                            <label for="segEnf" class="text-xs">ENFERMEDAD</label>
                        </div>
                        <div class="flex items-center gap-1">
                            <p-checkbox [(ngModel)]="form.seguroMaternidad" [binary]="true" inputId="segMat" />
                            <label for="segMat" class="text-xs">MATERNIDAD</label>
                        </div>
                        <div class="flex items-center gap-1">
                            <p-checkbox [(ngModel)]="form.seguroRiesgo" [binary]="true" inputId="segRie" />
                            <label for="segRie" class="text-xs">RIESGO PROFESIONAL</label>
                        </div>
                    </div>

                    <!-- Fila 5: Residencia Habitual -->
                    <div class="border-t border-surface-200 dark:border-surface-700 pt-2">
                        <span class="text-xs font-semibold">Residencia Habitual:</span>
                        <div class="grid grid-cols-6 gap-2 mt-1">
                            <div>
                                <label class="block text-xs text-muted-color mb-1">Departamento</label>
                                <p-select [(ngModel)]="form.residencia.departamento" [options]="departamentos" placeholder="Sel." styleClass="w-full" size="small" />
                            </div>
                            <div>
                                <label class="block text-xs text-muted-color mb-1">Provincia</label>
                                <input pInputText [(ngModel)]="form.residencia.provincia" class="w-full p-1 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs text-muted-color mb-1">Localidad</label>
                                <input pInputText [(ngModel)]="form.residencia.localidad" class="w-full p-1 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs text-muted-color mb-1">Zona</label>
                                <input pInputText [(ngModel)]="form.residencia.zona" class="w-full p-1 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs text-muted-color mb-1">Calle</label>
                                <input pInputText [(ngModel)]="form.residencia.calle" class="w-full p-1 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs text-muted-color mb-1">No.</label>
                                <input pInputText [(ngModel)]="form.residencia.numero" class="w-full p-1 text-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DATOS DE LOS FAMILIARES -->
            <div class="border border-surface-300 dark:border-surface-600 mt-3">
                <div class="bg-surface-100 dark:bg-surface-800 text-center font-bold py-1 text-sm border-b border-surface-300 dark:border-surface-600">
                    DATOS DE LOS FAMILIARES
                </div>
                <div class="p-3 text-sm">
                    <div class="grid grid-cols-2 gap-3 mb-2">
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Nombre del Padre</label>
                            <input pInputText [(ngModel)]="form.nombrePadre" class="w-full p-1 text-sm" />
                        </div>
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Nombre de la Madre</label>
                            <input pInputText [(ngModel)]="form.nombreMadre" class="w-full p-1 text-sm" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-2">
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Nombre del Cónyuge</label>
                            <input pInputText [(ngModel)]="form.nombreConyuge" class="w-full p-1 text-sm" />
                        </div>
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Nombre Conviviente</label>
                            <input pInputText [(ngModel)]="form.nombreConviviente" class="w-full p-1 text-sm" />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-3 mb-2">
                        <div class="col-span-8">
                            <label class="block text-xs text-muted-color mb-1">Nombre de la persona más próxima</label>
                            <input pInputText [(ngModel)]="form.personaProxima" class="w-full p-1 text-sm" />
                        </div>
                        <div class="col-span-4">
                            <label class="block text-xs text-muted-color mb-1">Parentesco</label>
                            <input pInputText [(ngModel)]="form.parentescoProximo" class="w-full p-1 text-sm" />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-3 mb-2">
                        <div class="col-span-5">
                            <label class="block text-xs text-muted-color mb-1">Dirección persona más próxima</label>
                            <input pInputText [(ngModel)]="form.direccionProximo" class="w-full p-1 text-sm" />
                        </div>
                        <div class="col-span-3">
                            <label class="block text-xs text-muted-color mb-1">Zona</label>
                            <input pInputText [(ngModel)]="form.zonaProximo" class="w-full p-1 text-sm" />
                        </div>
                        <div class="col-span-2">
                            <label class="block text-xs text-muted-color mb-1">Calle</label>
                            <input pInputText [(ngModel)]="form.calleProximo" class="w-full p-1 text-sm" />
                        </div>
                        <div class="col-span-2">
                            <label class="block text-xs text-muted-color mb-1">No.</label>
                            <input pInputText [(ngModel)]="form.numProximo" class="w-full p-1 text-sm" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-2">
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Teléfono</label>
                            <input pInputText [(ngModel)]="form.telefono" class="w-full p-1 text-sm" />
                        </div>
                        <div>
                            <label class="block text-xs text-muted-color mb-1">Otros Teléfonos</label>
                            <input pInputText [(ngModel)]="form.otrosTelefonos" class="w-full p-1 text-sm" />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-3 border-t border-surface-200 dark:border-surface-700 pt-2">
                        <div class="col-span-6">
                            <label class="block text-xs text-muted-color mb-1">Paciente acompañado por: Nombre</label>
                            <input pInputText [(ngModel)]="form.acompanante" class="w-full p-1 text-sm" />
                        </div>
                        <div class="col-span-3">
                            <label class="block text-xs text-muted-color mb-1">Firma</label>
                            <input pInputText [(ngModel)]="form.firmaAcompanante" class="w-full p-1 text-sm" />
                        </div>
                        <div class="col-span-3">
                            <label class="block text-xs text-muted-color mb-1">C.I.</label>
                            <input pInputText [(ngModel)]="form.ciAcompanante" class="w-full p-1 text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- DIAGNÓSTICO DE ADMISIÓN -->
            <div class="border border-surface-300 dark:border-surface-600 mt-3">
                <div class="bg-surface-100 dark:bg-surface-800 font-bold py-1 px-3 text-sm border-b border-surface-300 dark:border-surface-600">
                    DIAGNÓSTICO DE ADMISIÓN
                </div>
                <div class="p-3">
                    <textarea pTextarea [(ngModel)]="form.diagnosticoAdmision" rows="2" class="w-full text-sm"></textarea>
                </div>
            </div>

            <!-- PIE: Médico y Firmas -->
            <div class="border border-surface-300 dark:border-surface-600 border-t-0 mt-0">
                <div class="p-3 text-sm">
                    <div class="mb-3">
                        <label class="block text-xs text-muted-color mb-1">Médico Quién Interna</label>
                        <input pInputText [(ngModel)]="form.medicoInterna" class="w-full p-1 text-sm" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center border-t border-surface-300 dark:border-surface-600 pt-2">
                            <div class="text-xs font-semibold">FIRMA Y SELLO</div>
                            <div class="text-xs text-muted-color">MEDICO DE EMERGENCIA</div>
                        </div>
                        <div class="text-center border-t border-surface-300 dark:border-surface-600 pt-2">
                            <div class="text-xs font-semibold">FIRMA</div>
                            <label class="block text-xs text-muted-color mb-1">SELLO ADMISIÓN</label>
                            <input pInputText [(ngModel)]="form.selloAdmision" class="w-full p-1 text-sm text-center" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- BOTONES -->
            <div class="flex justify-end gap-2 mt-4">
                <p-button label="Guardar" icon="pi pi-save" (onClick)="onSave()" />
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="onCancel()" />
            </div>
        </div>
    `
})
export class AdmisionComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
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

    estadosCiviles = ['SOLTERO(A)', 'CASADO(A)', 'DIVORCIADO(A)', 'VIUDO(A)', 'UNION LIBRE'];
    departamentos = ['LA PAZ', 'COCHABAMBA', 'SANTA CRUZ', 'ORURO', 'POTOSI', 'CHUQUISACA', 'TARIJA', 'BENI', 'PANDO'];
    tiposAsegurado = [
        { label: 'Activo', value: 'ACTIVO' },
        { label: 'Pasivo', value: 'PASIVO' },
        { label: 'Esposa', value: 'ESPOSA' },
        { label: 'Beneficiario', value: 'BENEFICIARIO' },
        { label: 'Cadete Alumno', value: 'CADETE_ALUMNO' },
        { label: 'Soldado', value: 'SOLDADO' },
        { label: 'Otros', value: 'OTROS' }
    ];

    form: any = {
        carnetAsegurado: '',
        carnetBeneficiario: '',
        fecha: '',
        horaSolicitud: '',
        horaEntrega: '',
        estado: 'REG. EN ADMISION',
        servicio: '',
        cama: '',
        vServicios: { pt1: false, pt2: false, pip: false, pipa: false, papa: false, pic: false },
        // Datos paciente
        apellidoPaterno: '',
        apellidoMaterno: '',
        apellidoEsposo: '',
        nombres: '',
        edad: '',
        estadoCivil: '',
        sexo: '',
        lugarNacimiento: '',
        lugarTrabajo: '',
        ocupacion: '',
        grado: '',
        unidad: '',
        fuerza: '',
        tipoAsegurado: '',
        // Seguro
        seguroEnfermedad: false,
        seguroMaternidad: false,
        seguroRiesgo: false,
        // Residencia
        residencia: { departamento: '', provincia: '', localidad: '', zona: '', calle: '', numero: '' },
        // Familiares
        nombrePadre: '',
        nombreMadre: '',
        nombreConyuge: '',
        nombreConviviente: '',
        personaProxima: '',
        parentescoProximo: '',
        direccionProximo: '',
        zonaProximo: '',
        calleProximo: '',
        numProximo: '',
        telefono: '',
        otrosTelefonos: '',
        acompanante: '',
        firmaAcompanante: '',
        ciAcompanante: '',
        // Diagnóstico
        diagnosticoAdmision: '',
        medicoInterna: '',
        selloAdmision: ''
    };

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.loadPaciente(id);
        });
    }

    ngOnInit(): void {
        const now = new Date();
        this.form.fecha = now.toLocaleDateString('es-BO');
        this.form.horaSolicitud = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    }

    onPacienteSelected(paciente: Paciente) {
        this.loadedId = paciente.id!;
        this.paciente.set(paciente);
        this.pacienteId.set(paciente.id!);
        this.activo.setId(paciente.id!);
        this.fillFormFromPaciente(paciente);
    }

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (data) => {
                this.paciente.set(data);
                this.fillFormFromPaciente(data);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el paciente' })
        });
    }

    private fillFormFromPaciente(p: Paciente) {
        this.form.carnetAsegurado = p.carnetAsegurado;
        this.form.carnetBeneficiario = p.carnetBeneficiario || '';
        this.form.apellidoPaterno = p.apellidoPaterno;
        this.form.apellidoMaterno = p.apellidoMaterno;
        this.form.apellidoEsposo = p.apellidoEsposo || '';
        this.form.nombres = p.nombres;
        this.form.edad = p.edad?.toString() || '';
        this.form.estadoCivil = p.estadoCivil;
        this.form.sexo = p.sexo;
        this.form.lugarNacimiento = p.lugarNacimiento || '';
        this.form.lugarTrabajo = p.lugarTrabajo || '';
        this.form.ocupacion = p.ocupacion || '';
        this.form.grado = p.grado || '';
        this.form.unidad = p.unidad || '';
        this.form.fuerza = p.fuerza || '';
        this.form.tipoAsegurado = p.tipoAsegurado || '';
        if (p.tipoSeguro === 'ENFERMEDAD') this.form.seguroEnfermedad = true;
        if (p.tipoSeguro === 'MATERNIDAD') this.form.seguroMaternidad = true;
        if (p.tipoSeguro === 'RIESGO_PROFESIONAL') this.form.seguroRiesgo = true;
        if (p.residencia) {
            this.form.residencia = { ...p.residencia };
        }
        if (p.datosFamiliares) {
            this.form.nombrePadre = p.datosFamiliares.nombrePadre || '';
            this.form.nombreMadre = p.datosFamiliares.nombreMadre || '';
            this.form.nombreConyuge = p.datosFamiliares.nombreConyuge || '';
            this.form.personaProxima = p.datosFamiliares.personaProxima || '';
            this.form.parentescoProximo = p.datosFamiliares.parentescoProximo || '';
            this.form.direccionProximo = p.datosFamiliares.direccionProximo || '';
            this.form.telefono = p.datosFamiliares.telefono || '';
            this.form.otrosTelefonos = p.datosFamiliares.otrosTelefonos || '';
        }
        if (p.vServicios) {
            this.form.vServicios = { ...p.vServicios };
        }
    }

    onSave() {
        const admision = {
            pacienteId: this.pacienteId(),
            ...this.form
        };

        this.hcService.createAdmision(admision).subscribe({
            next: () => this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Admisión registrada exitosamente' }),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la admisión' })
        });
    }

    onCancel() {
        this.router.navigate(['/app/enfermeria/pacientes']);
    }
}
