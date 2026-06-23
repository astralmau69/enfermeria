import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { PacienteService } from '@/app/core/services/paciente.service';
import { Paciente } from '@/app/core/models/paciente.model';

@Component({
  selector: 'app-paciente-search',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule],
  template: `
    <p-autoComplete
      [(ngModel)]="selectedPaciente"
      [suggestions]="filteredPacientes()"
      (completeMethod)="search($event)"
      (onSelect)="onSelect($event)"
      field="carnetAsegurado"
      placeholder="Buscar por carnet o nombre..."
      [minLength]="1"
      [forceSelection]="true"
      styleClass="w-full"
    >
      <ng-template let-paciente #item>
        <div class="flex flex-col">
          <span class="font-semibold">{{ paciente.carnetAsegurado }}</span>
          <span class="text-sm text-gray-600">
            {{ paciente.apellidoPaterno }} {{ paciente.apellidoMaterno }} {{ paciente.nombres }}
          </span>
        </div>
      </ng-template>
    </p-autoComplete>
  `,
})
export class PacienteSearchComponent {
  private pacienteService = inject(PacienteService);

  selectedPaciente: Paciente | null = null;
  allPacientes = signal<Paciente[]>([]);
  filteredPacientes = signal<Paciente[]>([]);

  pacienteSelected = output<Paciente>();

  private loaded = false;

  search(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();

    if (!this.loaded) {
      this.pacienteService.getAll().subscribe((data) => {
        this.allPacientes.set(data);
        this.loaded = true;
        this.filterPacientes(query);
      });
    } else {
      this.filterPacientes(query);
    }
  }

  private filterPacientes(query: string): void {
    const filtered = this.allPacientes().filter((p) => {
      const nombreCompleto = `${p.apellidoPaterno} ${p.apellidoMaterno} ${p.nombres}`.toLowerCase();
      return (
        p.carnetAsegurado.toLowerCase().includes(query) ||
        nombreCompleto.includes(query)
      );
    });
    this.filteredPacientes.set(filtered);
  }

  onSelect(event: { value: Paciente }): void {
    this.pacienteSelected.emit(event.value);
  }
}
