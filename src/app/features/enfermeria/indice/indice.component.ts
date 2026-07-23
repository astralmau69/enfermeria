import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RevealDirective } from '@/app/shared/directives/reveal.directive';
import { RolEnf, etiquetaRol } from '@/app/core/models/responsable-enfermeria';

interface Tarjeta {
    label: string;
    desc: string;
    icon: string;
    path: string;
    rol: RolEnf;
}

interface Seccion {
    titulo: string;
    icon: string;
    resumen: string;
    tarjetas: Tarjeta[];
}

/**
 * Índice / Guía del módulo de Enfermería.
 *
 * Mapa visual de TODO lo que la enfermera puede hacer, agrupado por secciones y
 * con la etiqueta de quién es responsable (Auxiliar / Licenciada). Es la puerta
 * de entrada simple y entendible al módulo.
 */
@Component({
    selector: 'app-enf-indice',
    standalone: true,
    imports: [CommonModule, RouterModule, RevealDirective],
    template: `
        <!-- Banner -->
        <section class="hero" appReveal>
            <div class="hero__glow hero__glow-1"></div>
            <div class="hero__glow hero__glow-2"></div>
            <div class="hero__brand">
                <span class="hero__emblem"><i class="pi pi-heart-fill"></i></span>
                <div>
                    <div class="hero__eyebrow">COSSMIL · Hospital Militar Central</div>
                    <h1 class="hero__title">Guía de Enfermería</h1>
                    <p class="hero__sub">Todo lo que hacés en tu turno, ordenado por secciones. Tocá una tarjeta para abrirla.</p>
                </div>
            </div>
            <div class="hero__legend">
                <span class="hero__legend-h">Responsable</span>
                <span class="rol rol--AUX">Auxiliar</span>
                <span class="rol rol--LIC">Licenciada</span>
                <span class="rol rol--AMBAS">Aux + Lic</span>
            </div>
        </section>

        <!-- Secciones -->
        @for (s of secciones; track s.titulo; let si = $index) {
            <section class="sec" [appReveal]="si">
                <header class="sec__head">
                    <span class="sec__icon"><i class="pi" [ngClass]="s.icon"></i></span>
                    <div>
                        <h2 class="sec__title">{{ s.titulo }}</h2>
                        <p class="sec__resumen">{{ s.resumen }}</p>
                    </div>
                </header>
                <div class="grid">
                    @for (t of s.tarjetas; track t.path; let i = $index) {
                        <a class="card" [routerLink]="link(t.path)" [appReveal]="i" [revealY]="8">
                            <span class="card__icon"><i class="pi" [ngClass]="t.icon"></i></span>
                            <div class="card__body">
                                <div class="card__top">
                                    <span class="card__label">{{ t.label }}</span>
                                    <span class="rol" [class]="'rol rol--' + t.rol">{{ rol(t.rol) }}</span>
                                </div>
                                <p class="card__desc">{{ t.desc }}</p>
                            </div>
                            <i class="pi pi-angle-right card__chev"></i>
                        </a>
                    }
                </div>
            </section>
        }
    `,
    styles: [`
        :host { display: block; }

        /* Banner */
        .hero { position: relative; overflow: hidden; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;
            padding: 1.5rem 1.75rem; border-radius: 1.25rem; color: #fff; margin-bottom: 1.5rem;
            background: linear-gradient(120deg, var(--p-primary-700) 0%, var(--p-primary-500) 52%, #0f766e 100%);
            box-shadow: 0 16px 34px color-mix(in srgb, var(--p-primary-color) 30%, transparent); }
        .hero__glow { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: .4; pointer-events: none; }
        .hero__glow-1 { width: 320px; height: 320px; background: rgba(255,255,255,.4); top: -140px; right: -40px; }
        .hero__glow-2 { width: 260px; height: 260px; background: rgba(16,185,129,.5); bottom: -120px; left: 25%; }
        .hero__brand { display: flex; align-items: center; gap: 1rem; position: relative; z-index: 1; }
        .hero__emblem { flex: none; width: 3.4rem; height: 3.4rem; border-radius: 1rem; background: rgba(255,255,255,.18); backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .hero__eyebrow { font-family: var(--font-mono); font-size: 0.64rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,.78); }
        .hero__title { font-family: var(--font-display); font-weight: 700; font-size: 1.7rem; line-height: 1.08; margin: 0.15rem 0 0; color: #fff; }
        .hero__sub { margin: 0.3rem 0 0; color: rgba(255,255,255,.85); font-size: 0.92rem; max-width: 34rem; }
        .hero__legend { position: relative; z-index: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; padding: 0.6rem 0.9rem; border-radius: 0.9rem; background: rgba(255,255,255,.14); backdrop-filter: blur(6px); }
        .hero__legend-h { font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,.85); width: 100%; }

        /* Secciones */
        .sec { margin-bottom: 1.6rem; }
        .sec__head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem; }
        .sec__icon { flex: none; width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center;
            background: var(--p-primary-50); color: var(--p-primary-600); font-size: 1.15rem; }
        :host-context(.app-dark) .sec__icon { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .sec__title { font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; margin: 0; color: var(--p-text-color); }
        .sec__resumen { margin: 0.1rem 0 0; font-size: 0.82rem; color: var(--p-text-muted-color); }

        .grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.85rem; }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }

        .card { display: flex; align-items: flex-start; gap: 0.8rem; padding: 0.95rem 1rem; border-radius: 0.95rem; cursor: pointer; text-decoration: none;
            background: var(--p-surface-0); border: 1px solid var(--p-surface-200); color: var(--p-text-color);
            transition: border-color .15s ease, box-shadow .2s ease, transform .12s ease; }
        :host-context(.app-dark) .card { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .card:hover { border-color: var(--p-primary-300); box-shadow: 0 12px 26px -18px rgba(0,0,0,.45); transform: translateY(-2px); }
        .card__icon { flex: none; width: 2.6rem; height: 2.6rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center;
            background: var(--p-primary-50); color: var(--p-primary-600); font-size: 1.15rem; }
        :host-context(.app-dark) .card__icon { background: color-mix(in srgb, var(--p-primary-color) 16%, var(--p-surface-900)); color: var(--p-primary-200); }
        .card__body { flex: 1 1 auto; min-width: 0; }
        .card__top { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
        .card__label { font-weight: 700; font-size: 0.95rem; color: var(--p-text-color); line-height: 1.15; }
        .card__desc { margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--p-text-muted-color); line-height: 1.3; }
        .card__chev { color: var(--p-text-muted-color); align-self: center; }

        /* Chips de rol */
        .rol { flex: none; font-size: 0.62rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 9999px; white-space: nowrap; }
        .rol--AUX { background: #e0f2fe; color: #0369a1; }
        .rol--LIC { background: var(--p-primary-50); color: var(--p-primary-700); }
        .rol--AMBAS { background: #f3e8ff; color: #7c3aed; }
        :host-context(.app-dark) .rol--AUX { background: color-mix(in srgb, #0369a1 26%, var(--p-surface-900)); color: #7dd3fc; }
        :host-context(.app-dark) .rol--LIC { background: color-mix(in srgb, var(--p-primary-color) 20%, var(--p-surface-900)); color: var(--p-primary-200); }
        :host-context(.app-dark) .rol--AMBAS { background: color-mix(in srgb, #7c3aed 26%, var(--p-surface-900)); color: #c4b5fd; }
    `]
})
export class EnfermeriaIndiceComponent {
    rol(r: RolEnf): string { return etiquetaRol(r); }
    link(path: string): string[] { return ['/app/enfermeria', ...path.split('/')]; }

