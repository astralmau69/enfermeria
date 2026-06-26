import {
    Component, Input, Output, EventEmitter, ElementRef, ViewChild,
    AfterViewInit, OnDestroy, inject, PLATFORM_ID, ViewEncapsulation, computed, signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * ProfileCard — Tarjeta de perfil holográfica con tilt 3D que sigue el puntero.
 *
 * Port a Angular del componente React de ReactBits (reactbits.dev). El CSS es el
 * original (agnóstico de framework); el motor de inclinación (RAF + variables CSS)
 * se reimplementó en TypeScript/Angular. Respeta `prefers-reduced-motion`.
 */

const DEFAULT_INNER_GRADIENT = 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)';

const ANIMATION_CONFIG = {
    INITIAL_DURATION: 1200,
    INITIAL_X_OFFSET: 70,
    INITIAL_Y_OFFSET: 60,
    DEVICE_BETA_OFFSET: 20,
    ENTER_TRANSITION_MS: 180
} as const;

const clamp = (v: number, min = 0, max = 100): number => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3): number => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number): number =>
    round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

@Component({
    selector: 'app-profile-card',
    standalone: true,
    imports: [CommonModule],
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./profile-card.css'],
    template: `
        <div #wrap class="pc-card-wrapper {{ className }}" [style]="cardStyle()">
            @if (behindGlowEnabled) { <div class="pc-behind"></div> }
            <div #shell class="pc-card-shell">
                <section class="pc-card">
                    <div class="pc-inside">
                        <div class="pc-shine"></div>
                        <div class="pc-glare"></div>
                        <div class="pc-content pc-avatar-content">
                            <img class="avatar" [attr.src]="avatarUrl" [alt]="(name || 'User') + ' avatar'"
                                loading="lazy" (error)="onAvatarError($event)" />
                            @if (showUserInfo) {
                                <div class="pc-user-info">
                                    <div class="pc-user-details">
                                        <div class="pc-mini-avatar">
                                            <img [attr.src]="miniAvatarUrl || avatarUrl" [alt]="(name || 'User') + ' mini avatar'"
                                                loading="lazy" (error)="onMiniAvatarError($event)" />
                                        </div>
                                        <div class="pc-user-text">
                                            <div class="pc-handle">{{ '@' + handle }}</div>
                                            <div class="pc-status">{{ status }}</div>
                                        </div>
                                    </div>
                                    <button class="pc-contact-btn" type="button" style="pointer-events: auto;"
                                        [attr.aria-label]="'Contact ' + (name || 'user')" (click)="handleContactClick()">
                                        {{ contactText }}
                                    </button>
                                </div>
                            }
                        </div>
                        <div class="pc-content">
                            <div class="pc-details">
                                <h3>{{ name }}</h3>
                                <p>{{ title }}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `
})
export class ProfileCardComponent implements AfterViewInit, OnDestroy {
    @Input() avatarUrl = '';
    @Input() iconUrl?: string;
    @Input() grainUrl?: string;
    @Input() innerGradient?: string;
    @Input() behindGlowEnabled = true;
    @Input() behindGlowColor?: string;
    @Input() behindGlowSize?: string;
    @Input() className = '';
    @Input() enableTilt = true;
    @Input() enableMobileTilt = false;
    @Input() mobileTiltSensitivity = 5;
    @Input() miniAvatarUrl?: string;
    @Input() name = 'Javi A. Torres';
    @Input() title = 'Software Engineer';
    @Input() handle = 'javicodes';
    @Input() status = 'Online';
    @Input() contactText = 'Contact';
    @Input() showUserInfo = true;
    @Output() contactClick = new EventEmitter<void>();

    @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;
    @ViewChild('shell') shellRef!: ElementRef<HTMLDivElement>;

    private platformId = inject(PLATFORM_ID);

