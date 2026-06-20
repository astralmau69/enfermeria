export interface Usuario {
    idUsuario?: number;
    usuario: string;
    nombres: string;
    primerApellido?: string;
    segundoApellido?: string;
    email: string;
    rol: string;
    area?: string;
    reparticion?: string;
    fotoPerfil?: any;
}

export interface UsuarioCreateDTO {
    idUsuario?: number;
    usuario: string;
    nombres: string;
    primerApellido?: string;
    segundoApellido?: string;
    email: string;
    rol?: string;
    area?: string;
    reparticion?: string;
    idArchivoFoto?: number;
}

export interface UsuarioUpdateDTO {
    nombres?: string;
    primerApellido?: string;
    segundoApellido?: string;
    email?: string;
    rol?: string;
    area?: string;
    reparticion?: string;
    idArchivoFoto?: number;
}
