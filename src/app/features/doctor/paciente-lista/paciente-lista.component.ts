import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { PacienteService } from '@/app/core/services/paciente.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { resetDb } from '@/app/mock-backend';

interface FormAction {
    form: string;
    label: string;
    icon: string;
    tooltip: string;
}

@Component({
    selector: 'app-paciente-lista',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TooltipModule, IconFieldModule, InputIconModule, TagModule, RevealDirective],
    template: `
        <!-- Cabecera con gradiente -->
        <div class="hub-header" appReveal>
            <div class="flex items-center gap-4">
                <div class="hub-header__icon">
                    <i class="pi" [ngClass]="isDoctorContext() ? 'pi-user-plus' : 'pi-heart-fill'"></i>
                </div>
                <div>
                    <h1 class="hub-header__title">Pacientes en Piso</h1>
                    <p class="hub-header__sub">
                        {{ isDoctorContext() ? 'Solicite y registre exámenes complementarios' : 'Seleccione un paciente para abrir sus hojas clínicas' }}
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="hub-count">{{ filtered().length }} internados</span>
                <button pButton type="button" icon="pi pi-refresh" label="Reiniciar demo"
                    class="p-button-text p-button-sm" pTooltip="Reiniciar los datos de demostración"
                    (click)="reiniciarDemo()"></button>
            </div>
        </div>

        <!-- Búsqueda -->
        <div class="mb-5 mt-4">
            <p-iconfield iconPosition="left" styleClass="w-full md:w-[30rem]">
                <p-inputicon styleClass="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar por nombre, carnet o unidad…"
                    class="w-full" [(ngModel)]="query" />
            </p-iconfield>
        </div>

        <!-- Grilla de tarjetas -->
        @if (loading()) {
            <div class="text-center text-muted-color py-16">
                <i class="pi pi-spin pi-spinner text-3xl mb-3"></i>
                <p>Cargando pacientes…</p>
            </div>
        } @else if (filtered().length === 0) {
            <div class="text-center text-muted-color py-16">
                <i class="pi pi-inbox text-4xl mb-3"></i>
                <p>No se encontraron pacientes con ese criterio.</p>
            </div>
        } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                @for (paciente of filtered(); track paciente.id; let i = $index) {
                    <div class="pac-card" [appReveal]="i">
                        <!-- Encabezado: avatar + nombre + badges -->
                        <div class="flex items-start gap-3">
                            <div class="pac-avatar" [class]="'pac-avatar--' + (paciente.sexo === 'M' ? 'male' : 'female')">
                                {{ initials(paciente) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="pac-name">{{ paciente.apellidoPaterno }} {{ paciente.apellidoMaterno }}, {{ paciente.nombres }}</div>
                                <div class="pac-carnet">{{ paciente.carnetAsegurado }}</div>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                <span class="pac-badge pac-badge--sexo" [class.pac-badge--m]="paciente.sexo === 'M'" [class.pac-badge--f]="paciente.sexo === 'F'">
                                    {{ paciente.sexo === 'M' ? 'Varón' : 'Mujer' }}
                                </span>
                                @if (paciente.tipoAsegurado) {
                                    <span class="pac-badge pac-badge--tipo">{{ tipoLabel(paciente.tipoAsegurado) }}</span>
                                }
                            </div>
                        </div>

                        <!-- Datos clínicos -->
                        <div class="pac-meta">
                            <span class="pac-meta__item">
                                <i class="pi pi-calendar-clock"></i>
                                <strong>{{ paciente.edad ?? '—' }}</strong> años
                            </span>
                            @if (paciente.grado) {
                                <span class="pac-meta__item">
                                    <i class="pi pi-shield"></i> {{ paciente.grado }}
                                </span>
                            }
                            @if (paciente.unidad) {
                                <span class="pac-meta__item">
                                    <i class="pi pi-briefcase"></i> {{ paciente.unidad }}
                                </span>
                            }
                            @if (paciente.fuerza) {
                                <span class="pac-meta__item">
                                    <i class="pi pi-star"></i> {{ paciente.fuerza }}
                                </span>
                            }
                        </div>

                        <div class="pac-divider"></div>

                        <!-- Acciones: doctores = botón grande; enfermería = grid de chips -->
                        @if (isDoctorContext()) {
                            <div class="flex flex-wrap gap-1.5">
                                @for (a of actions(); track a.form) {
                                    <button pButton type="button"
                                        [icon]="a.icon" [label]="a.label"
                                        class="p-button-sm p-button-outlined"
                                        [pTooltip]="a.tooltip" tooltipPosition="top"
                                        (click)="navigateTo(a.form, paciente.id!)">
                                    </button>
                                }
                            </div>
                        } @else {
                            <div class="pac-actions-grid">
                                @for (a of actions(); track a.form) {
                                    <button class="pac-action-chip" [pTooltip]="a.tooltip" tooltipPosition="top"
                                        (click)="navigateTo(a.form, paciente.id!)">
                                        <i class="pi" [ngClass]="a.icon"></i>
                                        <span>{{ a.label }}</span>
                                    </button>
                                }
                            </div>
                        }
                    </div>
                }
            </div>
        }
    `,
    styles: [`
        .hub-header {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
            padding: 1.25rem 1.5rem; border-radius: 1.25rem; color: #fff;
            background: linear-gradient(120deg, var(--p-primary-700) 0%, var(--p-primary-500) 52%, #0f766e 100%);
            box-shadow: 0 12px 28px color-mix(in srgb, var(--p-primary-color) 30%, transparent);
        }
        .hub-header__icon {
            width: 3.25rem; height: 3.25rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,.18); backdrop-filter: blur(6px); font-size: 1.5rem;
        }
        .hub-header__title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; margin: 0; line-height: 1.1; }
        .hub-header__sub { margin: 0.2rem 0 0; color: rgba(255,255,255,.82); font-size: 0.88rem; }
        .hub-count { background: rgba(255,255,255,.18); padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; }
        :host ::ng-deep .hub-header .p-button.p-button-text { color: #fff; }
        :host ::ng-deep .hub-header .p-button.p-button-text:hover { background: rgba(255,255,255,.15); }

        /* ── Tarjeta paciente ── */
        .pac-card {
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200);
            border-radius: 1rem; padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: 0.8rem;
            transition: transform .18s ease, box-shadow .2s ease, border-color .2s ease;
        }
        :host-context(.app-dark) .pac-card { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .pac-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.10); border-color: var(--p-primary-300); }

        /* Avatar */
        .pac-avatar {
            flex: none; width: 2.8rem; height: 2.8rem; border-radius: 9999px;
            display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; color: #fff;
        }
        .pac-avatar--male { background: linear-gradient(135deg, #0369a1, #0284c7); }
        .pac-avatar--female { background: linear-gradient(135deg, #be185d, #db2777); }

        /* Nombre + carnet */
        .pac-name { font-weight: 700; font-size: 0.95rem; color: var(--p-text-color); line-height: 1.2; }
        .pac-carnet { font-size: 0.75rem; color: var(--p-text-muted-color); font-family: var(--font-mono); margin-top: 0.1rem; }

        /* Badges */
        .pac-badge { font-size: 0.65rem; font-weight: 700; padding: 0.18rem 0.55rem; border-radius: 9999px; white-space: nowrap; }
        .pac-badge--m { background: #e0f2fe; color: #0369a1; }
        .pac-badge--f { background: #fce7f3; color: #be185d; }
        .pac-badge--tipo { background: var(--p-primary-50); color: var(--p-primary-700); }
        :host-context(.app-dark) .pac-badge--tipo { background: color-mix(in srgb, var(--p-primary-color) 15%, var(--p-surface-900)); color: var(--p-primary-200); }

        /* Meta */
        .pac-meta { display: flex; flex-wrap: wrap; gap: 0.3rem 0.85rem; font-size: 0.79rem; color: var(--p-text-muted-color); }
        .pac-meta__item { display: flex; align-items: center; gap: 0.25rem; }
        .pac-meta__item i { color: var(--p-primary-500); font-size: 0.7rem; }
        .pac-meta__item strong { color: var(--p-text-color); }

        /* Divisor */
        .pac-divider { height: 1px; background: var(--p-surface-200); }
        :host-context(.app-dark) .pac-divider { background: var(--p-surface-700); }

        /* Grid de acciones (enfermería) */
        .pac-actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; }
        .pac-action-chip {
            display: flex; align-items: center; gap: 0.4rem; padding: 0.42rem 0.65rem;
            border-radius: 0.55rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;
            color: var(--p-text-color); background: var(--p-surface-50);
            border: 1px solid var(--p-surface-200);
            transition: background .14s ease, border-color .14s ease, transform .1s ease;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        :host-context(.app-dark) .pac-action-chip { background: var(--p-surface-800); border-color: var(--p-surface-700); }
        .pac-action-chip:hover { background: var(--p-primary-50); border-color: var(--p-primary-300); transform: translateY(-1px); }
        :host-context(.app-dark) .pac-action-chip:hover { background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900)); }
        .pac-action-chip .pi { color: var(--p-primary-600); font-size: 0.78rem; flex: none; }
    `]
})
export class PacienteListaComponent implements OnInit {
    private pacienteService = inject(PacienteService);
    private router = inject(Router);
    private activo = inject(PacienteActivoService);

