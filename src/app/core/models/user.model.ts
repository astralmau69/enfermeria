/**
 * MODEL: User
 *
 * Interfaz que define la estructura del usuario del sistema.
 * Extender con los campos necesarios para cada proyecto.
 *
 * role: Puede ser 'ADMIN' | 'USER' u otros roles que el proyecto requiera.
 */
export interface User {
    id?: number;              // Para compatibilidad
    idUsuario: number;        // ID estándar de COSSMIL
    name: string;             // Nombre visual completo
    email: string;
    rol?: string;             // Rol corto (ADMIN/USER)
    role?: string;            // Rol descriptivo (ADMINISTRADOR SICOC)
    usuario?: string;         // Username (dfloresr)
    nombres?: string;
    primerApellido?: string;
    segundoApellido?: string;
    area?: string;
    reparticion?: string;
    fotoPerfil?: any;         // Datos de imagen de perfil
    sistemasHabilitados?: any[]; // Lista de sistemas con acceso
}