    readonly secciones: Seccion[] = [
        {
            titulo: 'Mi turno', icon: 'pi-home', resumen: 'Empezá tu jornada con el panorama del turno.',
            tarjetas: [
                { label: 'Inicio de turno', desc: 'Ronda, pendientes y tareas prioritarias del turno.', icon: 'pi-home', path: 'inicio', rol: 'AMBAS' }
            ]
        },
        {
            titulo: 'Emergencias', icon: 'pi-exclamation-triangle', resumen: 'Área de urgencias con clasificación de triage.',
            tarjetas: [
                { label: 'Triage / Emergencias', desc: 'Clasificá por gravedad (Manchester), tomá signos y seguí al paciente hasta alta o internación.', icon: 'pi-exclamation-triangle', path: 'emergencias', rol: 'LIC' }
            ]
        },
        {
            titulo: 'Consulta externa', icon: 'pi-inbox', resumen: 'Atención ambulatoria dividida por consultorio.',
            tarjetas: [
                { label: 'Consultorios por especialidad', desc: 'Elegí una especialidad y trabajá su cola: triage, signos y armá la lista para el médico.', icon: 'pi-th-large', path: 'consultorios', rol: 'AMBAS' },
                { label: 'Recepción / Turnos', desc: 'Admisión general del día y Formulario 002.', icon: 'pi-inbox', path: 'consulta-externa', rol: 'AMBAS' },
                { label: 'Procedimientos ambulatorios', desc: 'Inyectables, nebulizaciones, curaciones y vacunas.', icon: 'pi-bolt', path: 'procedimientos-ambulatorios', rol: 'AUX' }
            ]
        },
        {
            titulo: 'Hospitalización', icon: 'pi-building', resumen: 'Pacientes internados y camas por especialidad.',
            tarjetas: [
                { label: 'Pacientes en piso', desc: 'Censo de pacientes internados a tu cargo.', icon: 'pi-users', path: 'pacientes', rol: 'AMBAS' },
                { label: 'Hospitalización por especialidad', desc: 'Mapa de camas de los 9 servicios: ocupar, reservar, trasladar y dar de alta.', icon: 'pi-th-large', path: 'hospitalizacion', rol: 'LIC' },
                { label: 'Terapia Intensiva (UTI)', desc: 'Camas críticas del servicio de terapia intensiva.', icon: 'pi-heart-fill', path: 'hospitalizacion/9', rol: 'LIC' }
            ]
        },
        {
            titulo: 'Interconsultas', icon: 'pi-send', resumen: 'Valoraciones pedidas a otras especialidades.',
            tarjetas: [
                { label: 'Interconsultas por especialidad', desc: 'Solicitar, programar y seguir valoraciones entre servicios.', icon: 'pi-send', path: 'interconsultas', rol: 'LIC' }
            ]
        },
        {
            titulo: 'Cuidados de enfermería', icon: 'pi-heart', resumen: 'Hojas de cabecera que llenás junto a la cama del paciente.',
            tarjetas: [
                { label: 'Signos vitales', desc: 'Respiración, pulso, temperatura y presión por turno.', icon: 'pi-chart-line', path: 'signos-vitales', rol: 'AUX' },
                { label: 'Medicamentos (Kardex)', desc: 'Administración de medicación indicada y horarios.', icon: 'pi-box', path: 'medicamentos', rol: 'LIC' },
                { label: 'Notas de enfermería', desc: 'Registro de lo observado y realizado en el turno.', icon: 'pi-pencil', path: 'notas-diarias', rol: 'AMBAS' },
                { label: 'Balance hídrico', desc: 'Ingresos y egresos de líquidos con balance por turno.', icon: 'pi-sliders-h', path: 'balance-hidrico', rol: 'AUX' },
                { label: 'Sondas y vías', desc: 'Control de sondas, vías periféricas y catéteres.', icon: 'pi-link', path: 'dispositivos', rol: 'LIC' },
                { label: 'Curaciones', desc: 'Valoración de heridas (Braden) y registro de curaciones.', icon: 'pi-plus-circle', path: 'curaciones', rol: 'LIC' },
                { label: 'Glucometría', desc: 'Control glucémico capilar y esquema de insulina.', icon: 'pi-percentage', path: 'glucometria', rol: 'AUX' }
            ]
        },
        {
            titulo: 'Ingreso / Egreso', icon: 'pi-file-edit', resumen: 'Documentación de admisión, informe y consentimiento.',
            tarjetas: [
                { label: 'Admisión hospitalaria', desc: 'Registro de ingreso del paciente al servicio.', icon: 'pi-file-edit', path: 'admision', rol: 'LIC' },
                { label: 'Informe estadístico', desc: 'Datos de ingreso para estadística hospitalaria.', icon: 'pi-chart-bar', path: 'estadistico', rol: 'LIC' },
                { label: 'Consentimiento', desc: 'Consentimiento informado firmado.', icon: 'pi-check-square', path: 'consentimiento', rol: 'LIC' },
                { label: 'Evolución y tratamiento', desc: 'Seguimiento de evolución y tratamiento indicado.', icon: 'pi-list', path: 'evolucion', rol: 'LIC' }
            ]
        }
    ];
}