    pacientes = signal<Paciente[]>([]);
    loading = signal(true);
    query = signal('');
    isDoctorContext = signal(false);
    isEnfermeriaContext = signal(false);

    private readonly doctorActions: FormAction[] = [
        { form: 'examenes', label: 'Exámenes Complementarios', icon: 'pi pi-images', tooltip: 'Resultados Exámenes Complementarios (HC-M-009)' }
    ];

    private readonly enfermeriaActions: FormAction[] = [
        { form: 'signos-vitales', label: 'Signos Vitales', icon: 'pi pi-chart-line', tooltip: 'Cuadro de Signos Vitales — HCE-002' },
        { form: 'notas-diarias', label: 'Notas Diarias', icon: 'pi pi-pencil', tooltip: 'Notas Diarias de Enfermería — HCE-004' },
        { form: 'medicamentos', label: 'Kardex Meds.', icon: 'pi pi-box', tooltip: 'Soluciones Parenterales y Medicamentos — HCE-006' },
        { form: 'admision', label: 'Admisión', icon: 'pi pi-file-edit', tooltip: 'Admisión Hospitalaria — HC-M-002' },
        { form: 'evolucion', label: 'Evolución', icon: 'pi pi-list', tooltip: 'Evolución y Tratamiento — HC-M-007' },
        { form: 'consentimiento', label: 'Consentimiento', icon: 'pi pi-check-square', tooltip: 'Consentimiento Informado — HC-M-003' },
        { form: 'estadistico', label: 'Estadístico', icon: 'pi pi-chart-bar', tooltip: 'Informe Estadístico — HC-005' },
    ];

