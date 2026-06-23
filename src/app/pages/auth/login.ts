import { Component, ElementRef, AfterViewInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { gsap } from 'gsap';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth-response';

type Rol = 'DOCTOR' | 'ENFERMERA';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule],
    template: `
        <div class="login-root min-h-dvh w-full flex bg-surface-50 dark:bg-surface-950">
            <!-- ───────────── Panel de marca (izquierda) ───────────── -->
            <aside class="brand-panel hidden lg:flex flex-col justify-between relative overflow-hidden w-1/2 p-12 text-white">
                <div class="brand-glow brand-glow-1"></div>
                <div class="brand-glow brand-glow-2"></div>

                <div class="brand-logo flex items-center gap-3 relative z-10">
                    <div class="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur">
                        <i class="pi pi-heart-fill text-2xl"></i>
                    </div>
                    <div class="leading-tight">
                        <div class="font-bold text-lg">COSSMIL</div>
                        <div class="text-white/70 text-sm">Hospital Militar Central</div>
                    </div>
                </div>

                <div class="relative z-10">
                    <h1 class="brand-title text-4xl xl:text-5xl font-bold leading-tight mb-4">
                        Enfermería de Piso<br />
                        <span class="text-white/80">Hospitalización</span>
                    </h1>
                    <p class="brand-sub text-white/75 text-lg max-w-md">
                        Sistema de historia clínica digital. Registro de hojas de cuidado, signos vitales,
                        medicación y exámenes complementarios en tiempo real.
                    </p>

                    <!-- Línea de latido animada -->
                    <svg class="heartbeat mt-10 w-full max-w-md" viewBox="0 0 600 80" fill="none" aria-hidden="true">
                        <path class="heartbeat-path" d="M0 40 H180 L210 40 L230 12 L255 68 L280 40 L300 40 L315 28 L330 52 L345 40 H600"
                            stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>

                <div class="brand-foot text-white/50 text-sm relative z-10">
                    © 2026 COSSMIL · Bolivia
                </div>
            </aside>

            <!-- ───────────── Formulario (derecha) ───────────── -->
            <main class="flex-1 flex items-center justify-center p-6 sm:p-10">
                <div class="login-card w-full max-w-md">
                    <div class="text-center mb-8">
                        <div class="lg:hidden flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-100 text-primary-700">
                            <i class="pi pi-heart-fill text-2xl"></i>
                        </div>
                        <h2 class="text-surface-900 dark:text-surface-0 text-3xl font-bold mb-1">Bienvenido</h2>
                        <p class="text-muted-color">Seleccione su perfil para ingresar</p>
                    </div>

                    <!-- Selector de rol -->
                    <div class="grid grid-cols-2 gap-3 mb-6">
                        <button type="button"
                            class="role-card"
                            [class.role-card--active]="rol() === 'DOCTOR'"
                            (click)="selectRol('DOCTOR')">
                            <i class="pi pi-user-plus role-card__icon"></i>
                            <span class="role-card__title">Doctor</span>
                            <span class="role-card__desc">Exámenes complementarios</span>
                        </button>

                        <button type="button"
                            class="role-card"
                            [class.role-card--active]="rol() === 'ENFERMERA'"
                            (click)="selectRol('ENFERMERA')">
                            <i class="pi pi-heart role-card__icon"></i>
                            <span class="role-card__title">Enfermera/o</span>
                            <span class="role-card__desc">Hojas de piso</span>
                        </button>
                    </div>

                    @if (errorMessage()) {
                        <p-message severity="error" [text]="errorMessage()" styleClass="mb-4 w-full" />
                    }

                    <div class="form-field mb-4">
                        <label for="usuario" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Usuario</label>
                        <input pInputText id="usuario" type="text" placeholder="Ingrese su usuario" class="w-full"
                            autocomplete="username" [(ngModel)]="username" (keydown.enter)="onLogin()" />
                    </div>

                    <div class="form-field mb-6">
                        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Contraseña</label>
                        <p-password id="password" [(ngModel)]="password" placeholder="Ingrese su contraseña"
                            [toggleMask]="true" [feedback]="false" styleClass="w-full" inputStyleClass="w-full"
                            autocomplete="current-password" (keydown.enter)="onLogin()" />
                    </div>

                    <div class="form-field">
                        <p-button label="Iniciar Sesión" icon="pi pi-sign-in" styleClass="w-full"
                            (onClick)="onLogin()" [loading]="loading()" />
                    </div>

                    <div class="form-field mt-6 text-center">
                        <span class="text-muted-color text-sm">
                            Demo · Doctor: <b>vvalencia</b> · Enfermera: <b>jsilva</b> · Clave: <b>123456</b>
                        </span>
                    </div>
                </div>
            </main>
        </div>
    `,
    styles: [`
        :host { display: block; }

        .brand-panel {
            background: linear-gradient(140deg, var(--p-primary-700) 0%, var(--p-primary-500) 45%, #0f766e 100%);
        }
        .brand-glow {
            position: absolute; border-radius: 9999px; filter: blur(70px); opacity: .45; pointer-events: none;
        }
        .brand-glow-1 { width: 380px; height: 380px; background: rgba(255,255,255,.35); top: -120px; right: -80px; }
        .brand-glow-2 { width: 300px; height: 300px; background: rgba(16,185,129,.5); bottom: -100px; left: -60px; }

        .role-card {
            display: flex; flex-direction: column; align-items: center; gap: .35rem;
            padding: 1rem .75rem; border-radius: 1rem; cursor: pointer; text-align: center;
            border: 2px solid var(--p-surface-200); background: var(--p-surface-0);
            transition: border-color .2s ease, transform .15s ease, box-shadow .2s ease, background .2s ease;
        }
        :host-context(.app-dark) .role-card { background: var(--p-surface-900); border-color: var(--p-surface-700); }
        .role-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.07); }
        .role-card__icon { font-size: 1.6rem; color: var(--p-text-muted-color); transition: color .2s ease; }
        .role-card__title { font-weight: 600; color: var(--p-text-color); }
        .role-card__desc { font-size: .75rem; color: var(--p-text-muted-color); }
        .role-card--active {
            border-color: var(--p-primary-color);
            background: var(--p-primary-50);
            box-shadow: 0 8px 24px color-mix(in srgb, var(--p-primary-color) 25%, transparent);
        }
        :host-context(.app-dark) .role-card--active { background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900)); }
        .role-card--active .role-card__icon { color: var(--p-primary-color); }

        .heartbeat-path { stroke-dasharray: 1400; stroke-dashoffset: 1400; }
    `]
})
export class Login implements AfterViewInit, OnDestroy {
    private router = inject(Router);
    private authService = inject(AuthService);
    private host = inject(ElementRef<HTMLElement>);
    private platformId = inject(PLATFORM_ID);
    private ctx?: gsap.Context;