    // ── Variables CSS por instancia (gradiente interno, icono, glow) ──
    private inputsSig = signal(0);
    cardStyle = computed<Record<string, string>>(() => {
        this.inputsSig();
        return {
            '--icon': this.iconUrl ? `url(${this.iconUrl})` : 'none',
            '--grain': this.grainUrl ? `url(${this.grainUrl})` : 'none',
            '--inner-gradient': this.innerGradient ?? DEFAULT_INNER_GRADIENT,
            '--behind-glow-color': this.behindGlowColor ?? 'rgba(125, 190, 255, 0.67)',
            '--behind-glow-size': this.behindGlowSize ?? '50%'
        };
    });

    // ── Estado del motor de tilt ──
    private rafId: number | null = null;
    private running = false;
    private lastTs = 0;
    private currentX = 0;
    private currentY = 0;
    private targetX = 0;
    private targetY = 0;
    private initialUntil = 0;
    private readonly DEFAULT_TAU = 0.14;
    private readonly INITIAL_TAU = 0.6;

    private enterTimer: number | null = null;
    private leaveRaf: number | null = null;
    private deviceListening = false;

    ngAfterViewInit(): void {
        this.inputsSig.update((v) => v + 1); // recomputa cardStyle con los @Input ya resueltos

        // Aplica las variables CSS de instancia directamente (robusto en cualquier runtime).
        const wrap = this.wrapRef?.nativeElement;
        if (wrap) {
            for (const [k, v] of Object.entries(this.cardStyle())) wrap.style.setProperty(k, v);
        }

        if (!isPlatformBrowser(this.platformId) || !this.enableTilt) return;

        const shell = this.shellRef?.nativeElement;
        if (!shell) return;

        shell.addEventListener('pointerenter', this.onPointerEnter);
        shell.addEventListener('pointermove', this.onPointerMove);
        shell.addEventListener('pointerleave', this.onPointerLeave);
        shell.addEventListener('click', this.onShellClick);

        const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
        const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
        this.setImmediate(initialX, initialY);
        this.toCenter();
        this.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
    }

    ngOnDestroy(): void {
        const shell = this.shellRef?.nativeElement;
        if (shell) {
            shell.removeEventListener('pointerenter', this.onPointerEnter);
            shell.removeEventListener('pointermove', this.onPointerMove);
            shell.removeEventListener('pointerleave', this.onPointerLeave);
            shell.removeEventListener('click', this.onShellClick);
        }
        if (this.deviceListening) window.removeEventListener('deviceorientation', this.onDeviceOrientation);
        if (this.enterTimer) window.clearTimeout(this.enterTimer);
        if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
        this.cancel();
    }

    // ── Motor de tilt (RAF con suavizado exponencial) ──
    private setVarsFromXY(x: number, y: number): void {
        const shell = this.shellRef?.nativeElement;
        const wrap = this.wrapRef?.nativeElement;
        if (!shell || !wrap) return;

        const width = shell.clientWidth || 1;
        const height = shell.clientHeight || 1;
        const percentX = clamp((100 / width) * x);
        const percentY = clamp((100 / height) * y);
        const centerX = percentX - 50;
        const centerY = percentY - 50;

        const properties: Record<string, string> = {
            '--pointer-x': `${percentX}%`,
            '--pointer-y': `${percentY}%`,
            '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
            '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
            '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
            '--pointer-from-top': `${percentY / 100}`,
            '--pointer-from-left': `${percentX / 100}`,
            '--rotate-x': `${round(-(centerX / 5))}deg`,
            '--rotate-y': `${round(centerY / 4)}deg`
        };
        for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    }

    private step = (ts: number): void => {
        if (!this.running) return;
        if (this.lastTs === 0) this.lastTs = ts;
        const dt = (ts - this.lastTs) / 1000;
        this.lastTs = ts;

        const tau = ts < this.initialUntil ? this.INITIAL_TAU : this.DEFAULT_TAU;
        const k = 1 - Math.exp(-dt / tau);

        this.currentX += (this.targetX - this.currentX) * k;
        this.currentY += (this.targetY - this.currentY) * k;
        this.setVarsFromXY(this.currentX, this.currentY);

        const stillFar = Math.abs(this.targetX - this.currentX) > 0.05 || Math.abs(this.targetY - this.currentY) > 0.05;
        if (stillFar || document.hasFocus()) {
            this.rafId = requestAnimationFrame(this.step);
        } else {
            this.running = false;
            this.lastTs = 0;
            if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        }
    };

