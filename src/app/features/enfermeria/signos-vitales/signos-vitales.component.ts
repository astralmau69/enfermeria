import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { PacienteService } from '@/app/core/services/paciente.service';
import { EnfermeriaService } from '@/app/core/services/enfermeria.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { CuadroSignosVitales, DiaSignosVitales, TurnoSignos } from '@/app/core/models/enfermeria.model';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';

@Component({
    selector: 'app-signos-vitales',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        CheckboxModule,
        ToastModule,
        ChartModule,
        FormHeaderComponent,
    ],
    providers: [MessageService],
    template: `
    <p-toast />

    <app-form-header
        title="Cuadro de Signos Vitales"
        code="HCE-002"
        subtitle="Registro gráfico de respiración, pulso y temperatura por turno" />

    @if (cuadro(); as c) {
    <div class="overflow-x-auto p-4 doc-sheet bg-surface-0 dark:bg-surface-900">
        <!-- ==================== FORM HEADER ==================== -->
        <div class="border-2 border-blue-800 mb-0" style="min-width: 900px;">
            <!-- Top bar: Title + Form code -->
            <div class="flex items-center justify-between border-b border-blue-800 px-3 py-1">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 border border-blue-800 flex items-center justify-center text-blue-800 font-bold text-[8px] leading-tight text-center">
                        LOGO
                    </div>
                    <span class="text-blue-800 font-bold text-base tracking-wide">CUADRO DE SIGNOS VITALES</span>
                </div>
                <div class="text-right text-xs text-blue-800">
                    <div class="font-semibold">Form. - HCE - 002</div>
                    <div>Regional</div>
                </div>
            </div>

            <!-- Row: Carnet Asegurado + V. de Servicios line 1 -->
            <div class="flex border-b border-blue-800 text-xs">
                <div class="flex-1 px-2 py-1 border-r border-blue-800 flex items-center gap-1">
                    <span class="text-blue-800 font-semibold whitespace-nowrap">CARNET DE ASEGURADO</span>
                    <input pInputText type="text" [(ngModel)]="c.carnetAsegurado"
                        class="border-b border-blue-800 border-t-0 border-l-0 border-r-0 rounded-none text-xs px-1 py-0 w-40 bg-transparent" />
                </div>
                <div class="flex items-center gap-3 px-2 py-1">
                    <span class="text-blue-800 font-semibold whitespace-nowrap">V. DE SERVICIOS:</span>
                    <label class="flex items-center gap-1 text-blue-800">
                        PT1 <p-checkbox [(ngModel)]="c.vServicios.pt1" [binary]="true" styleClass="scale-75" />
                    </label>
                    <label class="flex items-center gap-1 text-blue-800">
                        PIP <p-checkbox [(ngModel)]="c.vServicios.pip" [binary]="true" styleClass="scale-75" />
                    </label>
                    <label class="flex items-center gap-1 text-blue-800">
                        PAPA <p-checkbox [(ngModel)]="c.vServicios.papa" [binary]="true" styleClass="scale-75" />
                    </label>
                </div>
            </div>

            <!-- Row: Carnet Beneficiario + V. de Servicios line 2 -->
            <div class="flex border-b border-blue-800 text-xs">
                <div class="flex-1 px-2 py-1 border-r border-blue-800 flex items-center gap-1">
                    <span class="text-blue-800 font-semibold whitespace-nowrap">CARNET DE BENEFICIARIO</span>
                    <input pInputText type="text" [(ngModel)]="c.carnetBeneficiario"
                        class="border-b border-blue-800 border-t-0 border-l-0 border-r-0 rounded-none text-xs px-1 py-0 w-40 bg-transparent" />
                </div>
                <div class="flex items-center gap-3 px-2 py-1">
                    <label class="flex items-center gap-1 text-blue-800">
                        PT2 <p-checkbox [(ngModel)]="c.vServicios.pt2" [binary]="true" styleClass="scale-75" />
                    </label>
                    <label class="flex items-center gap-1 text-blue-800">
                        PIPA <p-checkbox [(ngModel)]="c.vServicios.pipa" [binary]="true" styleClass="scale-75" />
                    </label>
                    <label class="flex items-center gap-1 text-blue-800">
                        PIC <p-checkbox [(ngModel)]="c.vServicios.pic" [binary]="true" styleClass="scale-75" />
                    </label>
                </div>
            </div>

            <!-- Row: Patient name fields box -->
            <div class="border-b border-blue-800">
                <div class="grid grid-cols-7 text-xs divide-x divide-blue-800">
                    <div class="px-2 py-1">
                        <div class="text-blue-800 font-semibold text-[10px]">Apellido Paterno</div>
                        <div class="text-sm">{{ paciente()?.apellidoPaterno }}</div>
                    </div>
                    <div class="px-2 py-1">
                        <div class="text-blue-800 font-semibold text-[10px]">Apellido Materno</div>
                        <div class="text-sm">{{ paciente()?.apellidoMaterno }}</div>
                    </div>
                    <div class="px-2 py-1">
                        <div class="text-blue-800 font-semibold text-[10px]">Nombre</div>
                        <div class="text-sm">{{ paciente()?.nombres }}</div>
                    </div>
                    <div class="px-2 py-1">
                        <div class="text-blue-800 font-semibold text-[10px]">Servicio</div>
                        <input pInputText type="text" [(ngModel)]="c.servicio"
                            class="w-full text-xs p-0 border-0 bg-transparent" />
                    </div>
                    <div class="px-2 py-1">
                        <div class="text-blue-800 font-semibold text-[10px]">Sala</div>
                        <input pInputText type="text" [(ngModel)]="c.sala"
                            class="w-full text-xs p-0 border-0 bg-transparent" />
                    </div>
                    <div class="px-2 py-1">
                        <div class="text-blue-800 font-semibold text-[10px]">Cama</div>
                        <input pInputText type="text" [(ngModel)]="c.cama"
                            class="w-full text-xs p-0 border-0 bg-transparent" />
                    </div>
                    <div class="px-2 py-1">
                        <div class="text-blue-800 font-semibold text-[10px]">No. H.C.E.</div>
                        <input pInputText type="text" [(ngModel)]="c.numeroHCE"
                            class="w-full text-xs p-0 border-0 bg-transparent" />
                    </div>
                </div>
            </div>

            <!-- Row: Fecha de Ingreso -->
            <div class="flex items-center gap-2 px-2 py-1 text-xs">
                <span class="text-blue-800 font-semibold">FECHA DE INGRESO:</span>
                <span class="text-blue-800">Día</span>
                <input pInputText type="text" inputmode="numeric" maxlength="2"
                    [ngModel]="getIngresoPart(c.fechaIngreso, 'day')"
                    (ngModelChange)="setIngresoPart(c, 'day', $event)"
                    class="fecha-cell fecha-cell--2 text-xs border border-blue-800 rounded-none" />
                <span class="text-blue-800">Mes</span>
                <input pInputText type="text" inputmode="numeric" maxlength="2"
                    [ngModel]="getIngresoPart(c.fechaIngreso, 'month')"
                    (ngModelChange)="setIngresoPart(c, 'month', $event)"
                    class="fecha-cell fecha-cell--2 text-xs border border-blue-800 rounded-none" />
                <span class="text-blue-800">Año</span>
                <input pInputText type="text" inputmode="numeric" maxlength="4"
                    [ngModel]="getIngresoPart(c.fechaIngreso, 'year')"
                    (ngModelChange)="setIngresoPart(c, 'year', $event)"
                    class="fecha-cell fecha-cell--4 text-xs border border-blue-800 rounded-none" />
            </div>
        </div>

        <!-- ==================== MAIN GRID ==================== -->
        <div class="overflow-x-auto" style="min-width: 900px;">
            <table class="border-collapse text-xs w-full" style="border: 2px solid #1e3a5f;">
                <!-- Header Row 1: FECHA label + day numbers -->
                <thead>
                    <tr>
                        <th colspan="2" rowspan="2"
                            class="border border-blue-800 bg-blue-50 text-blue-800 px-1 py-1 text-center align-middle font-bold"
                            style="min-width: 80px;">
                            FECHA<br/>
                            <span class="text-[9px] font-normal">R &nbsp; P &nbsp; T</span>
                        </th>
                        @for (dia of c.dias; track dia.fecha; let i = $index) {
                            <th colspan="3" class="border border-blue-800 bg-blue-800 text-white px-1 py-1 text-center font-bold">
                                {{ i + 1 }}
                                <div class="text-[9px] font-normal text-blue-200">{{ formatDate(dia.fecha) }}</div>
                            </th>
                        }
                    </tr>
                    <!-- Header Row 2: M T N sub-columns -->
                    <tr>
                        @for (dia of c.dias; track dia.fecha) {
                            <th class="border border-blue-800 bg-blue-700 text-white px-0 py-0 text-center font-semibold" style="width:40px;">M</th>
                            <th class="border border-blue-800 bg-blue-700 text-white px-0 py-0 text-center font-semibold" style="width:40px;">T</th>
                            <th class="border border-blue-800 bg-blue-700 text-white px-0 py-0 text-center font-semibold" style="width:40px;">N</th>
                        }
                    </tr>
                </thead>

                <tbody>
                    <!-- ===== R (Respiracion) scale rows ===== -->
                    @for (val of respiracionScale; track val; let ri = $index) {
                        <tr>
                            @if (ri === 0) {
                                <td [attr.rowspan]="respiracionScale.length"
                                    class="border border-blue-800 bg-blue-50 text-blue-800 font-bold text-center align-middle px-1 writing-vertical"
                                    style="width: 24px; writing-mode: vertical-lr; text-orientation: mixed; transform: rotate(180deg); letter-spacing: 2px;">
                                    R
                                </td>
                            }
                            <td class="border border-blue-800 bg-blue-50 text-blue-800 text-center px-1 py-0 font-semibold" style="width: 30px;">
                                {{ val }}
                            </td>
                            @for (dia of c.dias; track dia.fecha; let di = $index) {
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-green-50]="matchesScale(c.dias[di].turnos.manana.respiracion, val, respiracionScale)">
                                    @if (ri === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.manana.respiracion"
                                            [showButtons]="false"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-green-50]="matchesScale(c.dias[di].turnos.tarde.respiracion, val, respiracionScale)">
                                    @if (ri === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.tarde.respiracion"
                                            [showButtons]="false"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-green-50]="matchesScale(c.dias[di].turnos.noche.respiracion, val, respiracionScale)">
                                    @if (ri === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.noche.respiracion"
                                            [showButtons]="false"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                            }
                        </tr>
                    }

                    <!-- ===== P (Pulso) scale rows ===== -->
                    @for (val of pulsoScale; track val; let pi = $index) {
                        <tr>
                            @if (pi === 0) {
                                <td [attr.rowspan]="pulsoScale.length"
                                    class="border border-blue-800 bg-red-50 text-red-700 font-bold text-center align-middle px-1"
                                    style="width: 24px; writing-mode: vertical-lr; text-orientation: mixed; transform: rotate(180deg); letter-spacing: 2px;">
                                    P
                                </td>
                            }
                            <td class="border border-blue-800 bg-red-50 text-red-700 text-center px-1 py-0 font-semibold" style="width: 30px;">
                                {{ val }}
                            </td>
                            @for (dia of c.dias; track dia.fecha; let di = $index) {
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-red-100]="matchesScale(c.dias[di].turnos.manana.pulso, val, pulsoScale)"
                                    [class.bg-red-200]="isPulsoAnormal(c.dias[di].turnos.manana.pulso) && matchesScale(c.dias[di].turnos.manana.pulso, val, pulsoScale)">
                                    @if (pi === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.manana.pulso"
                                            [showButtons]="false"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            [ngClass]="{'!text-red-600 font-bold': isPulsoAnormal(c.dias[di].turnos.manana.pulso)}"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-red-100]="matchesScale(c.dias[di].turnos.tarde.pulso, val, pulsoScale)"
                                    [class.bg-red-200]="isPulsoAnormal(c.dias[di].turnos.tarde.pulso) && matchesScale(c.dias[di].turnos.tarde.pulso, val, pulsoScale)">
                                    @if (pi === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.tarde.pulso"
                                            [showButtons]="false"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            [ngClass]="{'!text-red-600 font-bold': isPulsoAnormal(c.dias[di].turnos.tarde.pulso)}"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-red-100]="matchesScale(c.dias[di].turnos.noche.pulso, val, pulsoScale)"
                                    [class.bg-red-200]="isPulsoAnormal(c.dias[di].turnos.noche.pulso) && matchesScale(c.dias[di].turnos.noche.pulso, val, pulsoScale)">
                                    @if (pi === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.noche.pulso"
                                            [showButtons]="false"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            [ngClass]="{'!text-red-600 font-bold': isPulsoAnormal(c.dias[di].turnos.noche.pulso)}"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                            }
                        </tr>
                    }

                    <!-- ===== T (Temperatura) scale rows ===== -->
                    @for (val of temperaturaScale; track val; let ti = $index) {
                        <tr>
                            @if (ti === 0) {
                                <td [attr.rowspan]="temperaturaScale.length"
                                    class="border border-blue-800 bg-orange-50 text-orange-700 font-bold text-center align-middle px-1"
                                    style="width: 24px; writing-mode: vertical-lr; text-orientation: mixed; transform: rotate(180deg); letter-spacing: 2px;">
                                    T°
                                </td>
                            }
                            <td class="border border-blue-800 bg-orange-50 text-orange-700 text-center px-1 py-0 font-semibold" style="width: 30px;">
                                {{ val }}°
                            </td>
                            @for (dia of c.dias; track dia.fecha; let di = $index) {
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-orange-100]="matchesScaleTemp(c.dias[di].turnos.manana.temperatura, val, temperaturaScale)"
                                    [class.bg-red-200]="isTemperaturaAnormal(c.dias[di].turnos.manana.temperatura) && matchesScaleTemp(c.dias[di].turnos.manana.temperatura, val, temperaturaScale)">
                                    @if (ti === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.manana.temperatura"
                                            [showButtons]="false"
                                            [minFractionDigits]="1" [maxFractionDigits]="1"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            [ngClass]="{'!text-red-600 font-bold': isTemperaturaAnormal(c.dias[di].turnos.manana.temperatura)}"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-orange-100]="matchesScaleTemp(c.dias[di].turnos.tarde.temperatura, val, temperaturaScale)"
                                    [class.bg-red-200]="isTemperaturaAnormal(c.dias[di].turnos.tarde.temperatura) && matchesScaleTemp(c.dias[di].turnos.tarde.temperatura, val, temperaturaScale)">
                                    @if (ti === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.tarde.temperatura"
                                            [showButtons]="false"
                                            [minFractionDigits]="1" [maxFractionDigits]="1"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            [ngClass]="{'!text-red-600 font-bold': isTemperaturaAnormal(c.dias[di].turnos.tarde.temperatura)}"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                                <td class="border border-blue-800 px-0 py-0"
                                    [class.bg-orange-100]="matchesScaleTemp(c.dias[di].turnos.noche.temperatura, val, temperaturaScale)"
                                    [class.bg-red-200]="isTemperaturaAnormal(c.dias[di].turnos.noche.temperatura) && matchesScaleTemp(c.dias[di].turnos.noche.temperatura, val, temperaturaScale)">
                                    @if (ti === 3) {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].turnos.noche.temperatura"
                                            [showButtons]="false"
                                            [minFractionDigits]="1" [maxFractionDigits]="1"
                                            inputStyleClass="w-full text-xs text-center border-0 p-0"
                                            [ngClass]="{'!text-red-600 font-bold': isTemperaturaAnormal(c.dias[di].turnos.noche.temperatura)}"
                                            styleClass="w-[40px]"
                                        />
                                    }
                                </td>
                            }
                        </tr>
                    }

                    <!-- ===== BELOW-GRID ROWS (one per day, colspan=3) ===== -->
                    @for (row of belowGridRows; track row.key) {
                        <tr>
                            <td colspan="2" class="border border-blue-800 bg-gray-50 text-blue-800 font-semibold px-2 py-1 text-left">
                                {{ row.label }}
                            </td>
                            @for (dia of c.dias; track dia.fecha; let di = $index) {
                                <td colspan="3" class="border border-blue-800 px-0 py-0">
                                    @if (row.key === 'peso') {
                                        <p-inputNumber
                                            [(ngModel)]="c.dias[di].peso"
                                            [showButtons]="false"
                                            [minFractionDigits]="1" [maxFractionDigits]="1"
                                            inputStyleClass="w-full text-xs text-center border-0 p-1"
                                            styleClass="w-full"
                                        />
                                    } @else {
                                        <input pInputText type="text"
                                            [(ngModel)]="c.dias[di][row.key]"
                                            class="w-full text-xs text-center border-0 p-1"
                                        />
                                    }
                                </td>
                            }
                        </tr>
                    }
                </tbody>
            </table>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-end mt-3 gap-2">
            <p-button
                label="Agregar Dia"
                icon="pi pi-plus"
                severity="success"
                (onClick)="agregarDia()"
                size="small"
            />
            <p-button
                label="Guardar"
                icon="pi pi-save"
                (onClick)="guardar()"
                size="small"
            />
        </div>

        <!-- ==================== CHART ==================== -->
        @if (chartData()) {
            <div class="mt-6 border border-gray-300 rounded p-3">
                <h3 class="text-sm font-semibold text-blue-800 mb-2">Grafico de Temperatura y Pulso</h3>
                <p-chart type="line" [data]="chartData()!" [options]="chartOptions" height="350px" />
            </div>
        }
    </div>
    } @else {
        <div class="text-center text-gray-500 py-8">
            <i class="pi pi-spin pi-spinner text-2xl mb-2"></i>
            <p>Cargando datos de signos vitales...</p>
        </div>
    }
    `,
})
export class SignosVitalesComponent {
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
    cuadro = signal<CuadroSignosVitales | null>(null);

