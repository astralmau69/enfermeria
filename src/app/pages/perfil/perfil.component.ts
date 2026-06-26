import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileCardComponent } from '@/app/shared/components/profile-card/profile-card.component';
import { AuthService } from '@/app/core/services/auth.service';

/**
 * Mi Perfil — presenta al usuario logueado (enfermera/médico) con la tarjeta
 * holográfica ProfileCard. El avatar se genera como SVG con las iniciales sobre
 * la paleta teal-aqua institucional (no hay fotos reales en el demo).
 */
@Component({
    selector: 'app-perfil',
    standalone: true,
    imports: [CommonModule, ProfileCardComponent],
    template: `
        <section class="perfil">
            <header class="perfil__head">
                <span class="perfil__eyebrow">COSSMIL · Hospital Militar Central</span>
                <h1 class="perfil__title">Mi perfil</h1>
                <p class="perfil__sub">Credencial del personal de turno</p>
            </header>

            <div class="perfil__card">
                <app-profile-card
                    [name]="nombre()"
                    [title]="cargo()"
                    [handle]="handle()"
                    [status]="estado()"
                    contactText="Ir a mi área"
                    [avatarUrl]="avatarUrl()"
                    [showUserInfo]="true"
                    [enableTilt]="true"
                    [enableMobileTilt]="false"
                    behindGlowColor="rgba(34, 211, 238, 0.55)"
                    innerGradient="linear-gradient(145deg, #0f766e88 0%, #22d3ee44 100%)"
                    (contactClick)="irAMiArea()" />
            </div>
        </section>
    `,
    styles: [`
        :host { display: block; }
        .perfil { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 1rem 0 2rem; }
        .perfil__head { text-align: center; }
        .perfil__eyebrow { font-family: var(--font-mono); font-size: 0.64rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: var(--p-primary-600); }
        .perfil__title { font-family: var(--font-display); font-weight: 700; font-size: 1.9rem; letter-spacing: -0.015em; margin: 0.25rem 0 0; color: var(--p-text-color); }
        .perfil__sub { margin: 0.2rem 0 0; color: var(--p-text-muted-color); font-size: 0.9rem; }
        .perfil__card { width: 100%; max-width: 360px; }
    `]
})
export class PerfilComponent {
    private auth = inject(AuthService);
    private router = inject(Router);

    private user = computed(() => this.auth.currentUser());

    nombre = computed(() => this.user()?.name ?? 'Personal de salud');
    handle = computed(() => this.user()?.usuario ?? 'cossmil');
    cargo = computed(() => {
        const rol = this.user()?.rol;
        if (rol === 'DOCTOR') return 'Médico · HMC';
        if (rol === 'ENFERMERA') return 'Lic. Enfermería · HMC';
        return 'Personal · HMC';
    });
    estado = computed(() => (this.user()?.rol === 'DOCTOR' ? 'En consulta' : 'En turno'));

    avatarUrl = computed<string>(() => {
        const svg = this.user()?.rol === 'DOCTOR' ? this.doctorSvg() : this.nurseSvg();
        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    });

