import { Component, OnInit, inject, ChangeDetectorRef, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmationService, MessageService } from 'primeng/api';

// Core
import { UsuarioCrudService } from '@/app/core/services/usuario-crud.service';
import { ArchivoService } from '@/app/core/services/archivo.service';
import { Usuario, UsuarioCreateDTO, UsuarioUpdateDTO } from '@/app/core/models/usuario-crud.model';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [
        CommonModule, 
        ReactiveFormsModule, 
        TableModule, 
        ButtonModule, 
        DialogModule, 
        InputTextModule, 
        ConfirmDialogModule,
        ToastModule,
        AvatarModule,
        FileUploadModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
    users = signal<Usuario[]>([]);
    loading = signal<boolean>(true);
    isSaving = false;
    isEditing = false;
    displayDialog = false;
    dialogTitle = '';
    isUploading = false;
    previewUrl: string | null = null;
    userForm: FormGroup;

    private fb = inject(FormBuilder);
    private userService = inject(UsuarioCrudService);
    private archivoService = inject(ArchivoService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private cdr = inject(ChangeDetectorRef);

    constructor() {
        this.userForm = this.fb.group({
            idUsuario: [null],
            usuario: ['', [Validators.required]],
            nombres: ['', [Validators.required]],
            primerApellido: [''],
            segundoApellido: [''],
            email: ['', [Validators.required, Validators.email]],
            rol: ['USER', [Validators.required]],
            area: [''],
            reparticion: [''],
            idArchivoFoto: [null]
        });
    }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.loading.set(true);
        this.userService.getAll().subscribe({
            next: (data: Usuario[]) => {
                this.users.set(data);
                this.loading.set(false);
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los usuarios.' });
                this.loading.set(false);
            }
        });
    }

    getPhotoUrl(id: number) {
        return this.archivoService.getDownloadUrl(id);
    }

    onPhotoSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            // Mostrar preview local inmediato
            const reader = new FileReader();
            reader.onload = (e: any) => this.previewUrl = e.target.result;
            reader.readAsDataURL(file);

            // Subir al servidor
            this.isUploading = true;
            this.archivoService.upload(file).subscribe({
                next: (res: any) => {
                    this.userForm.patchValue({ idArchivoFoto: res.idArchivo });
                    this.isUploading = false;
                    this.messageService.add({ severity: 'info', summary: 'Subida', detail: 'Foto de perfil cargada.' });
                },
                error: (err: any) => {
                    this.isUploading = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la imagen.' });
                }
            });
        }
    }

    openDialog() {
        this.isEditing = false;
        this.previewUrl = null;
        this.userForm.reset({ rol: 'USER' });
        this.dialogTitle = 'Nuevo Usuario';
        this.displayDialog = true;
    }

    editUser(user: Usuario) {
        this.isEditing = true;
        this.previewUrl = user.fotoPerfil ? this.getPhotoUrl(user.fotoPerfil.idArchivo) : null;
        this.userForm.patchValue({
            ...user,
            idArchivoFoto: user.fotoPerfil?.idArchivo || null
        });
        this.dialogTitle = 'Editar Usuario';
        this.displayDialog = true;
    }

    saveUser() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const formData = this.userForm.value;

        if (this.isEditing) {
            const updateDto: UsuarioUpdateDTO = { ...formData };
            this.userService.update(formData.idUsuario, updateDto).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente.' });
                    this.loadUsers();
                    this.displayDialog = false;
                    this.isSaving = false;
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario.' });
                    this.isSaving = false;
                }
            });
        } else {
            const createDto: UsuarioCreateDTO = { ...formData };
            this.userService.create(createDto).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente.' });
                    this.loadUsers();
                    this.displayDialog = false;
                    this.isSaving = false;
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el usuario.' });
                    this.isSaving = false;
                }
            });
        }
    }

    deleteUser(user: Usuario) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar al usuario ${user.usuario}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.userService.delete(user.idUsuario!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Borrado', detail: 'Usuario eliminado del sistema.' });
                        this.loadUsers();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario.' });
                    }
                });
            }
        });
    }
}
