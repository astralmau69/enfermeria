import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { PacienteHeaderComponent } from '@/app/shared/components/paciente-header/paciente-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteService } from '@/app/core/services/paciente.service';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CuidadosEnfermeriaService } from '@/app/core/services/cuidados-enfermeria.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { ControlDispositivos, Dispositivo, TipoDispositivo } from '@/app/core/models/cuidados-enfermeria.model';

@Component({
    selector: 'app-dispositivos',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, TagModule, ButtonModule, DialogModule, SelectModule,
        InputTextModule, TextareaModule, ToastModule, TooltipModule,
        FormHeaderComponent, PacienteHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header title="Sondas, Vías y Catéteres" code="DISPOSITIVOS"
            subtitle="Control de dispositivos invasivos: colocación, días y retiro" responsable="LIC" appReveal />

        @if (paciente(); as p) {
            <app-paciente-header [paciente]="p" [cama]="doc()?.cama || ''" servicio="Hospitalización" />
        }

        @if (!pacienteId()) {
            <div class="empty-state"><i class="pi pi-user"></i><span class="empty-state__title">Sin paciente seleccionado</span>
                <span>Abrí esta hoja desde el censo o el mapa de camas.</span></div>
        } @else {
            <div class="action-bar">
                <span class="hint"><i class="pi pi-info-circle"></i> {{ activos() }} activo(s) de {{ (doc()?.dispositivos ?? []).length }} registrados</span>
                <p-button label="Agregar dispositivo" icon="pi pi-plus" (onClick)="abrir()" />
            </div>

            <div class="doc-sheet bg-surface-0 dark:bg-surface-900 p-2 md:p-3" appReveal>
                <p-table [value]="dispositivos()" [loading]="loading()" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '54rem' }">
                    <ng-template #header>
                        <tr>
                            <th>Dispositivo</th>
                            <th>Sitio</th>
                            <th style="width:8rem">Colocación</th>
                            <th style="width:6rem" class="text-center">Días</th>
                            <th style="width:9rem">Estado</th>
                            <th style="width:8rem">Próx. cambio</th>
                            <th style="width:7rem" class="text-center">Acción</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-d>
                        <tr [class.retirado]="d.estado === 'RETIRADO'">
                            <td>
                                <div class="disp"><span class="disp__icon"><i class="pi" [ngClass]="tipoIcon(d.tipo)"></i></span>
                                    <div><div class="font-semibold">{{ tipoLabel(d.tipo) }}</div>
                                        @if (d.observacion) { <div class="text-xs text-muted-color">{{ d.observacion }}</div> }</div></div>
                            </td>
                            <td class="text-sm">{{ d.sitio || '—' }}</td>
                            <td class="font-mono text-sm">{{ d.fechaColocacion }}</td>
                            <td class="text-center tabular">{{ dias(d) }}</td>
                            <td>
                                @if (d.estado === 'ACTIVO') { <p-tag value="Activo" severity="success" icon="pi pi-check-circle" styleClass="text-xs" /> }
                                @else { <p-tag [value]="'Retirado' + (d.fechaRetiro ? ' ' + d.fechaRetiro : '')" severity="secondary" styleClass="text-xs" /> }
                            </td>
                            <td class="font-mono text-sm" [class.due]="vencido(d)">{{ d.proximoCambio || '—' }}</td>
                            <td class="text-center">
                                @if (d.estado === 'ACTIVO') {
                                    <button pButton type="button" icon="pi pi-sign-out" label="Retirar" class="p-button-text p-button-sm" severity="secondary"
                                        pTooltip="Registrar retiro" tooltipPosition="left" (click)="retirar(d)"></button>
                                } @else { <span class="text-muted-color text-sm">—</span> }
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr><td colspan="7">
                            <div class="empty-state"><i class="pi pi-link"></i>
                                <span class="empty-state__title">Sin dispositivos registrados</span>
                                <span>Registrá sondas, vías periféricas o catéteres del paciente.</span></div>
                        </td></tr>
                    </ng-template>
                </p-table>
            </div>
        }

        <!-- Dialog -->
        <p-dialog header="Nuevo dispositivo" [(visible)]="dialogVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '34rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Tipo de dispositivo</label>
                    <p-select [options]="tipoOptions" optionLabel="label" optionValue="value"
                        [(ngModel)]="nuevo.tipo" placeholder="Seleccione el tipo" appendTo="body" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label">Sitio de inserción</label>
                    <input pInputText [(ngModel)]="nuevo.sitio" placeholder="Ej.: MSD antebrazo, subclavia derecha, Foley N.° 16" />
                </div>
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Fecha de colocación</label>
                        <input type="date" pInputText [(ngModel)]="nuevo.fechaColocacion" />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label">Próximo cambio</label>
                        <input type="date" pInputText [(ngModel)]="nuevo.proximoCambio" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label">Observación</label>
                    <textarea pTextarea [(ngModel)]="nuevo.observacion" rows="2" placeholder="Aspecto del sitio, permeabilidad, débito…"></textarea>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="dialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="agregar()" [loading]="guardando()" [disabled]="!nuevo.tipo || !nuevo.fechaColocacion" />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .action-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.85rem; }
        .hint { font-size: 0.8rem; color: var(--p-text-muted-color); display: inline-flex; align-items: center; gap: 0.35rem; }
        .disp { display: flex; align-items: center; gap: 0.6rem; }
        .disp__icon { flex: none; width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;
            background: var(--p-primary-50); color: var(--p-primary-600); }
        :host-context(.app-dark) .disp__icon { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        tr.retirado { opacity: 0.6; }
        .due { color: #be123c; font-weight: 700; }
    `]
})
export class DispositivosComponent {
    private route = inject(ActivatedRoute);
    private pacienteService = inject(PacienteService);
    private activo = inject(PacienteActivoService);
    private service = inject(CuidadosEnfermeriaService);
    private messageService = inject(MessageService);

    private routeId = toSignal(this.route.paramMap.pipe(map((pm) => (pm.get('pacienteId') ? +pm.get('pacienteId')! : null))), { initialValue: null });
    private loadedId: number | null = null;

    pacienteId = signal<number | null>(null);
    paciente = signal<Paciente | null>(null);
    doc = signal<ControlDispositivos | null>(null);
    loading = signal(true);
    guardando = signal(false);

    dialogVisible = false;
    nuevo: Partial<Dispositivo> = this.vacio();

    readonly tipoOptions: { value: TipoDispositivo; label: string }[] = [
        { value: 'VIA_PERIFERICA', label: 'Vía periférica' },
        { value: 'CVC', label: 'Catéter venoso central (CVC)' },
        { value: 'SONDA_VESICAL', label: 'Sonda vesical' },
        { value: 'SNG', label: 'Sonda nasogástrica (SNG)' },
        { value: 'DRENAJE', label: 'Drenaje' },
        { value: 'OXIGENO', label: 'Oxígeno' },
        { value: 'OTRO', label: 'Otro' }
    ];

    dispositivos = computed(() => [...(this.doc()?.dispositivos ?? [])].sort((a, b) =>
        (a.estado === b.estado ? 0 : a.estado === 'ACTIVO' ? -1 : 1) || b.fechaColocacion.localeCompare(a.fechaColocacion)));
    activos = computed(() => (this.doc()?.dispositivos ?? []).filter((d) => d.estado === 'ACTIVO').length);

    constructor() {
        effect(() => {
            const id = this.routeId() ?? this.activo.pacienteId();
            if (id == null || id === this.loadedId) return;
            this.loadedId = id;
            this.pacienteId.set(id);
            this.activo.setId(id);
            this.pacienteService.getById(id).subscribe((p) => this.paciente.set(p));
            this.cargar(id);
        });
    }

    private cargar(id: number): void {
        this.loading.set(true);
        this.service.getDispositivos(id).subscribe({
            next: (d) => { this.doc.set(d); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los dispositivos.' }); }
        });
    }

    tipoLabel(t: TipoDispositivo): string { return this.tipoOptions.find((o) => o.value === t)?.label ?? t; }
    tipoIcon(t: TipoDispositivo): string {
        return { VIA_PERIFERICA: 'pi-link', CVC: 'pi-link', SONDA_VESICAL: 'pi-filter', SNG: 'pi-arrow-down', DRENAJE: 'pi-download', OXIGENO: 'pi-cloud', OTRO: 'pi-box' }[t];
    }
    dias(d: Dispositivo): number {
        const fin = d.fechaRetiro ? new Date(d.fechaRetiro) : new Date();
        const ini = new Date(d.fechaColocacion);
        return Math.max(0, Math.round((fin.getTime() - ini.getTime()) / 86400000));
    }
    vencido(d: Dispositivo): boolean {
        return d.estado === 'ACTIVO' && !!d.proximoCambio && d.proximoCambio < new Date().toISOString().split('T')[0];
    }

    abrir(): void { this.nuevo = this.vacio(); this.dialogVisible = true; }

    agregar(): void {
        const doc = this.doc();
        if (!doc || !this.nuevo.tipo || !this.nuevo.fechaColocacion) return;
        const entrada: Dispositivo = {
            tipo: this.nuevo.tipo as TipoDispositivo,
            sitio: this.nuevo.sitio?.trim() || undefined,
            fechaColocacion: this.nuevo.fechaColocacion!,
            proximoCambio: this.nuevo.proximoCambio || undefined,
            estado: 'ACTIVO',
            observacion: this.nuevo.observacion?.trim() || undefined
        };
        this.guardar({ ...doc, dispositivos: [...doc.dispositivos, entrada] }, 'Dispositivo registrado');
    }

    retirar(d: Dispositivo): void {
        const doc = this.doc();
        if (!doc) return;
        const hoy = new Date().toISOString().split('T')[0];
        const dispositivos = doc.dispositivos.map((x) => (x === d || (x.id != null && x.id === d.id) ? { ...x, estado: 'RETIRADO' as const, fechaRetiro: hoy } : x));
        this.guardar({ ...doc, dispositivos }, 'Dispositivo retirado');
    }

    private guardar(updated: ControlDispositivos, msg: string): void {
        this.guardando.set(true);
        this.service.saveDispositivos(updated).subscribe({
            next: (saved) => { this.doc.set(saved); this.guardando.set(false); this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: msg, detail: this.paciente()?.apellidoPaterno ?? '' }); },
            error: () => { this.guardando.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' }); }
        });
    }

    private vacio(): Partial<Dispositivo> {
        return { tipo: undefined, fechaColocacion: new Date().toISOString().split('T')[0] };
    }
}