    /** Ilustración genérica de médico (bata + estetoscopio) sobre fondo teal. */
    private doctorSvg(): string {
        return `<svg xmlns='http://www.w3.org/2000/svg' width='460' height='640' viewBox='0 0 460 640'>` +
            `<defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0f766e'/><stop offset='1' stop-color='#0b302c'/></linearGradient></defs>` +
            `<rect width='460' height='640' fill='url(#bg)'/>` +
            `<circle cx='230' cy='300' r='190' fill='#ffffff' opacity='0.05'/>` +
            `<path d='M62 640 L104 432 Q150 388 230 388 Q310 388 356 432 L398 640 Z' fill='#f1f5f9'/>` +
            `<path d='M198 392 L230 472 L212 392 Z' fill='#cbd5e1'/><path d='M262 392 L230 472 L248 392 Z' fill='#cbd5e1'/>` +
            `<path d='M214 392 L230 432 L246 392 Z' fill='#0d9488'/>` +
            `<path d='M222 430 L238 430 L244 548 L216 548 Z' fill='#0b6b62'/>` +
            `<rect x='206' y='332' width='48' height='74' rx='20' fill='#e7b189'/>` +
            `<path d='M156 282 Q150 186 230 186 Q310 186 304 282 Q298 236 230 238 Q162 240 156 282 Z' fill='#3a2c22'/>` +
            `<circle cx='158' cy='290' r='15' fill='#f0c19a'/><circle cx='302' cy='290' r='15' fill='#f0c19a'/>` +
            `<circle cx='230' cy='288' r='74' fill='#f0c19a'/>` +
            `<circle cx='205' cy='294' r='7' fill='#2b2018'/><circle cx='255' cy='294' r='7' fill='#2b2018'/>` +
            `<path d='M198 396 C188 468 156 470 156 534' fill='none' stroke='#22d3ee' stroke-width='9' stroke-linecap='round'/>` +
            `<path d='M262 396 C272 470 232 486 204 552' fill='none' stroke='#22d3ee' stroke-width='9' stroke-linecap='round'/>` +
            `<circle cx='206' cy='564' r='18' fill='#22d3ee'/><circle cx='206' cy='564' r='9' fill='#0e7490'/>` +
            `</svg>`;
    }

    /** Ilustración genérica de enfermera (cofia con cruz + scrubs) sobre fondo teal. */
    private nurseSvg(): string {
        return `<svg xmlns='http://www.w3.org/2000/svg' width='460' height='640' viewBox='0 0 460 640'>` +
            `<defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0d9488'/><stop offset='1' stop-color='#0b302c'/></linearGradient></defs>` +
            `<rect width='460' height='640' fill='url(#bg)'/>` +
            `<circle cx='230' cy='300' r='190' fill='#ffffff' opacity='0.05'/>` +
            `<path d='M66 640 L106 434 Q152 392 230 392 Q308 392 354 434 L394 640 Z' fill='#15b8a6'/>` +
            `<path d='M206 396 L230 452 L254 396 Z' fill='#0c302c' opacity='0.22'/>` +
            `<path d='M250 472 L330 472' stroke='#0c302c' stroke-width='4' opacity='0.18' stroke-linecap='round'/>` +
            `<rect x='206' y='336' width='48' height='70' rx='20' fill='#e7b189'/>` +
            `<path d='M152 300 Q150 198 230 198 Q310 198 308 300 Q300 258 230 256 Q160 258 152 300 Z' fill='#3a2a20'/>` +
            `<rect x='150' y='288' width='22' height='92' rx='11' fill='#3a2a20'/><rect x='288' y='288' width='22' height='92' rx='11' fill='#3a2a20'/>` +
            `<circle cx='230' cy='290' r='72' fill='#f0c19a'/>` +
            `<circle cx='206' cy='296' r='7' fill='#2b2018'/><circle cx='254' cy='296' r='7' fill='#2b2018'/>` +
            `<path d='M176 212 L284 212 L296 250 L164 250 Z' fill='#ffffff'/>` +
            `<rect x='224' y='220' width='12' height='24' rx='2' fill='#e4572e'/><rect x='218' y='226' width='24' height='12' rx='2' fill='#e4572e'/>` +
            `<path d='M200 400 C192 470 168 470 168 532' fill='none' stroke='#0e7490' stroke-width='9' stroke-linecap='round'/>` +
            `<path d='M260 400 C268 472 230 486 206 550' fill='none' stroke='#0e7490' stroke-width='9' stroke-linecap='round'/>` +
            `<circle cx='208' cy='562' r='18' fill='#0e7490'/><circle cx='208' cy='562' r='9' fill='#22d3ee'/>` +
            `</svg>`;
    }

    irAMiArea(): void {
        const rol = this.user()?.rol;
        this.router.navigate([rol === 'DOCTOR' ? '/app/doctor/pacientes' : '/app/enfermeria/inicio']);
    }
}