    username = '';
    password = '';
    rol = signal<Rol>('ENFERMERA');
    loading = signal(false);
    errorMessage = signal('');

    private readonly mockUsers: Record<Rol, AuthResponse & { usuario: string }> = {
        DOCTOR: {
            usuario: 'vvalencia',
            token: 'mock-jwt-token-doctor',
            user: {
                idUsuario: 1,
                name: 'Dr. Verónica Valencia Carlo',
                email: 'vvalencia@cossmil.gob.bo',
                rol: 'DOCTOR',
                usuario: 'vvalencia',
                nombres: 'Verónica',
                primerApellido: 'Valencia',
                segundoApellido: 'Carlo'
            }
        },
        ENFERMERA: {
            usuario: 'jsilva',
            token: 'mock-jwt-token-enfermera',
            user: {
                idUsuario: 2,
                name: 'Lic. Jacquelin Silva Quispe',
                email: 'jsilva@cossmil.gob.bo',
                rol: 'ENFERMERA',
                usuario: 'jsilva',
                nombres: 'Jacquelin',
                primerApellido: 'Silva',
                segundoApellido: 'Quispe'
            }
        }
    };

    constructor() {
        // Prefill inicial con el rol por defecto
        this.username = this.mockUsers[this.rol()].usuario;
        this.password = '123456';
    }

    selectRol(rol: Rol): void {
        this.rol.set(rol);
        this.username = this.mockUsers[rol].usuario;
        this.password = '123456';
        this.errorMessage.set('');
        this.pulseActiveCard();
    }

    onLogin(): void {
        if (!this.username || !this.password) {
            this.errorMessage.set('Ingrese usuario y contraseña');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        // Frontend-only: validación contra usuarios mock
        setTimeout(() => {
            const candidate = Object.values(this.mockUsers).find(
                (u) => u.usuario.toLowerCase() === this.username.trim().toLowerCase()
            );

            if (candidate && this.password === '123456') {
                this.handleLoginSuccess(candidate);
            } else {
                this.errorMessage.set('Usuario o contraseña incorrectos');
                this.loading.set(false);
            }
        }, 500);
    }

    private handleLoginSuccess(response: AuthResponse): void {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        this.authService.currentUser.set(response.user);
        this.authService.isAuthenticated.set(true);
        this.loading.set(false);

        const destino = response.user.rol === 'DOCTOR' ? '/app/doctor/pacientes' : '/app/enfermeria/pacientes';
        this.router.navigate([destino]);
    }

    // ─────────────────────── Animaciones GSAP ───────────────────────
    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;

        const el = this.host.nativeElement;
        this.ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            tl.from('.brand-panel', { xPercent: -8, opacity: 0, duration: 0.7 })
                .from('.brand-logo', { y: -16, opacity: 0, duration: 0.5 }, '-=0.35')
                .from(['.brand-title', '.brand-sub', '.brand-foot'], { y: 24, opacity: 0, duration: 0.6, stagger: 0.12 }, '-=0.3')
                .from('.login-card', { y: 24, opacity: 0, duration: 0.6 }, '-=0.5')
                .from('.role-card', { y: 18, opacity: 0, duration: 0.45, stagger: 0.1 }, '-=0.3')
                .from('.form-field', { y: 14, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.2');

            // Latido continuo
            gsap.to('.heartbeat-path', {
                strokeDashoffset: 0,
                duration: 2,
                ease: 'power1.inOut',
                repeat: -1,
                repeatDelay: 0.4
            });
        }, el);
    }

    private pulseActiveCard(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;
        const active = this.host.nativeElement.querySelector('.role-card--active');
        if (active) {
            gsap.fromTo(active, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
        }
    }

    ngOnDestroy(): void {
        this.ctx?.revert();
    }
}