    /** Scale values displayed on the left side of the grid (top to bottom = high to low) */
    readonly respiracionScale = [70, 60, 50, 40, 30, 20, 18];
    readonly pulsoScale = [160, 140, 120, 100, 80, 60, 40];
    readonly temperaturaScale = [41, 40, 39, 38, 37, 36, 35];

    readonly belowGridRows: { key: string; label: string }[] = [
        { key: 'peso', label: 'Peso' },
        { key: 'dieta', label: 'Dieta' },
        { key: 'presionArterial', label: 'Presion Arterial' },
        { key: 'orina', label: 'Orina' },
        { key: 'evacuaciones', label: 'Evacuaciones' },
        { key: 'vomitos', label: 'Vomitos' },
        { key: 'observaciones', label: 'Observaciones' },
    ];

    chartData = computed(() => {
        const c = this.cuadro();
        if (!c || !c.dias.length) return null;
        return this.buildChartData(c.dias);
    });

    chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: { display: true, position: 'top' as const },
            tooltip: { enabled: true },
        },
        scales: {
            x: {
                title: { display: true, text: 'Dia / Turno' },
            },
            yPulso: {
                type: 'linear' as const,
                position: 'left' as const,
                min: 40,
                max: 160,
                title: { display: true, text: 'Pulso (lpm)' },
                grid: { drawOnChartArea: true },
            },
            yTemp: {
                type: 'linear' as const,
                position: 'right' as const,
                min: 35,
                max: 41,
                title: { display: true, text: 'Temperatura (°C)' },
                grid: { drawOnChartArea: false },
            },
        },
    };

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.loadPaciente(id);
            this.loadSignosVitales(id);
        });
    }

    // ── Header helpers ──

    getIngresoPart(fecha: string, part: 'day' | 'month' | 'year'): string {
        if (!fecha) return '';
        const parts = fecha.split('-');
        if (parts.length !== 3) return '';
        if (part === 'year') return parts[0];
        if (part === 'month') return parts[1];
        return parts[2];
    }

    setIngresoPart(cuadro: CuadroSignosVitales, part: 'day' | 'month' | 'year', value: string): void {
        const parts = (cuadro.fechaIngreso || '0000-00-00').split('-');
        if (parts.length !== 3) return;
        if (part === 'year') parts[0] = value;
        else if (part === 'month') parts[1] = value.padStart(2, '0');
        else parts[2] = value.padStart(2, '0');
        cuadro.fechaIngreso = parts.join('-');
    }

    // ── Scale matching ──

    /** Returns true if the value falls into the bucket closest to `scaleVal` in the given scale. */
    matchesScale(value: number | undefined, scaleVal: number, scale: number[]): boolean {
        if (value == null) return false;
        return this.closestScale(value, scale) === scaleVal;
    }

    matchesScaleTemp(value: number | undefined, scaleVal: number, scale: number[]): boolean {
        if (value == null) return false;
        const rounded = Math.round(value);
        return this.closestScale(rounded, scale) === scaleVal;
    }

    private closestScale(value: number, scale: number[]): number {
        let closest = scale[0];
        let minDiff = Math.abs(value - closest);
        for (const s of scale) {
            const diff = Math.abs(value - s);
            if (diff < minDiff) {
                minDiff = diff;
                closest = s;
            }
        }
        return closest;
    }

    // ── Abnormal value checks ──

    isPulsoAnormal(pulso: number | undefined): boolean {
        if (pulso == null) return false;
        return pulso > 100 || pulso < 50;
    }

    isTemperaturaAnormal(temp: number | undefined): boolean {
        if (temp == null) return false;
        return temp > 38;
    }

    // ── Actions ──

    agregarDia(): void {
        const c = this.cuadro();
        if (!c) return;

        const hoy = new Date();
        if (c.dias.length > 0) {
            const ultimaFecha = new Date(c.dias[c.dias.length - 1].fecha);
            hoy.setTime(ultimaFecha.getTime() + 86400000);
        }

        const nuevoDia: DiaSignosVitales = {
            fecha: hoy.toISOString().split('T')[0],
            turnos: {
                manana: {},
                tarde: {},
                noche: {},
            },
        };

        this.cuadro.set({
            ...c,
            dias: [...c.dias, nuevoDia],
        });

        this.messageService.add({
            severity: 'info',
            summary: 'Dia agregado',
            detail: `Se agrego el dia ${this.formatDate(nuevoDia.fecha)}`,
        });
    }

    guardar(): void {
        const c = this.cuadro();
        if (!c) return;

        this.enfermeriaService.saveSignosVitales(c).subscribe({
            next: (saved) => {
                this.cuadro.set(saved);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: 'Signos vitales guardados correctamente',
                });
            },
            error: () => this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron guardar los signos vitales',
            }),
        });
    }

    formatDate(fecha: string): string {
        if (!fecha) return '';
        const parts = fecha.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
        return fecha;
    }

    // ── Private ──

    private loadPaciente(id: number): void {
        this.pacienteService.getById(id).subscribe({
            next: (p) => this.paciente.set(p),
            error: () => this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cargar los datos del paciente',
            }),
        });
    }

    private loadSignosVitales(id: number): void {
        this.enfermeriaService.getSignosVitalesByPaciente(id).subscribe({
            next: (data) => this.cuadro.set(data),
            error: () => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Sin datos',
                    detail: 'No se encontraron signos vitales. Se creo un cuadro vacio.',
                });
                this.cuadro.set(this.crearCuadroVacio(id));
            },
        });
    }

    private crearCuadroVacio(pacienteId: number): CuadroSignosVitales {
        return {
            pacienteId,
            carnetAsegurado: this.paciente()?.carnetAsegurado ?? '',
            carnetBeneficiario: this.paciente()?.carnetBeneficiario,
            vServicios: this.paciente()?.vServicios ?? {
                pt1: false, pt2: false, pip: false, pipa: false, papa: false, pic: false,
            },
            servicio: '',
            sala: '',
            cama: '',
            numeroHCE: '',
            fechaIngreso: new Date().toISOString().split('T')[0],
            dias: [],
        };
    }

    private buildChartData(dias: DiaSignosVitales[]): any {
        const labels: string[] = [];
        const tempData: (number | null)[] = [];
        const pulsoData: (number | null)[] = [];

        for (let i = 0; i < dias.length; i++) {
            const dia = dias[i];
            const dayNum = i + 1;

            const turnos: { key: keyof typeof dia.turnos; label: string }[] = [
                { key: 'manana', label: 'M' },
                { key: 'tarde', label: 'T' },
                { key: 'noche', label: 'N' },
            ];

            for (const turno of turnos) {
                labels.push(`${dayNum} ${turno.label}`);
                const t = dia.turnos[turno.key];
                tempData.push(t.temperatura ?? null);
                pulsoData.push(t.pulso ?? null);
            }
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Pulso (lpm)',
                    data: pulsoData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    yAxisID: 'yPulso',
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    spanGaps: true,
                },
                {
                    label: 'Temperatura (°C)',
                    data: tempData,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    yAxisID: 'yTemp',
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    spanGaps: true,
                },
            ],
        };
    }
}
