/**
 * Catálogo de especialidades — Hospital Militar Central (COSSMIL), 3.º nivel.
 *
 * Un hospital de tercer nivel de COSSMIL ofrece una cartera amplia de
 * especialidades, organizadas por grupos. Este catálogo alimenta la Consulta
 * Externa dividida por consultorios y otras vistas del módulo de enfermería.
 *
 * Los nombres se mantienen en MAYÚSCULAS sin tilde para que coincidan con el
 * campo `especialidad` de las consultas (comparación directa).
 */

export type GrupoEspecialidad = 'MEDICINA' | 'CIRUGIA' | 'MATERNO_INFANTIL' | 'APOYO' | 'CRITICA';

export interface Especialidad {
    nombre: string;   // clave que coincide con ConsultaExterna.especialidad (MAYÚSCULAS)
    sigla: string;    // usada en la URL del consultorio (/consultorios/:sigla)
    icon: string;     // ícono PrimeNG
    grupo: GrupoEspecialidad;
}

export const GRUPOS_ESPECIALIDAD: { key: GrupoEspecialidad; label: string; icon: string; desc: string }[] = [
    { key: 'MEDICINA', label: 'Clínicas médicas', icon: 'pi-heart', desc: 'Consultas de especialidades no quirúrgicas' },
    { key: 'CIRUGIA', label: 'Quirúrgicas', icon: 'pi-plus-circle', desc: 'Especialidades quirúrgicas' },
    { key: 'MATERNO_INFANTIL', label: 'Materno-infantil', icon: 'pi-users', desc: 'Ginecología, obstetricia y pediatría' },
    { key: 'APOYO', label: 'Apoyo y otras', icon: 'pi-briefcase', desc: 'Odontología, rehabilitación, nutrición' },
    { key: 'CRITICA', label: 'Áreas críticas', icon: 'pi-exclamation-triangle', desc: 'Triage, emergencias y terapia intensiva' }
];

export const ESPECIALIDADES: Especialidad[] = [
    // ── Clínicas médicas ─────────────────────────────────────────────────────
    { nombre: 'MEDICINA INTERNA', sigla: 'MIN', icon: 'pi-briefcase', grupo: 'MEDICINA' },
    { nombre: 'CARDIOLOGIA', sigla: 'CAR', icon: 'pi-heart-fill', grupo: 'MEDICINA' },
    { nombre: 'NEUMOLOGIA', sigla: 'NML', icon: 'pi-cloud', grupo: 'MEDICINA' },
    { nombre: 'GASTROENTEROLOGIA', sigla: 'GAS', icon: 'pi-circle', grupo: 'MEDICINA' },
    { nombre: 'ENDOCRINOLOGIA', sigla: 'END', icon: 'pi-percentage', grupo: 'MEDICINA' },
    { nombre: 'NEFROLOGIA', sigla: 'NEF', icon: 'pi-filter', grupo: 'MEDICINA' },
    { nombre: 'NEUROLOGIA', sigla: 'NRL', icon: 'pi-bolt', grupo: 'MEDICINA' },
    { nombre: 'REUMATOLOGIA', sigla: 'REU', icon: 'pi-wrench', grupo: 'MEDICINA' },
    { nombre: 'HEMATOLOGIA', sigla: 'HEM', icon: 'pi-tint', grupo: 'MEDICINA' },
    { nombre: 'ONCOLOGIA', sigla: 'ONC', icon: 'pi-shield', grupo: 'MEDICINA' },
    { nombre: 'INFECTOLOGIA', sigla: 'INF', icon: 'pi-share-alt', grupo: 'MEDICINA' },
    { nombre: 'DERMATOLOGIA', sigla: 'DER', icon: 'pi-sun', grupo: 'MEDICINA' },
    { nombre: 'GERIATRIA', sigla: 'GER', icon: 'pi-user', grupo: 'MEDICINA' },
    { nombre: 'PSIQUIATRIA', sigla: 'PSQ', icon: 'pi-comments', grupo: 'MEDICINA' },
    { nombre: 'ALERGOLOGIA E INMUNOLOGIA', sigla: 'ALE', icon: 'pi-ban', grupo: 'MEDICINA' },

    // ── Quirúrgicas ──────────────────────────────────────────────────────────
    { nombre: 'CIRUGIA GENERAL', sigla: 'CIR', icon: 'pi-plus-circle', grupo: 'CIRUGIA' },
    { nombre: 'CIRUGIA CARDIOVASCULAR', sigla: 'CCV', icon: 'pi-heart', grupo: 'CIRUGIA' },
    { nombre: 'ANGIOLOGIA Y CIRUGIA VASCULAR', sigla: 'ANG', icon: 'pi-share-alt', grupo: 'CIRUGIA' },
    { nombre: 'NEUROCIRUGIA', sigla: 'NCR', icon: 'pi-bolt', grupo: 'CIRUGIA' },
    { nombre: 'TRAUMATOLOGIA Y ORTOPEDIA', sigla: 'TRA', icon: 'pi-wrench', grupo: 'CIRUGIA' },
    { nombre: 'UROLOGIA', sigla: 'URO', icon: 'pi-filter', grupo: 'CIRUGIA' },
    { nombre: 'OTORRINOLARINGOLOGIA', sigla: 'ORL', icon: 'pi-volume-up', grupo: 'CIRUGIA' },
    { nombre: 'OFTALMOLOGIA', sigla: 'OFT', icon: 'pi-eye', grupo: 'CIRUGIA' },
    { nombre: 'CIRUGIA PLASTICA', sigla: 'CPL', icon: 'pi-star', grupo: 'CIRUGIA' },

    // ── Materno-infantil ─────────────────────────────────────────────────────
    { nombre: 'GINECOLOGIA Y OBSTETRICIA', sigla: 'GIN', icon: 'pi-users', grupo: 'MATERNO_INFANTIL' },
    { nombre: 'PEDIATRIA', sigla: 'PED', icon: 'pi-star', grupo: 'MATERNO_INFANTIL' },
    { nombre: 'NEONATOLOGIA', sigla: 'NEO', icon: 'pi-heart', grupo: 'MATERNO_INFANTIL' },

    // ── Apoyo y otras ────────────────────────────────────────────────────────
    { nombre: 'ODONTOLOGIA', sigla: 'ODO', icon: 'pi-star', grupo: 'APOYO' },
    { nombre: 'FISIOTERAPIA Y REHABILITACION', sigla: 'FIS', icon: 'pi-refresh', grupo: 'APOYO' },
    { nombre: 'NUTRICION', sigla: 'NUT', icon: 'pi-apple', grupo: 'APOYO' },
    { nombre: 'ANESTESIOLOGIA Y DOLOR', sigla: 'ANE', icon: 'pi-moon', grupo: 'APOYO' }
];

/** Busca una especialidad por su sigla (para la ruta del consultorio). */
export function especialidadPorSigla(sigla: string): Especialidad | undefined {
    return ESPECIALIDADES.find((e) => e.sigla.toLowerCase() === sigla.toLowerCase());
}

/** Busca una especialidad por su nombre. */
export function especialidadPorNombre(nombre: string): Especialidad | undefined {
    return ESPECIALIDADES.find((e) => e.nombre === nombre);
}
