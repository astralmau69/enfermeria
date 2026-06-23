import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paciente } from '@/app/core/models/paciente.model';

@Component({
  selector: 'app-paciente-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (paciente(); as p) {
      <div class="ph-card mb-4">
        <div class="ph-avatar">{{ initials(p) }}</div>
        <div class="flex-1 min-w-0">
          <div class="ph-name">{{ p.apellidoPaterno }} {{ p.apellidoMaterno }} {{ p.nombres }}</div>
          <div class="ph-meta">
            <span><i class="pi pi-id-card"></i> {{ p.carnetAsegurado }}</span>
            <span><i class="pi pi-calendar"></i> {{ p.edad ?? '—' }} años</span>
            <span><i class="pi pi-user"></i> {{ p.sexo === 'M' ? 'Masculino' : 'Femenino' }}</span>
            @if (servicio()) { <span><i class="pi pi-briefcase"></i> {{ servicio() }}</span> }
            @if (cama()) { <span><i class="pi pi-th-large"></i> Cama {{ cama() }}</span> }
          </div>
        </div>
        <span class="ph-chip">{{ p.tipoSeguro ?? 'ENFERMEDAD' }}</span>
      </div>
    }
  `,
  styles: [`
    .ph-card {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.25rem; border-radius: 1rem;
      background: linear-gradient(120deg, var(--p-primary-50) 0%, color-mix(in srgb, var(--p-primary-100) 60%, transparent) 100%);
      border: 1px solid var(--p-primary-200);
    }
    :host-context(.app-dark) .ph-card {
      background: linear-gradient(120deg, color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-900)) 0%, var(--p-surface-900) 100%);
      border-color: var(--p-surface-700);
    }
    .ph-avatar {
      flex: none; width: 3rem; height: 3rem; border-radius: 9999px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem; color: #fff;
      background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700));
      box-shadow: 0 4px 12px color-mix(in srgb, var(--p-primary-color) 35%, transparent);
    }
    .ph-name { font-weight: 700; font-size: 1.05rem; color: var(--p-text-color); }
    .ph-meta { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; margin-top: 0.25rem; font-size: 0.85rem; color: var(--p-text-muted-color); }
    .ph-meta i { font-size: 0.8rem; margin-right: 0.25rem; color: var(--p-primary-color); }
    .ph-chip {
      flex: none; align-self: flex-start; font-size: 0.7rem; font-weight: 600; letter-spacing: .03em;
      padding: 0.2rem 0.6rem; border-radius: 9999px;
      background: var(--p-primary-color); color: var(--p-primary-contrast-color);
    }
  `]
})
export class PacienteHeaderComponent {
  paciente = input.required<Paciente>();
  servicio = input<string>();
  cama = input<string>();

  initials(p: Paciente): string {
    return `${p.apellidoPaterno?.[0] ?? ''}${p.nombres?.[0] ?? ''}`.toUpperCase();
  }
}
