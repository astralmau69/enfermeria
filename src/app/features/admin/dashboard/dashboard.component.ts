import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '@/app/core/services/auth.service';
import { UsuarioCrudService } from '@/app/core/services/usuario-crud.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <div class="card bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded p-6 shadow-sm">
                <div class="text-3xl text-surface-900 dark:text-surface-0 font-bold mb-4">Dashboard</div>
                <p class="text-muted-color mb-4 text-lg">
                    Bienvenido de vuelta, <strong>{{ authService.currentUser()?.name || 'Usuario' }}</strong>.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div class="bg-blue-100 dark:bg-blue-900 p-4 rounded border-l-4 border-blue-500 shadow-sm">
                        <span class="text-blue-700 dark:text-blue-100 font-medium text-lg flex items-center gap-2">
                            <i class="pi pi-users"></i> Usuarios Registrados
                        </span>
                        <div class="text-3xl text-surface-900 dark:text-surface-0 font-bold mt-2">
                            {{ userCount() }}
                        </div>
                    </div>

                    <div class="bg-green-100 dark:bg-green-900 p-4 rounded border-l-4 border-green-500 shadow-sm">
                        <span class="text-green-700 dark:text-green-100 font-medium text-lg flex items-center gap-2">
                            <i class="pi pi-check-circle"></i> Módulo Core
                        </span>
                        <div class="text-3xl text-surface-900 dark:text-surface-0 font-bold mt-2">Activo</div>
                    </div>

                </div>
            </div>
        </div>

        <!-- PDF Section -->
        <div class="col-span-12">
            <div class="card bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded p-6 shadow-sm overflow-hidden">
                <div class="text-2xl text-surface-900 dark:text-surface-0 font-bold mb-4 flex items-center gap-2">
                    <i class="pi pi-file-pdf text-red-500"></i> Manual de Usuario
                </div>
                <div class="w-full h-[800px] border border-surface-200 dark:border-surface-700 rounded overflow-hidden">
                    <iframe 
                        [src]="pdfUrl" 
                        title="Manual de Usuario" 
                        class="w-full h-full border-none"
                        allow="fullscreen">
                    </iframe>
                </div>
            </div>
        </div>
    </div>
    `
})
export class DashboardComponent implements OnInit {
    public authService = inject(AuthService);
    private userService = inject(UsuarioCrudService);
    private sanitizer = inject(DomSanitizer);

    userCount = signal<number>(0);
    pdfUrl!: SafeResourceUrl;

    ngOnInit() {
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/document/ManualAlmacenWeb02082024.pdf');

        this.userService.getAll().subscribe({
            next: (users) => {
                this.userCount.set(users.length);
            }
        });
    }
}