    private start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTs = 0;
        this.rafId = requestAnimationFrame(this.step);
    }

    private setImmediate(x: number, y: number): void {
        this.currentX = x;
        this.currentY = y;
        this.setVarsFromXY(x, y);
    }

    private setTarget(x: number, y: number): void {
        this.targetX = x;
        this.targetY = y;
        this.start();
    }

    private toCenter(): void {
        const shell = this.shellRef?.nativeElement;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
    }

    private beginInitial(durationMs: number): void {
        this.initialUntil = performance.now() + durationMs;
        this.start();
    }

    private cancel(): void {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.running = false;
        this.lastTs = 0;
    }

    private getOffsets(evt: PointerEvent, el: HTMLElement): { x: number; y: number } {
        const rect = el.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    // ── Handlers (arrow fns para add/removeEventListener estables) ──
    private onPointerMove = (event: PointerEvent): void => {
        const shell = this.shellRef?.nativeElement;
        if (!shell) return;
        const { x, y } = this.getOffsets(event, shell);
        this.setTarget(x, y);
    };

    private onPointerEnter = (event: PointerEvent): void => {
        const shell = this.shellRef?.nativeElement;
        if (!shell) return;
        shell.classList.add('active', 'entering');
        if (this.enterTimer) window.clearTimeout(this.enterTimer);
        this.enterTimer = window.setTimeout(() => shell.classList.remove('entering'), ANIMATION_CONFIG.ENTER_TRANSITION_MS);
        const { x, y } = this.getOffsets(event, shell);
        this.setTarget(x, y);
    };

    private onPointerLeave = (): void => {
        const shell = this.shellRef?.nativeElement;
        if (!shell) return;
        this.toCenter();
        const checkSettle = (): void => {
            const settled = Math.hypot(this.targetX - this.currentX, this.targetY - this.currentY) < 0.6;
            if (settled) {
                shell.classList.remove('active');
                this.leaveRaf = null;
            } else {
                this.leaveRaf = requestAnimationFrame(checkSettle);
            }
        };
        if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
        this.leaveRaf = requestAnimationFrame(checkSettle);
    };

    private onShellClick = (): void => {
        if (!this.enableMobileTilt || location.protocol !== 'https:') return;
        const anyMotion = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
        if (anyMotion && typeof anyMotion.requestPermission === 'function') {
            anyMotion.requestPermission()
                .then((state: string) => { if (state === 'granted') this.addDeviceListener(); })
                .catch(() => void 0);
        } else {
            this.addDeviceListener();
        }
    };

    private addDeviceListener(): void {
        if (this.deviceListening) return;
        window.addEventListener('deviceorientation', this.onDeviceOrientation);
        this.deviceListening = true;
    }

    private onDeviceOrientation = (event: DeviceOrientationEvent): void => {
        const shell = this.shellRef?.nativeElement;
        if (!shell) return;
        const { beta, gamma } = event;
        if (beta == null || gamma == null) return;
        const centerX = shell.clientWidth / 2;
        const centerY = shell.clientHeight / 2;
        const x = clamp(centerX + gamma * this.mobileTiltSensitivity, 0, shell.clientWidth);
        const y = clamp(centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * this.mobileTiltSensitivity, 0, shell.clientHeight);
        this.setTarget(x, y);
    };

    onAvatarError(e: Event): void {
        (e.target as HTMLImageElement).style.display = 'none';
    }
    onMiniAvatarError(e: Event): void {
        const t = e.target as HTMLImageElement;
        t.style.opacity = '0.5';
        t.src = this.avatarUrl;
    }
    handleContactClick(): void {
        this.contactClick.emit();
    }
}
