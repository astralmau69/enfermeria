import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormHeaderComponent } from '@/app/shared/components/form-header/form-header.component';
import { PacienteHeaderComponent } from '@/app/shared/components/paciente-header/paciente-header.component';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteService } from '@/app/core/services/paciente.service';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { CuidadosEnfermeriaService } from '@/app/core/services/cuidados-enfermeria.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { RegistroCuraciones, Herida, EntradaCuracion, TipoHerida } from '@/app/core/models/cuidados-enfermeria.model';

@Component({
    selector: 'app-curaciones',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, DialogModule, SelectModule,
        InputTextModule, InputNumberModule, TextareaModule, ToastModule,
        FormHeaderComponent, PacienteHeaderComponent, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <app-form-header title="Curaciones / Heridas" code="CURACIONES"
            subtitle="Valoración de heridas (escala de Braden) y registro de curaciones" responsable="LIC" appReveal />

        @if (paciente(); as p) {
            <app-paciente-header [paciente]="p" [cama]="doc()?.cama || ''" servicio="Hospitalización" />
        }

        @if (!pacienteId()) {
            <div class="empty-state"><i class="pi pi-user"></i><span class="empty-state__title">Sin paciente seleccionado</span>
                <span>Abrí esta hoja desde el censo o el mapa de camas.</span></div>
        } @else {
            <div class="action-bar">
                <p-button label="Nueva herida" icon="pi pi-plus" (onClick)="abrirHerida()" />
            </div>

            @if (loading()) {
                <div class="empty-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando…</span></div>
            } @else if (!(doc()?.heridas?.length)) {
                <div class="empty-state"><i class="pi pi-plus-circle"></i>
                    <span class="empty-state__title">Sin heridas registradas</span>
                    <span>Registrá la primera herida para documentar sus curaciones.</span></div>
            } @else {
                @for (h of doc()!.heridas; track h.id ?? $index; let i = $index) {
                    <section class="herida" [appReveal]="i">
                        <header class="herida__head">
                            <div class="herida__id">
                                <span class="herida__icon"><i class="pi pi-plus-circle"></i></span>
                                <div>
                                    <div class="herida__loc">{{ h.localizacion }}</div>
                                    <div class="herida__tipo">{{ tipoLabel(h.tipo) }}</div>
                                </div>
                            </div>
                            <div class="herida__right">
                                @if (h.braden != null) {
                                    <span class="braden" [attr.data-risk]="riesgo(h.braden).key" [title]="'Riesgo ' + riesgo(h.braden).label">
                                        Braden {{ h.braden }} · {{ riesgo(h.braden).label }}
                                    </span>
                                }
                                <p-button label="Agregar curación" icon="pi pi-plus" size="small" [text]="true" (onClick)="abrirCuracion(h)" />
                            </div>
                        </header>

                        @if (!h.curaciones.length) {
                            <p class="herida__empty">Aún sin curaciones registradas.</p>
                        } @else {
                            <ul class="cur">
                                @for (c of ordenadas(h); track c.id ?? $index) {
                                    <li class="cur__row">
                                        <span class="cur__when"><b>{{ c.fecha }}</b> {{ c.hora }}</span>
                                        <div class="cur__body">
                                            <div class="cur__aspecto">{{ c.aspecto }}</div>
                                            <div class="cur__accion"><i class="pi pi-check"></i> {{ c.accion }}</div>
                                            @if (c.enfermeraNombre) { <div class="cur__firma">{{ c.enfermeraNombre }}</div> }
                                        </div>
                                    </li>
                                }
                            </ul>
                        }
                    </section>
                }
            }
        }

        <!-- Dialog nueva herida -->
        <p-dialog header="Nueva herida" [(visible)]="heridaVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '32rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Localización</label>
                    <input pInputText [(ngModel)]="nuevaHerida.localizacion" placeholder="Ej.: Sacro, talón derecho, herida quirúrgica abdominal" />
                </div>
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Tipo</label>
                        <p-select [options]="tipoOptions" optionLabel="label" optionValue="value"
                            [(ngModel)]="nuevaHerida.tipo" placeholder="Tipo de herida" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 w-44">
                        <label class="field-label">Escala de Braden</label>
                        <p-inputnumber [(ngModel)]="nuevaHerida.braden" [min]="6" [max]="23" [useGrouping]="false" placeholder="6–23" styleClass="w-full" />
                        <span class="field-hint">Menor puntaje = mayor riesgo de úlcera.</span>
                    </div>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="heridaVisible = false" />
                <p-button label="Registrar herida" icon="pi pi-check" (onClick)="agregarHerida()" [loading]="guardando()"
                    [disabled]="!nuevaHerida.localizacion || !nuevaHerida.tipo" />
            </ng-template>
        </p-dialog>

        <!-- Dialog nueva curación -->
        <p-dialog header="Registrar curación" [(visible)]="curacionVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '34rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex gap-3">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="field-label req">Fecha</label>
                        <input type="date" pInputText [(ngModel)]="nuevaCuracion.fecha" />
                    </div>
                    <div class="flex flex-col gap-1 w-36">
                        <label class="field-label req">Hora</label>
                        <input type="time" pInputText [(ngModel)]="nuevaCuracion.hora" />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Aspecto de la herida</label>
                    <textarea pTextarea [(ngModel)]="nuevaCuracion.aspecto" rows="2" placeholder="Ej.: Bordes afrontados, sin secreción, leve eritema…"></textarea>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Curación realizada</label>
                    <textarea pTextarea [(ngModel)]="nuevaCuracion.accion" rows="2" placeholder="Ej.: Limpieza con SF, clorhexidina, apósito estéril…"></textarea>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="curacionVisible = false" />
                <p-button label="Guardar curación" icon="pi pi-check" (onClick)="agregarCuracion()" [loading]="guardando()"
                    [disabled]="!nuevaCuracion.fecha || !nuevaCuracion.aspecto || !nuevaCuracion.accion" />
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }
        .action-bar { display: flex; justify-content: flex-end; margin-bottom: 0.85rem; }
        .herida { padding: 1rem 1.15rem; border-radius: 0.95rem; margin-bottom: 1rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .herida { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .herida__head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 0.6rem; }
        .herida__id { display: flex; align-items: center; gap: 0.6rem; }
        .herida__icon { flex: none; width: 2.3rem; height: 2.3rem; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center;
            background: var(--p-primary-50); color: var(--p-primary-600); }
        :host-context(.app-dark) .herida__icon { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .herida__loc { font-weight: 700; color: var(--p-text-color); }
        .herida__tipo { font-size: 0.78rem; color: var(--p-text-muted-color); }
        .herida__right { display: flex; align-items: center; gap: 0.6rem; }
        .herida__empty { font-size: 0.82rem; color: var(--p-text-muted-color); margin: 0.25rem 0 0; }
        .braden { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 9999px; white-space: nowrap;
            background: var(--p-surface-100); color: var(--p-text-muted-color); }
        .braden[data-risk="muy-alto"] { background: #ffe4e6; color: #be123c; }
        .braden[data-risk="alto"] { background: #fef3c7; color: #b45309; }
        .braden[data-risk="moderado"] { background: #e0f2fe; color: #0369a1; }
        .braden[data-risk="bajo"] { background: var(--p-primary-50); color: var(--p-primary-700); }
        .cur { list-style: none; margin: 0.35rem 0 0; padding: 0.5rem 0 0; border-top: 1px dashed var(--p-surface-200); }
        :host-context(.app-dark) .cur { border-top-color: var(--p-surface-700); }
        .cur__row { display: flex; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--p-surface-100); }
        :host-context(.app-dark) .cur__row { border-bottom-color: var(--p-surface-800); }
        .cur__row:last-child { border-bottom: none; }
        .cur__when { flex: none; width: 8rem; font-family: var(--font-mono); font-size: 0.74rem; color: var(--p-text-muted-color); }
        .cur__when b { color: var(--p-text-color); }
        .cur__aspecto { font-size: 0.88rem; color: var(--p-text-color); }
        .cur__accion { font-size: 0.82rem; color: var(--p-primary-700); margin-top: 0.15rem; }
        .cur__accion .pi { font-size: 0.72rem; }
        :host-context(.app-dark) .cur__accion { color: var(--p-primary-300); }
        .cur__firma { font-size: 0.72rem; color: var(--p-text-muted-color); margin-top: 0.15rem; font-style: italic; }
    `]
})
export class CuracionesComponent {
    private route = inject(ActivatedRoute);
    private pacienteService = inject(PacienteService);
    private activo = inject(PacienteActivoService);
    private service = inject(CuidadosEnfermeriaService);
    private messageService = inject(MessageService);

    private routeId = toSignal(this.route.paramMap.pipe(map((pm) => (pm.get('pacienteId') ? +pm.get('pacienteId')! : null))), { initialValue: null });
    private loadedId: number | null = null;

    pacienteId = signal<number | null>(null);
    paciente = signal<Paciente | null>(null);
    doc = signal<RegistroCuraciones | null>(null);
    loading = signal(true);
    guardando = signal(false);

    heridaVisible = false;
    nuevaHerida: Partial<Herida> = { tipo: undefined };

    curacionVisible = false;
    private heridaSel: Herida | null = null;
    nuevaCuracion: Partial<EntradaCuracion> = this.curVacia();

    readonly tipoOptions: { value: TipoHerida; label: string }[] = [
        { value: 'QUIRURGICA', label: 'Quirúrgica' },
        { value: 'ULCERA_PRESION', label: 'Úlcera por presión' },
        { value: 'TRAUMATICA', label: 'Traumática' },
        { value: 'QUEMADURA', label: 'Quemadura' },
        { value: 'OTRA', label: 'Otra' }
    ];

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
        this.service.getCuraciones(id).subscribe({
            next: (d) => { this.doc.set(d); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el registro de curaciones.' }); }
        });
    }

    tipoLabel(t: TipoHerida): string { return this.tipoOptions.find((o) => o.value === t)?.label ?? t; }
    ordenadas(h: Herida): EntradaCuracion[] {
        return [...h.curaciones].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    }
    riesgo(b: number): { key: string; label: string } {
        if (b <= 9) return { key: 'muy-alto', label: 'muy alto' };
        if (b <= 12) return { key: 'alto', label: 'alto' };
        if (b <= 14) return { key: 'moderado', label: 'moderado' };
        return { key: 'bajo', label: 'bajo' };
    }

    abrirHerida(): void { this.nuevaHerida = { tipo: undefined }; this.heridaVisible = true; }

    agregarHerida(): void {
        const doc = this.doc();
        if (!doc || !this.nuevaHerida.localizacion || !this.nuevaHerida.tipo) return;
        const herida: Herida = {
            localizacion: this.nuevaHerida.localizacion!.trim(),
            tipo: this.nuevaHerida.tipo as TipoHerida,
            braden: this.nuevaHerida.braden ?? undefined,
            curaciones: []
        };
        this.guardar({ ...doc, heridas: [...doc.heridas, herida] }, 'Herida registrada', () => (this.heridaVisible = false));
    }

    abrirCuracion(h: Herida): void { this.heridaSel = h; this.nuevaCuracion = this.curVacia(); this.curacionVisible = true; }

    agregarCuracion(): void {
        const doc = this.doc();
        const target = this.heridaSel;
        if (!doc || !target || !this.nuevaCuracion.fecha || !this.nuevaCuracion.aspecto || !this.nuevaCuracion.accion) return;
        const entrada: EntradaCuracion = {
            fecha: this.nuevaCuracion.fecha!, hora: this.nuevaCuracion.hora || '',
            aspecto: this.nuevaCuracion.aspecto!.trim(), accion: this.nuevaCuracion.accion!.trim()
        };
        const heridas = doc.heridas.map((h) => (h === target || (h.id != null && h.id === target.id)
            ? { ...h, curaciones: [...h.curaciones, entrada] } : h));
        this.guardar({ ...doc, heridas }, 'Curación registrada', () => (this.curacionVisible = false));
    }

    private guardar(updated: RegistroCuraciones, msg: string, done: () => void): void {
        this.guardando.set(true);
        this.service.saveCuraciones(updated).subscribe({
            next: (saved) => { this.doc.set(saved); this.guardando.set(false); done();
                this.messageService.add({ severity: 'success', summary: msg, detail: this.paciente()?.apellidoPaterno ?? '' }); },
            error: () => { this.guardando.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' }); }
        });
    }

    private curVacia(): Partial<EntradaCuracion> {
        const now = new Date();
        return { fecha: now.toISOString().split('T')[0], hora: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, aspecto: '', accion: '' };
    }
}