    actions = computed<FormAction[]>(() => (this.isDoctorContext() ? this.doctorActions : this.enfermeriaActions));

    filtered = computed<Paciente[]>(() => {
        const q = this.query().trim().toLowerCase();
        const list = this.pacientes();
        if (!q) return list;
        return list.filter((p) =>
            `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres} ${p.carnetAsegurado} ${p.unidad ?? ''} ${p.grado ?? ''}`
                .toLowerCase()
                .includes(q)
        );
    });

    ngOnInit(): void {
        this.detectContext();
        this.loadPacientes();
    }

    private detectContext(): void {
        const url = this.router.url;
        this.isDoctorContext.set(url.includes('/doctor'));
        this.isEnfermeriaContext.set(url.includes('/enfermeria'));
    }

    private loadPacientes(): void {
        this.loading.set(true);
        this.pacienteService.getAll().subscribe({
            next: (data) => {
                this.pacientes.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    initials(p: Paciente): string {
        return `${p.apellidoPaterno?.[0] ?? ''}${p.nombres?.[0] ?? ''}`.toUpperCase();
    }

    tipoLabel(tipo: string): string {
        const map: Record<string, string> = {
            ACTIVO: 'Activo', PASIVO: 'Pasivo', ESPOSA: 'Esposa/o',
            BENEFICIARIO: 'Benef.', CADETE_ALUMNO: 'Cadete', SOLDADO: 'Soldado', OTROS: 'Otros'
        };
        return map[tipo] ?? tipo;
    }

    navigateTo(form: string, pacienteId: number): void {
        // Fija el paciente activo y abre la hoja por su ruta sin id, de modo que
        // el selector del topbar siga controlando qué paciente se muestra.
        this.activo.setId(pacienteId);
        const url = this.router.url;
        const baseSegments = url.split('/').slice(0, -1);
        this.router.navigate([...baseSegments, form]);
    }

    reiniciarDemo(): void {
        resetDb();
        window.location.reload();
    }
}
