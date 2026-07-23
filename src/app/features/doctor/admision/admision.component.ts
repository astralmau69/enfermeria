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
        RadioButtonModule, CheckboxModule,
        ToastModule, PacienteSearchComponent, FormHeaderComponent
    ],
    providers: [MessageService],
    styles: [`
        /* ── Secciones del formulario ─────────────────────────────────────── */
        .form-section {
            margin-bottom: 1.5rem;
        }
        .form-section__title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-family: var(--font-display, 'Saira', sans-serif);
            font-weight: 700;
            font-size: 0.82rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--p-primary-600);
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--p-surface-200);
            margin-bottom: 1rem;
        }
        :host-context(.app-dark) .form-section__title {
            color: var(--p-primary-300);
            border-bottom-color: var(--p-surface-700);
        }
        .form-section__body {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }

        /* ── Firmas al pie ────────────────────────────────────────────────── */
        .firma-box {
            text-align: center;
            padding-top: 0.75rem;
            border-top: 1px solid var(--p-surface-300);
        }
        :host-context(.app-dark) .firma-box {
            border-top-color: var(--p-surface-600);
        }
        .firma-box__label {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--p-text-muted-color);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        /* ── Bloque de paciente vacío ─────────────────────────────────────── */
        .search-card {
            border: 1px solid var(--p-surface-200);
            border-radius: 0.85rem;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
            background: var(--p-surface-0);
        }
        :host-context(.app-dark) .search-card {
            background: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }
        .search-card__title {
            font-family: var(--font-display, 'Saira', sans-serif);
            font-weight: 700;
            font-size: 1rem;
            margin: 0 0 1rem 0;
            color: var(--p-text-color);
        }

        /* ── Grids de checkboxes y radios ─────────────────────────────────── */
        .check-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.6rem;
        }
        .check-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .radio-col {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .radio-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.87rem;
        }
        .seguro-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1.25rem;
            align-items: center;
        }
        .seguro-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.87rem;
        }

        /* ── Campo span-completo en grid ──────────────────────────────────── */
        .field-full { grid-column: 1 / -1; }

        /* ── Sheet wrapper ────────────────────────────────────────────────── */
        .sheet-wrap {
            max-width: 1000px;
            margin: 0 auto;
        }
    `],
    template: `
        <p-toast />

        <!-- Buscar paciente si no hay uno seleccionado -->
        @if (!paciente()) {
            <div class="search-card sheet-wrap">
                <h3 class="search-card__title">
                    <i class="pi pi-search mr-2"></i>Buscar Paciente para Admisión
                </h3>
                <app-paciente-search (pacienteSelected)="onPacienteSelected($event)" />
            </div>
        }

        <div class="sheet-wrap">
            <!-- Cabecera institucional -->
            <app-form-header
                title="Hoja de Admisión Hospitalaria"
                code="HC·M-002"
                subtitle="Datos del paciente y familiares · diagnóstico de admisión" />

            <!-- Barra de paciente activo -->
            @if (paciente()) {
                <div class="pac-bar">
                    <div class="pac-bar__info">
                        <div class="pac-bar__name">
                            {{ form.apellidoPaterno }} {{ form.apellidoMaterno }}{{ form.apellidoEsposo ? ' de ' + form.apellidoEsposo : '' }}, {{ form.nombres }}
                        </div>
                        <div class="pac-bar__meta font-mono text-xs">
                            CI {{ form.carnetAsegurado || '—' }} · Cama {{ form.cama || 'sin asignar' }} · {{ form.servicio || 'Servicio pendiente' }}
                        </div>
                    </div>
                    <span class="form-code-badge">HC·M-002</span>
                </div>
            }

            <!-- FORMULARIO PRINCIPAL -->
            <div class="bg-surface-0 dark:bg-surface-900 p-6 doc-sheet">

                <!-- ── SECCIÓN 1: Datos de Ingreso ─────────────────────────── -->
                <div class="form-section">
                    <div class="form-section__title">
                        <i class="pi pi-calendar"></i> Datos de Ingreso
                    </div>
                    <div class="form-section__body">

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="fecha">Fecha de Admisión</label>
                            <input type="date" pInputText id="fecha" [(ngModel)]="form.fecha" />
                            <span class="field-hint">Fecha en que se registra el ingreso del paciente.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="horaSolicitud">Hora — Solicitud</label>
                            <input type="time" pInputText id="horaSolicitud" [(ngModel)]="form.horaSolicitud" />
                            <span class="field-hint">Hora en que se solicitó la admisión al servicio.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="horaEntrega">Hora — Entrega</label>
                            <input type="time" pInputText id="horaEntrega" [(ngModel)]="form.horaEntrega" />
                            <span class="field-hint">Hora en que la enfermería recibió al paciente en el piso.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="carnetAsegurado">Carnet Asegurado</label>
                            <input pInputText id="carnetAsegurado" [(ngModel)]="form.carnetAsegurado"
                                   placeholder="Ej.: 1234567" />
                            <span class="field-hint">Número de carnet del titular del seguro COSSMIL.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="carnetBeneficiario">Carnet Beneficiario</label>
                            <input pInputText id="carnetBeneficiario" [(ngModel)]="form.carnetBeneficiario"
                                   placeholder="Ej.: 7654321" />
                            <span class="field-hint">Solo si el paciente es beneficiario (no el titular).</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="estado">Estado</label>
                            <input pInputText id="estado" [(ngModel)]="form.estado" />
                            <span class="field-hint">Estado del trámite al momento del ingreso.</span>
                        </div>

                    </div>
                </div>

                <!-- ── SECCIÓN 2: V. de Servicios ──────────────────────────── -->
                <div class="form-section">
                    <div class="form-section__title">
                        <i class="pi pi-check-square"></i> V. de Servicios
                    </div>
                    <div class="check-grid" style="max-width: 380px;">
                        <div class="check-item">
                            <p-checkbox [(ngModel)]="form.vServicios.pt1" [binary]="true" inputId="vPT1" />
                            <label for="vPT1">PT 1</label>
                        </div>
                        <div class="check-item">
                            <p-checkbox [(ngModel)]="form.vServicios.pip" [binary]="true" inputId="vPIP" />
                            <label for="vPIP">PIP</label>
                        </div>
                        <div class="check-item">
                            <p-checkbox [(ngModel)]="form.vServicios.papa" [binary]="true" inputId="vPAPA" />
                            <label for="vPAPA">PAPA</label>
                        </div>
                        <div class="check-item">
                            <p-checkbox [(ngModel)]="form.vServicios.pt2" [binary]="true" inputId="vPT2" />
                            <label for="vPT2">PT 2</label>
                        </div>
                        <div class="check-item">
                            <p-checkbox [(ngModel)]="form.vServicios.pipa" [binary]="true" inputId="vPIPA" />
                            <label for="vPIPA">PIPA</label>
                        </div>
                        <div class="check-item">
                            <p-checkbox [(ngModel)]="form.vServicios.pic" [binary]="true" inputId="vPIC" />
                            <label for="vPIC">PIC</label>
                        </div>
                    </div>
                </div>

                <!-- ── SECCIÓN 3: Datos del Paciente ───────────────────────── -->
                <div class="form-section">
                    <div class="form-section__title">
                        <i class="pi pi-user"></i> Datos del Paciente
                    </div>
                    <div class="form-section__body">

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="apPaterno">Apellido Paterno</label>
                            <input pInputText id="apPaterno" [(ngModel)]="form.apellidoPaterno"
                                   placeholder="Ej.: Mamani" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="apMaterno">Apellido Materno</label>
                            <input pInputText id="apMaterno" [(ngModel)]="form.apellidoMaterno"
                                   placeholder="Ej.: Quispe" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="apEsposo">Apellido de Esposo/a</label>
                            <input pInputText id="apEsposo" [(ngModel)]="form.apellidoEsposo"
                                   placeholder="Solo si aplica" />
                            <span class="field-hint">Apellido adquirido por matrimonio (de casada).</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="nombres">Nombres</label>
                            <input pInputText id="nombres" [(ngModel)]="form.nombres"
                                   placeholder="Ej.: Juan Carlos" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="edad">Edad (años)</label>
                            <input pInputText id="edad" [(ngModel)]="form.edad"
                                   placeholder="Ej.: 45" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="estadoCivil">Estado Civil</label>
                            <p-select id="estadoCivil" [(ngModel)]="form.estadoCivil"
                                      [options]="estadosCiviles" placeholder="Seleccione"
                                      styleClass="w-full" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req">Sexo</label>
                            <div class="flex gap-4 mt-1">
                                <div class="radio-item">
                                    <p-radiobutton [(ngModel)]="form.sexo" value="M" name="sexo" inputId="sM" />
                                    <label for="sM">Masculino</label>
                                </div>
                                <div class="radio-item">
                                    <p-radiobutton [(ngModel)]="form.sexo" value="F" name="sexo" inputId="sF" />
                                    <label for="sF">Femenino</label>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="lugNacimiento">Lugar de Nacimiento</label>
                            <input pInputText id="lugNacimiento" [(ngModel)]="form.lugarNacimiento"
                                   placeholder="Ej.: La Paz" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="ocupacion">Ocupación</label>
                            <input pInputText id="ocupacion" [(ngModel)]="form.ocupacion"
                                   placeholder="Ej.: Docente" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="lugTrabajo">Lugar de Trabajo</label>
                            <input pInputText id="lugTrabajo" [(ngModel)]="form.lugarTrabajo"
                                   placeholder="Ej.: EB Calama" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="unidad">Unidad</label>
                            <input pInputText id="unidad" [(ngModel)]="form.unidad"
                                   placeholder="Ej.: RIAC-1" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="grado">Grado</label>
                            <input pInputText id="grado" [(ngModel)]="form.grado"
                                   placeholder="Ej.: Capitán" />
                        </div>

                    </div>

                    <!-- Tipo Asegurado + Fuerza + Seguro CDS -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">

                        <div class="flex flex-col gap-1">
                            <label class="field-label">Tipo de Asegurado</label>
                            <div class="radio-col mt-1">
                                @for (tipo of tiposAsegurado; track tipo.value) {
                                    <div class="radio-item">
                                        <p-radiobutton [(ngModel)]="form.tipoAsegurado"
                                                       [value]="tipo.value"
                                                       name="tipoAseg"
                                                       [inputId]="'ta' + tipo.value" />
                                        <label [for]="'ta' + tipo.value">{{ tipo.label }}</label>
                                    </div>
                                }
                            </div>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label">Fuerza Armada</label>
                            <div class="radio-col mt-1">
                                <div class="radio-item">
                                    <p-radiobutton [(ngModel)]="form.fuerza" value="EJERCITO" name="fuerza" inputId="fE" />
                                    <label for="fE">Ejército</label>
                                </div>
                                <div class="radio-item">
                                    <p-radiobutton [(ngModel)]="form.fuerza" value="AEREA" name="fuerza" inputId="fA" />
                                    <label for="fA">Aérea</label>
                                </div>
                                <div class="radio-item">
                                    <p-radiobutton [(ngModel)]="form.fuerza" value="NAVAL" name="fuerza" inputId="fN" />
                                    <label for="fN">Naval</label>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label">Seguro CDS (COSSMIL)</label>
                            <div class="flex flex-col gap-2 mt-1">
                                <div class="seguro-item">
                                    <p-checkbox [(ngModel)]="form.seguroEnfermedad" [binary]="true" inputId="segEnf" />
                                    <label for="segEnf">Enfermedad</label>
                                </div>
                                <div class="seguro-item">
                                    <p-checkbox [(ngModel)]="form.seguroMaternidad" [binary]="true" inputId="segMat" />
                                    <label for="segMat">Maternidad</label>
                                </div>
                                <div class="seguro-item">
                                    <p-checkbox [(ngModel)]="form.seguroRiesgo" [binary]="true" inputId="segRie" />
                                    <label for="segRie">Riesgo Profesional</label>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Residencia habitual -->
                    <div class="mt-4">
                        <label class="field-label" style="display:block;margin-bottom:0.75rem;">
                            <i class="pi pi-map-marker mr-1"></i>Residencia Habitual
                        </label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="field-label" for="resDepto">Departamento</label>
                                <p-select id="resDepto" [(ngModel)]="form.residencia.departamento"
                                          [options]="departamentos" placeholder="Seleccione"
                                          styleClass="w-full" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="field-label" for="resProv">Provincia</label>
                                <input pInputText id="resProv" [(ngModel)]="form.residencia.provincia"
                                       placeholder="Ej.: Murillo" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="field-label" for="resLoc">Localidad</label>
                                <input pInputText id="resLoc" [(ngModel)]="form.residencia.localidad"
                                       placeholder="Ej.: La Paz" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="field-label" for="resZona">Zona</label>
                                <input pInputText id="resZona" [(ngModel)]="form.residencia.zona"
                                       placeholder="Ej.: Villa Copacabana" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="field-label" for="resCalle">Calle</label>
                                <input pInputText id="resCalle" [(ngModel)]="form.residencia.calle"
                                       placeholder="Ej.: Av. 6 de Agosto" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="field-label" for="resNum">No.</label>
                                <input pInputText id="resNum" [(ngModel)]="form.residencia.numero"
                                       placeholder="Ej.: 1234" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── SECCIÓN 4: Diagnóstico de Admisión ──────────────────── -->
                <div class="form-section">
                    <div class="form-section__title">
                        <i class="pi pi-heart-fill"></i> Diagnóstico de Admisión
                    </div>
                    <div class="form-section__body">

                        <div class="flex flex-col gap-1 field-full">
                            <label class="field-label req" for="diagnostico">Diagnóstico</label>
                            <textarea pTextarea id="diagnostico" [(ngModel)]="form.diagnosticoAdmision"
                                      rows="3" class="w-full"
                                      placeholder="Describa el diagnóstico principal al momento del ingreso..."></textarea>
                            <span class="field-hint">Diagnóstico principal al momento del ingreso. Incluya CIE-10 si conoce (ej.: J18.9 Neumonía, no especificada).</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="servicio">Servicio de Hospitalización</label>
                            <input pInputText id="servicio" [(ngModel)]="form.servicio"
                                   placeholder="Ej.: Cirugía General" />
                            <span class="field-hint">Servicio de hospitalización al que ingresa el paciente.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="cama">Número de Cama</label>
                            <input pInputText id="cama" [(ngModel)]="form.cama"
                                   placeholder="Ej.: 101-A" />
                            <span class="field-hint">Cama asignada en el piso de hospitalización.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="medicoInterna">Médico que Interna</label>
                            <input pInputText id="medicoInterna" [(ngModel)]="form.medicoInterna"
                                   placeholder="Ej.: Dr. Vargas" />
                            <span class="field-hint">Nombre del médico de emergencia o especialista que ordena el ingreso.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="selloAdmision">Sello de Admisión</label>
                            <input pInputText id="selloAdmision" [(ngModel)]="form.selloAdmision"
                                   placeholder="Código o nombre del operador" />
                            <span class="field-hint">Sello o identificación del operador de admisiones.</span>
                        </div>

                    </div>

                    <!-- Firmas al pie -->
                    <div class="grid grid-cols-2 gap-6 mt-6">
                        <div class="firma-box">
                            <div class="firma-box__label">Firma y Sello</div>
                            <div class="field-hint mt-1">Médico de Emergencia</div>
                        </div>
                        <div class="firma-box">
                            <div class="firma-box__label">Firma</div>
                            <div class="field-hint mt-1">Enfermera de Admisión</div>
                        </div>
                    </div>
                </div>

                <!-- ── SECCIÓN 5: Familiares y Contacto de Emergencia ──────── -->
                <div class="form-section">
                    <div class="form-section__title">
                        <i class="pi pi-users"></i> Familiares y Contacto de Emergencia
                    </div>
                    <div class="form-section__body">

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="nombrePadre">Nombre del Padre</label>
                            <input pInputText id="nombrePadre" [(ngModel)]="form.nombrePadre"
                                   placeholder="Nombre completo" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="nombreMadre">Nombre de la Madre</label>
                            <input pInputText id="nombreMadre" [(ngModel)]="form.nombreMadre"
                                   placeholder="Nombre completo" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="nombreConyuge">Nombre del Cónyuge</label>
                            <input pInputText id="nombreConyuge" [(ngModel)]="form.nombreConyuge"
                                   placeholder="Nombre completo" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="nombreConviviente">Nombre del Conviviente</label>
                            <input pInputText id="nombreConviviente" [(ngModel)]="form.nombreConviviente"
                                   placeholder="Nombre completo" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label req" for="personaProxima">Persona más Próxima</label>
                            <input pInputText id="personaProxima" [(ngModel)]="form.personaProxima"
                                   placeholder="Nombre completo del contacto de emergencia" />
                            <span class="field-hint">Familiar o persona de confianza a quien avisar en caso de emergencia.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="parentescoProximo">Parentesco</label>
                            <input pInputText id="parentescoProximo" [(ngModel)]="form.parentescoProximo"
                                   placeholder="Ej.: Hijo, Esposa, Hermano" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="telefono">Teléfono Principal</label>
                            <input pInputText id="telefono" [(ngModel)]="form.telefono"
                                   placeholder="Ej.: 70012345" />
                            <span class="field-hint">Teléfono celular o fijo del contacto de emergencia.</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="otrosTelefonos">Otros Teléfonos</label>
                            <input pInputText id="otrosTelefonos" [(ngModel)]="form.otrosTelefonos"
                                   placeholder="Ej.: 22345678 / 71234567" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="direccionProximo">Dirección</label>
                            <input pInputText id="direccionProximo" [(ngModel)]="form.direccionProximo"
                                   placeholder="Calle y número del contacto de emergencia" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="zonaProximo">Zona</label>
                            <input pInputText id="zonaProximo" [(ngModel)]="form.zonaProximo"
                                   placeholder="Ej.: Sopocachi" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="calleProximo">Calle</label>
                            <input pInputText id="calleProximo" [(ngModel)]="form.calleProximo"
                                   placeholder="Ej.: Av. Arce" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="numProximo">No.</label>
                            <input pInputText id="numProximo" [(ngModel)]="form.numProximo"
                                   placeholder="Ej.: 2456" />
                        </div>

                    </div>

                    <!-- Acompañante -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4"
                         style="border-top: 1px solid var(--p-surface-200);">
                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="acompanante">Acompañante al Ingreso</label>
                            <input pInputText id="acompanante" [(ngModel)]="form.acompanante"
                                   placeholder="Nombre completo" />
                            <span class="field-hint">Persona que acompaña al paciente en el momento del ingreso.</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="firmaAcompanante">Firma</label>
                            <input pInputText id="firmaAcompanante" [(ngModel)]="form.firmaAcompanante"
                                   placeholder="Firma del acompañante" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="field-label" for="ciAcompanante">C.I. Acompañante</label>
                            <input pInputText id="ciAcompanante" [(ngModel)]="form.ciAcompanante"
                                   placeholder="Ej.: 8765432" />
                        </div>
                    </div>
                </div>

                <!-- ── BOTONES ──────────────────────────────────────────────── -->
                <div class="flex justify-end gap-2 mt-2">
                    <p-button
                        label="Cancelar"
                        icon="pi pi-times"
                        severity="secondary"
                        (onClick)="onCancel()" />
                    <p-button
                        label="Guardar Admisión"
                        icon="pi pi-save"
                        [loading]="guardando()"
                        (onClick)="onSave()" />
                </div>

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
    guardando = signal<boolean>(false);

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
        // type="date" espera formato YYYY-MM-DD
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        this.form.fecha = `${yyyy}-${mm}-${dd}`;
        // type="time" espera formato HH:MM
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        this.form.horaSolicitud = `${hh}:${min}`;
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
        this.guardando.set(true);
        const admision = {
            pacienteId: this.pacienteId(),
            ...this.form
        };

        this.hcService.createAdmision(admision).subscribe({
            next: () => {
                this.guardando.set(false);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Admisión registrada exitosamente' });
            },
            error: () => {
                this.guardando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la admisión' });
            }
        });
    }

    onCancel() {
        this.router.navigate(['/app/enfermeria/pacientes']);
    }
}
