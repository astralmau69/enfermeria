import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-recepcion',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule],
  templateUrl: './recepcion.html',
  styleUrl: './recepcion.scss',
})
export class Recepcion {

  solicitudes = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      cargo: 'Administrador',
      estado: 'ACTIVO'
    },
    {
      id: 2,
      nombre: 'María Gómez',
      cargo: 'Secretaria',
      estado: 'INACTIVO'
    }
  ];

  estudiantes = [
    { matricula: 'A001', nombre: 'Juan Pérez', carrera: 'Ingeniería' },
    { matricula: 'A002', nombre: 'María Gómez', carrera: 'Administración' },
    { matricula: 'A003', nombre: 'Carlos Díaz', carrera: 'Contabilidad' }
  ];

  lista = [...this.estudiantes];
  matricula = '';

  buscarPorMatricula() {
    const texto = this.matricula.trim().toLowerCase();

    if (!texto) {
      this.lista = [...this.estudiantes];
      return;
    }

    this.lista = this.estudiantes.filter((estudiante) =>
      estudiante.matricula.toLowerCase().includes(texto) ||
      estudiante.nombre.toLowerCase().includes(texto)
    );
  }

}
