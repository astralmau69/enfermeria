import { Component, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { PacienteService } from '@/app/core/services/paciente.service';
import { PacienteActivoService } from '@/app/core/services/paciente-activo.service';
import { PisoService } from '@/app/core/services/piso.service';
import { Paciente } from '@/app/core/models/paciente.model';
import { Cama, EstadoCama, Piso, PISOS, TURNOS, TurnoNombre, rolDeTurno, turnoActual } from '@/app/core/models/piso.model';

@Component({
    selector: 'app-piso',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, DialogModule, SelectModule,
        InputTextModule, TooltipModule, ToastModule, RevealDirective
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <!-- Banner del piso + turno -->
        <section class="fb" appReveal>
            <div class="fb__glow"></div>
            <div class="fb__id">
                <span class="fb__num">{{ piso().numero }}</span>
                <div>
                    <div class="fb__eyebrow">Hospitalización · Mapa de camas</div>
                    <h1 class="fb__title">Piso {{ piso().numero }} — {{ piso().nombre }}</h1>
                    <p class="fb__sub">{{ ocupadas() }}/{{ total() }} ocupadas · {{ tasaOcupacion() }}% ocupación · {{ libres() }} libres · {{ reservadas() }} reservadas</p>
                </div>
            </div>
            <div class="fb__shift">
                <div class="seg">
                    @for (t of turnos; track t.key) {
                        <button class="seg__btn" [class.is-on]="turno() === t.key" (click)="turno.set(t.key)">
                            <i class="pi" [ngClass]="t.icon"></i> {{ t.label }}
                        </button>
                    }
                </div>
                <div class="fb__roster">
                    <span class="fb__roster-h">Plantel · Turno {{ turnoInfo().label }} · {{ turnoInfo().horario }}</span>
                    @for (e of rol().enfermeras; track e) {
                        <span><i class="pi pi-user"></i> {{ e }}</span>
                    }
                    <span class="fb__roster-aux"><i class="pi pi-user-plus"></i> {{ rol().auxiliar }}</span>
                </div>
            </div>
        </section>

        <!-- Selector de piso (9) -->
        <div class="chips">
            @for (p of pisos; track p.numero) {
                <button class="chip" [class.is-on]="pisoNumero() === p.numero" (click)="pisoNumero.set(p.numero)">
                    <i class="pi" [ngClass]="p.icon"></i>
                    <span class="chip__n">P{{ p.numero }}</span>
                    <span class="chip__name">{{ p.nombre }}</span>
                </button>
            }
        </div>

        <!-- KPIs -->
        <div class="kpis">
            <div class="kpi kpi--ocup"><i class="pi pi-chart-pie"></i><b class="tabular">{{ tasaOcupacion() }}%</b><span>Ocupación ({{ ocupadas() }}/{{ total() }})</span></div>
            <div class="kpi kpi--libre"><i class="pi pi-check-circle"></i><b class="tabular">{{ libres() }}</b><span>Libres</span></div>
            <div class="kpi kpi--res"><i class="pi pi-bookmark-fill"></i><b class="tabular">{{ reservadas() }}</b><span>Reservadas</span></div>
            <div class="kpi kpi--post"><i class="pi pi-heart"></i><b class="tabular">{{ postOp() }}</b><span>Post-operatorios</span></div>
        </div>

        <!-- Selector de vista -->
        <div class="viewseg" appReveal>
            <button class="viewseg__btn" [class.is-on]="vista() === 'mapa'" (click)="vista.set('mapa')">
                <i class="pi pi-th-large"></i> Mapa por cuartos
            </button>
            <button class="viewseg__btn" [class.is-on]="vista() === 'lista'" (click)="vista.set('lista')">
                <i class="pi pi-list"></i> Detalle
            </button>
        </div>

        <!-- Mapa de camas -->
        @if (loading()) {
            <div class="empty-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando camas…</span></div>
        } @else if (camasOrdenadas().length === 0) {
            <div class="empty-state">
                <i class="pi pi-building"></i>
                <span class="empty-state__title">Piso {{ piso().numero }} — {{ piso().nombre }} aún no simulado</span>
                <span>Por ahora solo el <b>Piso 1 · Cirugía</b> tiene el mapa de camas cargado.</span>
            </div>
        } @else if (vista() === 'mapa') {
            <!-- Plano arquitectónico interactivo (cada cuarto = 2 camas) -->
            <div class="plano">
                <div class="plano__bar">
                    <span class="plano__title"><i class="pi pi-map"></i> Plano · Piso {{ piso().numero }} — {{ piso().nombre }}</span>
                    <div class="plano__legend">
                        <span class="lg lg--libre">Libre</span>
                        <span class="lg lg--ocupada">Ocupada</span>
                        <span class="lg lg--reservada">Reservada</span>
                        <span class="lg lg--limpieza">Limpieza</span>
                    </div>
                </div>
                <div class="plano__sheet">
                    <div class="corridor"><span>PASILLO</span></div>
                    <div class="wing">
                        @for (room of cuartos(); track room.numero; let ri = $index) {
                            <div class="proom" [appReveal]="ri" [revealY]="8">
                                <span class="proom__tag">CUARTO {{ room.numero }} · {{ room.ocupadas }}/{{ room.camas.length }}</span>
                                <span class="proom__door"></span>
                                <div class="proom__beds">
                                    @for (c of room.camas; track c.id) {
                                        <button class="pbed" type="button" [attr.data-st]="c.estado.toLowerCase()"
                                            [pTooltip]="tooltipDe(c)" tooltipPosition="top" (click)="seleccionarCama(c, $event)">
                                            <span class="pbed__pillow"></span>
                                            <span class="pbed__code">{{ c.codigo }}</span>
                                            @if (c.estado === 'OCUPADA' && pacienteDe(c); as p) {
                                                <span class="pbed__who">{{ initials(p) }}</span>
                                                @if (c.preOp) { <span class="pbed__pod pbed__pod--pre">PRE</span> }
                                                @else if (c.diaPostOp != null) { <span class="pbed__pod">POD {{ c.diaPostOp }}</span> }
                                            } @else {
                                                <span class="pbed__icon"><i class="pi" [ngClass]="iconoEstado(c.estado)"></i></span>
                                                <span class="pbed__cta">{{ ctaDe(c) }}</span>
                                            }
                                        </button>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        } @else {
            <div class="beds">
                @for (c of camasOrdenadas(); track c.id; let i = $index) {
                    <div class="bed" [attr.data-st]="c.estado.toLowerCase()" [appReveal]="i" [revealY]="10">
                        <div class="bed__top">
                            <span class="bed__code">{{ c.codigo }}</span>
                            <span class="bed__state">{{ estadoLabel(c.estado) }}</span>
                        </div>

                        @if (c.estado === 'OCUPADA' && pacienteDe(c); as p) {
                            <div class="bed__pac">
                                <span class="bed__avatar">{{ initials(p) }}</span>
                                <div class="min-w-0">
                                    <div class="bed__name">{{ p.apellidoPaterno }} {{ p.apellidoMaterno }} {{ p.nombres }}</div>
                                    <div class="bed__meta">{{ p.edad }}a · {{ p.sexo === 'M' ? 'M' : 'F' }} · {{ p.grado || p.tipoAsegurado }}</div>
                                </div>
                            </div>
                            <div class="bed__proc"><i class="pi pi-bookmark-fill"></i> {{ c.procedimiento }}</div>
                            <div class="bed__tags">
                                @if (c.preOp) { <span class="tag tag--pre">Pre-operatorio</span> }
                                @else if (c.diaPostOp != null) { <span class="tag tag--pod">Día post-op {{ c.diaPostOp }}</span> }
                                @if (c.observacion) { <span class="tag tag--obs">{{ c.observacion }}</span> }
                            </div>
                            <div class="bed__links">
                                <button pButton type="button" icon="pi pi-chart-line" class="p-button-text p-button-sm" pTooltip="Signos vitales" tooltipPosition="top" (click)="abrir('signos-vitales', p.id!)"></button>
                                <button pButton type="button" icon="pi pi-box" class="p-button-text p-button-sm" pTooltip="Medicamentos (Kardex)" tooltipPosition="top" (click)="abrir('medicamentos', p.id!)"></button>
                                <button pButton type="button" icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="Notas diarias" tooltipPosition="top" (click)="abrir('notas-diarias', p.id!)"></button>
                                <span class="flex-1"></span>
                                <button pButton type="button" icon="pi pi-arrow-right-arrow-left" class="p-button-text p-button-sm" pTooltip="Trasladar a otra cama / sector" tooltipPosition="top" (click)="abrirTraslado(c)"></button>
                                <button pButton type="button" icon="pi pi-sign-out" class="p-button-text p-button-sm" severity="secondary" pTooltip="Dar de alta / liberar cama" tooltipPosition="top" (click)="liberar(c)"></button>
                            </div>
                        } @else if (c.estado === 'RESERVADA') {
                            <div class="bed__empty">
                                <i class="pi pi-bookmark-fill"></i>
                                <span class="font-semibold">Reservada</span>
                                @if (c.reservaNota) { <span class="bed__resnota">{{ c.reservaNota }}</span> }
                                <div class="flex gap-2">
                                    <button pButton type="button" label="Asignar" icon="pi pi-user-plus" class="p-button-sm" (click)="abrirAsignar(c)"></button>
                                    <button pButton type="button" label="Liberar" icon="pi pi-times" class="p-button-sm p-button-outlined" severity="secondary" (click)="marcarLibre(c)"></button>
                                </div>
                            </div>
                        } @else if (c.estado === 'LIMPIEZA') {
                            <div class="bed__empty">
                                <i class="pi pi-sparkles"></i>
                                <span>En limpieza / desinfección</span>
                                <button pButton type="button" label="Marcar disponible" icon="pi pi-check" class="p-button-sm p-button-outlined" (click)="marcarLibre(c)"></button>
                            </div>
                        } @else {
                            <div class="bed__empty">
                                <i class="pi pi-plus-circle"></i>
                                <span>Cama disponible</span>
                                <div class="flex gap-2">
                                    <button pButton type="button" label="Asignar" icon="pi pi-user-plus" class="p-button-sm" (click)="abrirAsignar(c)"></button>
                                    <button pButton type="button" label="Reservar" icon="pi pi-bookmark" class="p-button-sm p-button-outlined" (click)="reservar(c)"></button>
                                </div>
                            </div>
                        }
                    </div>
                }
            </div>
        }

        <!-- Dialog asignar paciente a cama -->
        <p-dialog [header]="'Asignar paciente — ' + (camaSel()?.codigo ?? '')" [(visible)]="dialogVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '32rem' }">
            <div class="flex flex-col gap-4 pt-1">
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Paciente</label>
                    <p-select [options]="pacientesDisponibles()" optionLabel="label" optionValue="id"
                        [(ngModel)]="asignar.pacienteId" placeholder="Seleccione al asegurado a internar" appendTo="body"
                        [filter]="true" filterBy="label" styleClass="w-full" />
                    <span class="field-hint">Solo se listan pacientes que no están en otra cama de este piso.</span>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label">Procedimiento / diagnóstico quirúrgico</label>
                    <input pInputText [(ngModel)]="asignar.procedimiento" placeholder="Ej.: Apendicectomía, Colecistectomía…" />
                </div>
            </div>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button label="Internar en cama" icon="pi pi-check" (onClick)="confirmarAsignar()" [disabled]="!asignar.pacienteId" />
                </div>
            </ng-template>
        </p-dialog>

        <!-- Dialog traslado / derivación entre sectores -->
        <p-dialog [header]="'Trasladar paciente — ' + (traslado.origen?.codigo ?? '')" [(visible)]="trasladoVisible" [modal]="true"
            [draggable]="false" [dismissableMask]="true" [transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"
            [style]="{ width: '32rem' }">
            <div class="flex flex-col gap-4 pt-1">
                @if (traslado.origen; as o) {
                    <div class="tras-info">
                        <i class="pi pi-user"></i>
                        <div>
                            <div class="font-semibold">{{ nombreDeCama(o) }}</div>
                            <div class="text-xs text-muted-color">Desde {{ o.codigo }} · {{ o.procedimiento || 'Internación' }}</div>
                        </div>
                    </div>
                }
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Sector / piso destino</label>
                    <p-select [options]="pisosDestino()" optionLabel="label" optionValue="value"
                        [(ngModel)]="traslado.pisoDestino" (onChange)="traslado.camaDestinoId = undefined"
                        placeholder="Elija el piso destino" appendTo="body" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="field-label req">Cama destino (libre)</label>
                    <p-select [options]="camasDestino()" optionLabel="label" optionValue="value"
                        [(ngModel)]="traslado.camaDestinoId" [disabled]="!traslado.pisoDestino"
                        placeholder="Elija la cama libre" appendTo="body" styleClass="w-full" />
                    <span class="field-hint">La cama de origen quedará en limpieza tras el traslado.</span>
                </div>
            </div>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="trasladoVisible = false" />
                    <p-button label="Confirmar traslado" icon="pi pi-arrow-right-arrow-left" (onClick)="confirmarTraslado()" [disabled]="!traslado.camaDestinoId" />
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host { display: block; }

        /* Banner */
        .fb { position: relative; overflow: hidden; display: flex; flex-wrap: wrap; gap: 1.25rem; justify-content: space-between;
            padding: 1.3rem 1.6rem; border-radius: 1.25rem; color: #fff; margin-bottom: 1.1rem;
            background: linear-gradient(120deg, var(--p-primary-700) 0%, var(--p-primary-500) 55%, #0f766e 100%);
            box-shadow: 0 16px 34px color-mix(in srgb, var(--p-primary-color) 30%, transparent); }
        .fb__glow { position: absolute; width: 320px; height: 320px; border-radius: 9999px; filter: blur(70px); opacity: .4; background: rgba(255,255,255,.4); top: -150px; right: 10%; pointer-events: none; }
        .fb__id { display: flex; align-items: center; gap: 1rem; position: relative; z-index: 1; }
        .fb__num { flex: none; width: 3.4rem; height: 3.4rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center;
            font-family: var(--font-display); font-weight: 800; font-size: 1.7rem; background: rgba(255,255,255,.18); backdrop-filter: blur(6px); }
        .fb__eyebrow { font-family: var(--font-mono); font-size: 0.62rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,.8); }
        .fb__title { font-family: var(--font-display); font-weight: 700; font-size: 1.5rem; line-height: 1.08; margin: 0.1rem 0 0; color: #fff; }
        .fb__sub { margin: 0.2rem 0 0; color: rgba(255,255,255,.82); font-size: 0.88rem; }
        .fb__shift { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
        .seg { display: inline-flex; padding: 0.2rem; border-radius: 0.75rem; background: rgba(255,255,255,.16); backdrop-filter: blur(6px); }
        .seg__btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border-radius: 0.55rem; cursor: pointer;
            font-weight: 600; font-size: 0.82rem; color: rgba(255,255,255,.85); transition: background .15s ease, color .15s ease; }
        .seg__btn .pi { font-size: 0.8rem; }
        .seg__btn.is-on { background: #fff; color: var(--p-primary-700); }
        .fb__roster { display: flex; flex-direction: column; gap: 0.1rem; align-items: flex-end; font-size: 0.78rem; color: rgba(255,255,255,.9); }
        .fb__roster-h { font-family: var(--font-mono); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,.7); margin-bottom: 0.1rem; }
        .fb__roster .pi { font-size: 0.7rem; margin-right: 0.25rem; }
        .fb__roster-aux { margin-top: 0.2rem; padding-top: 0.25rem; border-top: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.75); }

        /* Chips de piso */
        .chips { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.4rem; margin-bottom: 1rem; }
        .chip { flex: none; display: flex; align-items: center; gap: 0.45rem; padding: 0.5rem 0.85rem; border-radius: 0.7rem; cursor: pointer;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); color: var(--p-text-color); transition: border-color .15s ease, background .15s ease; }
        :host-context(.app-dark) .chip { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .chip:hover { border-color: var(--p-primary-300); }
        .chip.is-on { background: var(--p-primary-50); border-color: var(--p-primary-400); }
        :host-context(.app-dark) .chip.is-on { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); }
        .chip .pi { color: var(--p-primary-600); }
        .chip__n { font-family: var(--font-mono); font-weight: 700; font-size: 0.78rem; }
        .chip__name { font-size: 0.8rem; white-space: nowrap; }

        /* KPIs */
        .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.1rem; }
        @media (min-width: 768px) { .kpis { grid-template-columns: repeat(4, 1fr); } }
        .kpi { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem; border-radius: 0.9rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .kpi { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .kpi .pi { font-size: 1.2rem; }
        .kpi b { font-family: var(--font-display); font-size: 1.25rem; }
        .kpi span { font-size: 0.76rem; color: var(--p-text-muted-color); font-weight: 600; }
        .kpi--ocup .pi { color: var(--p-primary-600); }
        .kpi--libre .pi { color: #0369a1; }
        .kpi--limp .pi { color: #b45309; }
        .kpi--post .pi { color: #be123c; }

        /* Selector de vista */
        .viewseg { display: inline-flex; gap: 0.25rem; padding: 0.2rem; border-radius: 0.7rem; background: var(--p-surface-100); margin-bottom: 1rem; }
        :host-context(.app-dark) .viewseg { background: var(--p-surface-800); }
        .viewseg__btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.85rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 0.82rem; color: var(--p-text-muted-color); transition: background .15s ease, color .15s ease; }
        .viewseg__btn .pi { font-size: 0.85rem; }
        .viewseg__btn.is-on { background: var(--p-surface-0); color: var(--p-primary-700); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
        :host-context(.app-dark) .viewseg__btn.is-on { background: var(--p-surface-900); color: var(--p-primary-200); }

        /* ── Plano arquitectónico interactivo ── */
        .plano { border: 2px solid var(--p-primary-400); border-radius: 1rem; overflow: hidden; background: var(--p-surface-0); }
        :host-context(.app-dark) .plano { background: var(--p-surface-900); border-color: color-mix(in srgb, var(--p-primary-color) 45%, var(--p-surface-700)); }
        .plano__bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; padding: 0.7rem 1rem; border-bottom: 1.5px dashed var(--p-primary-300); background: var(--p-primary-50); }
        :host-context(.app-dark) .plano__bar { background: color-mix(in srgb, var(--p-primary-color) 12%, var(--p-surface-900)); border-bottom-color: color-mix(in srgb, var(--p-primary-color) 40%, var(--p-surface-700)); }
        .plano__title { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-weight: 700; font-size: 0.78rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--p-primary-700); }
        :host-context(.app-dark) .plano__title { color: var(--p-primary-200); }
        .plano__legend { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .lg { font-size: 0.62rem; font-weight: 700; padding: 0.12rem 0.5rem; border-radius: 9999px; display: inline-flex; align-items: center; gap: 0.3rem; }
        .lg::before { content: ''; width: 0.55rem; height: 0.55rem; border-radius: 2px; }
        .lg--libre { background: var(--p-surface-100); color: var(--p-text-muted-color); } .lg--libre::before { background: var(--p-primary-400); }
        .lg--ocupada { background: var(--p-primary-50); color: var(--p-primary-700); } .lg--ocupada::before { background: var(--p-primary-600); }
        .lg--reservada { background: #ede9fe; color: #6d28d9; } .lg--reservada::before { background: #a78bfa; }
        .lg--limpieza { background: #fef3c7; color: #b45309; } .lg--limpieza::before { background: #f59e0b; }

        .plano__sheet { position: relative; padding: 1.1rem;
            background-image:
                linear-gradient(color-mix(in srgb, var(--p-primary-color) 12%, transparent) 1px, transparent 1px),
                linear-gradient(90deg, color-mix(in srgb, var(--p-primary-color) 12%, transparent) 1px, transparent 1px);
            background-size: 26px 26px; }
        :host-context(.app-dark) .plano__sheet { background-color: var(--p-surface-950); }

        .corridor { position: relative; height: 2.2rem; margin-bottom: 1.1rem; border-radius: 0.4rem; border: 1.5px dashed var(--p-primary-300);
            background: repeating-linear-gradient(90deg, transparent 0 18px, color-mix(in srgb, var(--p-primary-color) 16%, transparent) 18px 20px);
            display: flex; align-items: center; justify-content: center; }
        .corridor span { font-family: var(--font-mono); font-size: 0.6rem; font-weight: 700; letter-spacing: 0.3em; color: var(--p-primary-600); background: var(--p-surface-0); padding: 0 0.5rem; }
        :host-context(.app-dark) .corridor span { background: var(--p-surface-950); }

        .wing { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }
        @media (min-width: 720px) { .wing { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1200px) { .wing { grid-template-columns: repeat(4, 1fr); } }

        .proom { position: relative; padding: 0.75rem 0.6rem 0.6rem; border: 2px solid var(--p-primary-500); border-radius: 0.3rem; background: var(--p-surface-0); }
        :host-context(.app-dark) .proom { background: var(--p-surface-900); border-color: color-mix(in srgb, var(--p-primary-color) 55%, var(--p-surface-700)); }
        .proom__tag { position: absolute; top: -0.62rem; left: 0.6rem; font-family: var(--font-mono); font-size: 0.56rem; font-weight: 700; letter-spacing: 0.06em; color: var(--p-primary-700); background: var(--p-surface-0); padding: 0 0.35rem; }
        :host-context(.app-dark) .proom__tag { background: var(--p-surface-900); color: var(--p-primary-200); }
        .proom__door { position: absolute; top: -2px; right: 1.1rem; width: 1.6rem; height: 3px; background: var(--p-surface-0); }
        :host-context(.app-dark) .proom__door { background: var(--p-surface-900); }
        .proom__beds { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.15rem; }

        .pbed { position: relative; min-height: 5.4rem; padding: 1.2rem 0.3rem 0.35rem; cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 0.2rem; text-align: center;
            border: 1.5px solid var(--p-primary-400); border-radius: 4px; background: var(--p-surface-50);
            transition: transform .15s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease, border-color .15s ease, background .15s ease; }
        :host-context(.app-dark) .pbed { background: var(--p-surface-800); border-color: var(--p-surface-600); }
        .pbed__pillow { position: absolute; top: 5px; left: 6px; right: 6px; height: 0.8rem; border: 1.5px solid var(--p-primary-300); border-radius: 3px; background: color-mix(in srgb, var(--p-primary-color) 8%, transparent); }
        .pbed:hover { transform: translateY(-3px); box-shadow: 0 12px 22px -14px rgba(0,0,0,.5); border-color: var(--p-primary-600); }
        .pbed__code { font-family: var(--font-mono); font-size: 0.6rem; font-weight: 700; color: var(--p-text-muted-color); }
        .pbed__who { width: 1.9rem; height: 1.9rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.66rem; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .pbed__pod { font-size: 0.54rem; font-weight: 700; padding: 0.02rem 0.35rem; border-radius: 9999px; background: var(--p-primary-50); color: var(--p-primary-700); }
        .pbed__pod--pre { background: #fef3c7; color: #b45309; }
        .pbed__icon .pi { font-size: 1.1rem; }
        .pbed__cta { font-size: 0.54rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--p-primary-600); }
        .pbed[data-st="libre"] { border-style: dashed; }
        .pbed[data-st="libre"] .pbed__icon .pi { color: var(--p-primary-500); }
        .pbed[data-st="ocupada"] { background: var(--p-primary-50); border-color: var(--p-primary-500); }
        :host-context(.app-dark) .pbed[data-st="ocupada"] { background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-900)); }
        .pbed[data-st="reservada"] { border-color: #a78bfa; background: #f5f3ff; }
        :host-context(.app-dark) .pbed[data-st="reservada"] { background: color-mix(in srgb, #7c3aed 16%, var(--p-surface-900)); }
        .pbed[data-st="reservada"] .pbed__icon .pi, .pbed[data-st="reservada"] .pbed__cta { color: #7c3aed; }
        .pbed[data-st="reservada"] .pbed__pillow { border-color: #c4b5fd; }
        .pbed[data-st="limpieza"] { border-color: #f59e0b; background: #fffbeb; }
        :host-context(.app-dark) .pbed[data-st="limpieza"] { background: color-mix(in srgb, #f59e0b 14%, var(--p-surface-900)); }
        .pbed[data-st="limpieza"] .pbed__icon .pi, .pbed[data-st="limpieza"] .pbed__cta { color: #b45309; }
        .pbed[data-st="limpieza"] .pbed__pillow { border-color: #fcd34d; }

        /* Mapa de camas */
        .beds { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; }
        @media (min-width: 640px) { .beds { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1100px) { .beds { grid-template-columns: repeat(3, 1fr); } }
        .bed { display: flex; flex-direction: column; gap: 0.6rem; padding: 0.9rem 1rem; border-radius: 0.9rem;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); min-height: 9rem; transition: box-shadow .2s ease, transform .15s ease; }
        :host-context(.app-dark) .bed { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .bed[data-st="ocupada"] { border-left: 4px solid var(--p-primary-500); }
        .bed[data-st="libre"] { border-left: 4px solid #38bdf8; }
        .bed[data-st="limpieza"] { border-left: 4px solid #f59e0b; }
        .bed:hover { box-shadow: 0 12px 26px -16px rgba(0,0,0,.4); transform: translateY(-2px); }
        .bed__top { display: flex; align-items: center; justify-content: space-between; }
        .bed__code { font-family: var(--font-mono); font-weight: 700; font-size: 0.9rem; color: var(--p-text-color); }
        .bed__state { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.12rem 0.5rem; border-radius: 9999px; }
        .bed[data-st="ocupada"] .bed__state { background: var(--p-primary-50); color: var(--p-primary-700); }
        .bed[data-st="libre"] .bed__state { background: #e0f2fe; color: #0369a1; }
        .bed[data-st="limpieza"] .bed__state { background: #fef3c7; color: #b45309; }
        :host-context(.app-dark) .bed[data-st="ocupada"] .bed__state { background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-900)); color: var(--p-primary-200); }

        .bed__pac { display: flex; align-items: center; gap: 0.6rem; }
        .bed__avatar { flex: none; width: 2.4rem; height: 2.4rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 0.8rem; color: #fff; background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700)); }
        .bed__name { font-weight: 700; color: var(--p-text-color); line-height: 1.15; font-size: 0.92rem; }
        .bed__meta { font-size: 0.74rem; color: var(--p-text-muted-color); }
        .bed__proc { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--p-text-color); }
        .bed__proc .pi { color: var(--p-primary-600); font-size: 0.78rem; }
        .bed__tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
        .tag { font-size: 0.68rem; font-weight: 700; padding: 0.12rem 0.5rem; border-radius: 9999px; }
        .tag--pod { background: var(--p-primary-50); color: var(--p-primary-700); }
        .tag--pre { background: #fef3c7; color: #b45309; }
        .tag--obs { background: var(--p-surface-100); color: var(--p-text-muted-color); font-weight: 600; }
        :host-context(.app-dark) .tag--obs { background: var(--p-surface-800); }
        .bed__links { display: flex; align-items: center; gap: 0.05rem; margin-top: auto; padding-top: 0.3rem; border-top: 1px solid var(--p-surface-200); }
        :host-context(.app-dark) .bed__links { border-top-color: var(--p-surface-700); }
        .bed__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; flex: 1; color: var(--p-text-muted-color); text-align: center; }
        .bed__empty > .pi { font-size: 1.6rem; color: var(--p-primary-300); }
        .bed[data-st="limpieza"] .bed__empty > .pi { color: #f59e0b; }

        /* Estado Reservada (inspirado en BedWise: libres/ocupadas/reservadas) */
        .kpi--res .pi { color: #7c3aed; }
        .bed[data-st="reservada"] { border-left: 4px solid #a78bfa; }
        .bed[data-st="reservada"] .bed__state { background: #ede9fe; color: #6d28d9; }
        :host-context(.app-dark) .bed[data-st="reservada"] .bed__state { background: color-mix(in srgb, #7c3aed 22%, var(--p-surface-900)); color: #c4b5fd; }
        .bed[data-st="reservada"] .bed__empty > .pi { color: #a78bfa; }
        .bed__resnota { font-size: 0.74rem; color: var(--p-text-muted-color); max-width: 16rem; }

        /* Info del traslado */
        .tras-info { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.8rem; border-radius: 0.6rem;
            background: var(--p-primary-50); border: 1px solid var(--p-primary-200); }
        :host-context(.app-dark) .tras-info { background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900)); border-color: var(--p-surface-700); }
        .tras-info .pi { color: var(--p-primary-600); }
    `]
})
export class PisoComponent {
    private pacienteService = inject(PacienteService);
    private activo = inject(PacienteActivoService);
    private pisoService = inject(PisoService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private platformId = inject(PLATFORM_ID);

    readonly pisos = PISOS;
    readonly turnos = TURNOS;

    pisoNumero = signal(1);
    vista = signal<'mapa' | 'lista'>('mapa');
    turno = signal<TurnoNombre>(turnoActual());
    camas = signal<Cama[]>([]);
    private pacientes = signal<Paciente[]>([]);
    loading = signal(true);
    private loadedPiso: number | null = null;

    dialogVisible = false;
    camaSel = signal<Cama | null>(null);
    asignar: { pacienteId?: number; procedimiento?: string } = {};

    todasCamas = signal<Cama[]>([]);
    trasladoVisible = false;
    traslado: { origen?: Cama; pisoDestino?: number; camaDestinoId?: number } = {};

    piso = computed<Piso>(() => PISOS.find((p) => p.numero === this.pisoNumero())!);
    turnoInfo = computed(() => TURNOS.find((t) => t.key === this.turno())!);
    rol = computed(() => rolDeTurno(this.pisoNumero(), this.turno()));

    camasOrdenadas = computed(() => [...this.camas()].sort((a, b) => a.codigo.localeCompare(b.codigo)));

    /** Agrupa las camas del piso en cuartos de 2 (C-101+C-102 = Cuarto 1, etc.). */
    cuartos = computed(() => {
        const map = new Map<number, Cama[]>();
        for (const c of this.camasOrdenadas()) {
            const n = parseInt(c.codigo.replace(/\D/g, ''), 10) || 0;
            const idx = n % 100 || 1;               // posición 1..N dentro del piso
            const room = Math.ceil(idx / 2) || 1;   // 2 camas por cuarto
            (map.get(room) ?? map.set(room, []).get(room)!).push(c);
        }
        return [...map.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([numero, camas]) => ({ numero, camas, ocupadas: camas.filter((x) => x.estado === 'OCUPADA').length }));
    });
    ocupadas = computed(() => this.camas().filter((c) => c.estado === 'OCUPADA').length);
    libres = computed(() => this.camas().filter((c) => c.estado === 'LIBRE').length);
    reservadas = computed(() => this.camas().filter((c) => c.estado === 'RESERVADA').length);
    limpieza = computed(() => this.camas().filter((c) => c.estado === 'LIMPIEZA').length);
    total = computed(() => this.camas().length);
    postOp = computed(() => this.camas().filter((c) => c.estado === 'OCUPADA' && c.diaPostOp != null && !c.preOp).length);
    tasaOcupacion = computed(() => { const t = this.total(); return t ? Math.round((this.ocupadas() / t) * 100) : 0; });

    /** Pisos con al menos una cama libre (destinos de traslado). */
    pisosDestino = computed(() => {
        const libres = this.todasCamas().filter((c) => c.estado === 'LIBRE');
        return [...new Set(libres.map((c) => c.pisoNumero))].sort((a, b) => a - b).map((n) => {
            const piso = PISOS.find((p) => p.numero === n);
            const count = libres.filter((c) => c.pisoNumero === n).length;
            return { value: n, label: `Piso ${n} · ${piso?.nombre ?? ''} (${count} libre${count === 1 ? '' : 's'})` };
        });
    });

    pacientesDisponibles = computed(() => {
        const ocupados = new Set(this.camas().filter((c) => c.pacienteId != null).map((c) => c.pacienteId));
        return this.pacientes()
            .filter((p) => !ocupados.has(p.id))
            .map((p) => ({ id: p.id, label: `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres} · ${p.carnetAsegurado}` }));
    });

    constructor() {
        this.pacienteService.getAll().subscribe((d) => this.pacientes.set(d));
        this.cargarTodas();
        effect(() => {
            const n = this.pisoNumero();
            if (n === this.loadedPiso) return;
            this.loadedPiso = n;
            this.cargarCamas(n);
        });
    }

    private cargarCamas(piso: number): void {
        this.loading.set(true);
        this.pisoService.getCamasByPiso(piso).subscribe({
            next: (d) => { this.camas.set(Array.isArray(d) ? d : []); this.loading.set(false); },
            error: () => { this.loading.set(false); this.camas.set([]); }
        });
    }

    private cargarTodas(): void {
        this.pisoService.getTodas().subscribe((d) => this.todasCamas.set(Array.isArray(d) ? d : []));
    }

    private recargar(): void {
        this.cargarCamas(this.pisoNumero());
        this.cargarTodas();
    }

    /** Camas libres del piso destino elegido (método: se reevalúa en cada CD). */
    camasDestino(): { value: number; label: string }[] {
        const n = this.traslado.pisoDestino;
        if (n == null) return [];
        return this.todasCamas()
            .filter((c) => c.pisoNumero === n && c.estado === 'LIBRE' && c.id !== this.traslado.origen?.id)
            .sort((a, b) => a.codigo.localeCompare(b.codigo))
            .map((c) => ({ value: c.id!, label: c.codigo }));
    }

    nombreDeCama(c: Cama): string {
        const p = this.pacienteDe(c);
        return p ? `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}` : 'Paciente';
    }

    pacienteDe(c: Cama): Paciente | undefined {
        return c.pacienteId != null ? this.pacientes().find((p) => p.id === c.pacienteId) : undefined;
    }
    initials(p: Paciente): string {
        return `${p.apellidoPaterno?.[0] ?? ''}${p.nombres?.[0] ?? ''}`.toUpperCase();
    }
    estadoLabel(e: Cama['estado']): string {
        return { OCUPADA: 'Ocupada', LIBRE: 'Libre', RESERVADA: 'Reservada', LIMPIEZA: 'Limpieza', BLOQUEADA: 'Bloqueada' }[e];
    }

    // ── Mapa interactivo por cuartos ─────────────────────────────────────────
    iconoEstado(e: EstadoCama): string {
        return { LIBRE: 'pi-plus-circle', LIMPIEZA: 'pi-sparkles', RESERVADA: 'pi-bookmark-fill', OCUPADA: 'pi-user', BLOQUEADA: 'pi-lock' }[e];
    }

    ctaDe(c: Cama): string {
        return { LIBRE: 'Ocupar', RESERVADA: 'Asignar', LIMPIEZA: 'Liberar', OCUPADA: '', BLOQUEADA: '' }[c.estado];
    }

    tooltipDe(c: Cama): string {
        switch (c.estado) {
            case 'OCUPADA': return `${this.nombreDeCama(c)} · ${c.procedimiento || 'Internación'} — clic: signos vitales`;
            case 'LIBRE': return `${c.codigo} libre — clic para ocupar`;
            case 'RESERVADA': return c.reservaNota || `${c.codigo} reservada — clic para asignar`;
            case 'LIMPIEZA': return `${c.codigo} en limpieza — clic para liberar`;
            default: return this.estadoLabel(c.estado);
        }
    }

    /** Selección de una cama en el mapa: pulso + acción según estado. */
    seleccionarCama(c: Cama, ev: Event): void {
        const el = ev.currentTarget as HTMLElement;
        if (isPlatformBrowser(this.platformId) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.fromTo(el, { scale: 0.95 }, { scale: 1, duration: 0.32, ease: 'back.out(2)' });
        }
        switch (c.estado) {
            case 'LIBRE':
            case 'RESERVADA':
                this.abrirAsignar(c);
                break;
            case 'LIMPIEZA':
                this.marcarLibre(c);
                break;
            case 'OCUPADA': {
                const p = this.pacienteDe(c);
                if (p?.id) this.abrir('signos-vitales', p.id);
                break;
            }
            default:
                break;
        }
    }

    abrir(form: string, pacienteId: number): void {
        this.activo.setId(pacienteId);
        this.router.navigate([`/app/enfermeria/${form}`]);
    }

    // ── Gestión de camas ────────────────────────────────────────────────────
    abrirAsignar(c: Cama): void {
        this.camaSel.set(c);
        this.asignar = {};
        this.dialogVisible = true;
    }

    confirmarAsignar(): void {
        const cama = this.camaSel();
        if (!cama?.id || !this.asignar.pacienteId) return;
        const payload = {
            estado: 'OCUPADA', pacienteId: this.asignar.pacienteId,
            procedimiento: this.asignar.procedimiento?.trim() || 'Internación quirúrgica',
            preOp: true, diaPostOp: 0
        } as Partial<Cama>;
        this.pisoService.actualizarCama(cama.id, payload).subscribe({
            next: (saved) => {
                this.camas.update((list) => list.map((c) => (c.id === saved.id ? saved : c)));
                this.cargarTodas();
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Paciente internado', detail: `${saved.codigo} ocupada.` });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar la cama.' })
        });
    }

    liberar(c: Cama): void {
        if (!c.id) return;
        const payload = { estado: 'LIMPIEZA', pacienteId: null, procedimiento: null, diaPostOp: null, preOp: false, observacion: null } as unknown as Partial<Cama>;
        this.pisoService.actualizarCama(c.id, payload).subscribe({
            next: (saved) => {
                this.camas.update((list) => list.map((x) => (x.id === saved.id ? saved : x)));
                this.cargarTodas();
                this.messageService.add({ severity: 'info', summary: 'Cama liberada', detail: `${saved.codigo} pasó a limpieza.` });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo liberar la cama.' })
        });
    }

    marcarLibre(c: Cama): void {
        if (!c.id) return;
        const payload = { estado: 'LIBRE', pacienteId: null, procedimiento: null, reservaNota: null } as unknown as Partial<Cama>;
        this.pisoService.actualizarCama(c.id, payload).subscribe({
            next: (saved) => {
                this.camas.update((list) => list.map((x) => (x.id === saved.id ? saved : x)));
                this.cargarTodas();
                this.messageService.add({ severity: 'success', summary: 'Cama disponible', detail: `${saved.codigo} lista para nuevo ingreso.` });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la cama.' })
        });
    }

    // ── Reserva (estado RESERVADA, inspirado en BedWise) ─────────────────────
    reservar(c: Cama): void {
        if (!c.id) return;
        const payload = { estado: 'RESERVADA', reservaNota: 'Reservada por enfermería' } as unknown as Partial<Cama>;
        this.pisoService.actualizarCama(c.id, payload).subscribe({
            next: (saved) => {
                this.camas.update((list) => list.map((x) => (x.id === saved.id ? saved : x)));
                this.cargarTodas();
                this.messageService.add({ severity: 'info', summary: 'Cama reservada', detail: `${saved.codigo} reservada.` });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reservar la cama.' })
        });
    }

    // ── Traslado / derivación entre sectores ─────────────────────────────────
    abrirTraslado(c: Cama): void {
        this.traslado = { origen: c };
        this.trasladoVisible = true;
    }

    confirmarTraslado(): void {
        const o = this.traslado.origen;
        const destinoId = this.traslado.camaDestinoId;
        if (!o?.id || destinoId == null) return;
        const destino = this.todasCamas().find((c) => c.id === destinoId);
        const ocupar = {
            estado: 'OCUPADA', pacienteId: o.pacienteId, procedimiento: o.procedimiento ?? null,
            diaPostOp: o.diaPostOp ?? null, preOp: o.preOp ?? false, observacion: o.observacion ?? null
        } as unknown as Partial<Cama>;
        const liberarOrigen = {
            estado: 'LIMPIEZA', pacienteId: null, procedimiento: null, diaPostOp: null, preOp: false, observacion: null, reservaNota: null
        } as unknown as Partial<Cama>;
        this.pisoService.actualizarCama(destinoId, ocupar).subscribe({
            next: () => this.pisoService.actualizarCama(o.id!, liberarOrigen).subscribe({
                next: () => {
                    this.trasladoVisible = false;
                    this.recargar();
                    this.messageService.add({ severity: 'success', summary: 'Traslado realizado', detail: `${o.codigo} → ${destino?.codigo} (Piso ${destino?.pisoNumero}). Origen en limpieza.` });
                },
                error: () => this.errorTraslado()
            }),
            error: () => this.errorTraslado()
        });
    }

    private errorTraslado(): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar el traslado.' });
    }
}
