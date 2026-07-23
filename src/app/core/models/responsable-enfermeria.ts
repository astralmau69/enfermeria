/**
 * Responsable de enfermería por tarea.
 *
 * En un hospital de tercer nivel el trabajo se reparte entre la ENFERMERA
 * LICENCIADA (valoración, administración de medicación EV, planes de cuidado,
 * gestión) y la AUXILIAR DE ENFERMERÍA (higiene, confort, toma de constantes,
 * apoyo). Etiquetar cada hoja/tarea con su responsable hace el módulo claro y
 * entendible tanto para auxiliares como para licenciadas.
 */
export type RolEnf = 'AUX' | 'LIC' | 'AMBAS';

/** Texto legible del responsable. */
export function etiquetaRol(rol: RolEnf): string {
    return rol === 'AUX' ? 'Auxiliar' : rol === 'LIC' ? 'Licenciada' : 'Aux + Lic';
}

/** Descripción corta de quién hace la tarea (para tooltips / índice). */
export function detalleRol(rol: RolEnf): string {
    return rol === 'AUX'
        ? 'Realizada por la auxiliar de enfermería.'
        : rol === 'LIC'
          ? 'Responsabilidad de la enfermera licenciada.'
          : 'Trabajo compartido entre licenciada y auxiliar.';
}

/**
 * Responsable sugerido por cada hoja/sección (clave = path de la ruta de
 * enfermería). Se usa en el Índice y en el encabezado de cada hoja.
 */
export const RESPONSABLE_HOJA: Record<string, RolEnf> = {
    'inicio': 'AMBAS',
    'indice': 'AMBAS',
    'pacientes': 'AMBAS',
    'hospitalizacion': 'LIC',
    'pisos': 'LIC',
    'consulta-externa': 'AMBAS',
    'procedimientos-ambulatorios': 'AUX',
    'interconsultas': 'LIC',
    'signos-vitales': 'AUX',
    'medicamentos': 'LIC',
    'notas-diarias': 'AMBAS',
    'balance-hidrico': 'AUX',
    'dispositivos': 'LIC',
    'curaciones': 'LIC',
    'glucometria': 'AUX',
    'admision': 'LIC',
    'estadistico': 'LIC',
    'consentimiento': 'LIC',
    'evolucion': 'LIC'
};

/** Devuelve el responsable de una hoja (por defecto AMBAS). */
export function responsableDe(path: string): RolEnf {
    return RESPONSABLE_HOJA[path] ?? 'AMBAS';
}
