import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { VServicios } from '@/app/core/models/paciente.model';

@Component({
  selector: 'app-servicios-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule],
  template: `
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <p-checkbox
          [(ngModel)]="vServicios().pt1"
          [binary]="true"
          inputId="pt1"
          (ngModelChange)="updateModel('pt1', $event)"
        />
        <label for="pt1">PT1</label>
      </div>
      <div class="flex items-center gap-2">
        <p-checkbox
          [(ngModel)]="vServicios().pt2"
          [binary]="true"
          inputId="pt2"
          (ngModelChange)="updateModel('pt2', $event)"
        />
        <label for="pt2">PT2</label>
      </div>
      <div class="flex items-center gap-2">
        <p-checkbox
          [(ngModel)]="vServicios().pip"
          [binary]="true"
          inputId="pip"
          (ngModelChange)="updateModel('pip', $event)"
        />
        <label for="pip">PIP</label>
      </div>
      <div class="flex items-center gap-2">
        <p-checkbox
          [(ngModel)]="vServicios().pipa"
          [binary]="true"
          inputId="pipa"
          (ngModelChange)="updateModel('pipa', $event)"
        />
        <label for="pipa">PIPA</label>
      </div>
      <div class="flex items-center gap-2">
        <p-checkbox
          [(ngModel)]="vServicios().papa"
          [binary]="true"
          inputId="papa"
          (ngModelChange)="updateModel('papa', $event)"
        />
        <label for="papa">PAPA</label>
      </div>
      <div class="flex items-center gap-2">
        <p-checkbox
          [(ngModel)]="vServicios().pic"
          [binary]="true"
          inputId="pic"
          (ngModelChange)="updateModel('pic', $event)"
        />
        <label for="pic">PIC</label>
      </div>
    </div>
  `,
})
export class ServiciosCheckboxComponent {
  vServicios = model.required<VServicios>();

  updateModel(field: keyof VServicios, value: boolean): void {
    this.vServicios.update((current) => ({ ...current, [field]: value }));
  }
}
