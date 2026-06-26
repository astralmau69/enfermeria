/**
 * SEED — Datos iniciales del mock-backend.
 * Se cargan la primera vez; luego el estado vive en localStorage y se puede
 * editar/guardar como si fuese un backend real.
 *
 * 8 pacientes con cuadros clínicos coherentes (Hospital Militar Central, COSSMIL).
 */
import { Paciente } from '../core/models/paciente.model';
import { AdmisionHospitalaria, InformeEstadistico, ConsentimientoInformado } from '../core/models/historia-clinica.model';
import { EvolucionTratamiento, ExamenComplementario } from '../core/models/evolucion.model';
import { NotaDiariaEnfermeria, RegistroMedicamentos, CuadroSignosVitales } from '../core/models/enfermeria.model';
import { ConsultaExterna } from '../core/models/consulta-externa.model';
import { Cama } from '../core/models/piso.model';

const sinServicios = () => ({ pt1: false, pt2: false, pip: false, pipa: false, papa: false, pic: false });

/** Fecha de hoy (el "día" de la cola de consulta externa). */
const HOY = new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_PACIENTES: Paciente[] = [
    {
        id: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA',
        apellidoPaterno: 'PEREZ', apellidoMaterno: 'LIZARAZU', apellidoEsposo: '', nombres: 'ANA MARIA',
        fechaNacimiento: '1953-12-20', edad: 72, sexo: 'F', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'POTOSI', lugarTrabajo: 'SERVICIO PASIVO', ocupacion: 'LABORES DE CASA',
        grado: 'SUBOFICIAL MAYOR MUSICO', unidad: 'SERVICIO PASIVO', fuerza: 'EJERCITO',
        tipoAsegurado: 'ESPOSA', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'EL ALTO', zona: 'Z/ VILLA DELA', calle: 'C/ROMA', numero: '2' },
        datosFamiliares: { nombrePadre: 'FALLECIDO', nombreMadre: 'FALLECIDA', nombreConyuge: 'SP. SOF. MY. RENE ARTURO MARQUEZ C', parentescoProximo: 'HIJA', direccionProximo: 'Z/ VILLA DELA C/ROMA N° 2', telefono: '62979111' },
        vServicios: sinServicios()
    },
    {
        id: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR',
        apellidoPaterno: 'GONZALES', apellidoMaterno: 'QUISPE', nombres: 'JUAN CARLOS',
        fechaNacimiento: '1985-05-12', edad: 41, sexo: 'M', estadoCivil: 'SOLTERO(A)',
        lugarNacimiento: 'COCHABAMBA', lugarTrabajo: 'REGIMIENTO COLORADOS', ocupacion: 'MILITAR',
        grado: 'SARGENTO PRIMERO', unidad: 'RI-1 COLORADOS', fuerza: 'EJERCITO',
        tipoAsegurado: 'ACTIVO', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'MIRAFLORES', calle: 'AV. BUSCH', numero: '1245' },
        datosFamiliares: { nombrePadre: 'CARLOS GONZALES M.', nombreMadre: 'MARIA QUISPE DE GONZALES', personaProxima: 'CARLOS GONZALES M.', parentescoProximo: 'PADRE', telefono: '71234567' },
        vServicios: sinServicios()
    },
    {
        id: 3, carnetAsegurado: '380915RTV', carnetBeneficiario: '780320MTR',
        apellidoPaterno: 'MARTINEZ', apellidoMaterno: 'TORREZ', apellidoEsposo: 'DE VARGAS', nombres: 'ROSA ELENA',
        fechaNacimiento: '1978-03-20', edad: 48, sexo: 'F', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'ORURO', lugarTrabajo: 'SERVICIO PASIVO', ocupacion: 'COMERCIANTE',
        grado: 'MAYOR', unidad: 'SERVICIO PASIVO', fuerza: 'AEREA',
        tipoAsegurado: 'ESPOSA', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'SOPOCACHI', calle: 'C/ SANCHEZ LIMA', numero: '456' },
        datosFamiliares: { nombrePadre: 'PEDRO MARTINEZ R.', nombreMadre: 'JUANA TORREZ DE MARTINEZ', nombreConyuge: 'MY. HUGO VARGAS P.', personaProxima: 'MY. HUGO VARGAS P.', parentescoProximo: 'ESPOSO', telefono: '72345678' },
        vServicios: sinServicios()
    },
    {
        id: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM',
        apellidoPaterno: 'CHOQUE', apellidoMaterno: 'MAMANI', nombres: 'PEDRO',
        fechaNacimiento: '1968-11-22', edad: 58, sexo: 'M', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'LA PAZ', lugarTrabajo: 'SERVICIO PASIVO', ocupacion: 'JUBILADO',
        grado: 'SUBOFICIAL PRIMERO', unidad: 'SERVICIO PASIVO', fuerza: 'EJERCITO',
        tipoAsegurado: 'PASIVO', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'EL ALTO', zona: 'CIUDAD SATELITE', calle: 'C/ 7', numero: '34' },
        datosFamiliares: { nombrePadre: 'FALLECIDO', nombreMadre: 'GREGORIA MAMANI', nombreConyuge: 'JUANA APAZA DE CHOQUE', personaProxima: 'JUANA APAZA DE CHOQUE', parentescoProximo: 'ESPOSA', telefono: '70612233' },
        vServicios: sinServicios()
    },
    {
        id: 5, carnetAsegurado: '920304CRV', carnetBeneficiario: '610508MRV',
        apellidoPaterno: 'ROJAS', apellidoMaterno: 'VARGAS', apellidoEsposo: 'DE TERAN', nombres: 'CARMEN',
        fechaNacimiento: '1992-03-04', edad: 34, sexo: 'F', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'SANTA CRUZ', lugarTrabajo: 'HOGAR', ocupacion: 'LABORES DE CASA',
        grado: 'CAPITAN', unidad: 'SERVICIO ACTIVO', fuerza: 'EJERCITO',
        tipoAsegurado: 'ESPOSA', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'CALACOTO', calle: 'C/ 15', numero: '88' },
        datosFamiliares: { nombrePadre: 'JOSE ROJAS', nombreMadre: 'ELENA VARGAS', nombreConyuge: 'CAP. MARIO TERAN L.', personaProxima: 'CAP. MARIO TERAN L.', parentescoProximo: 'ESPOSO', telefono: '78901234' },
        vServicios: sinServicios()
    },
    {
        id: 6, carnetAsegurado: '581017LFC', carnetBeneficiario: '581017LFC',
        apellidoPaterno: 'FERNANDEZ', apellidoMaterno: 'CALLE', nombres: 'LUIS ALBERTO',
        fechaNacimiento: '1959-10-17', edad: 67, sexo: 'M', estadoCivil: 'VIUDO(A)',
        lugarNacimiento: 'LA PAZ', lugarTrabajo: 'SERVICIO PASIVO', ocupacion: 'JUBILADO',
        grado: 'CORONEL', unidad: 'SERVICIO PASIVO', fuerza: 'AEREA',
        tipoAsegurado: 'PASIVO', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'OBRAJES', calle: 'AV. 14 DE SEPTIEMBRE', numero: '512' },
        datosFamiliares: { nombrePadre: 'FALLECIDO', nombreMadre: 'FALLECIDA', personaProxima: 'PATRICIA FERNANDEZ', parentescoProximo: 'HIJA', telefono: '72200110' },
        vServicios: sinServicios()
    },
    {
        id: 7, carnetAsegurado: '970625MCA', carnetBeneficiario: '661130JCA',
        apellidoPaterno: 'CONDORI', apellidoMaterno: 'APAZA', apellidoEsposo: 'DE HUANCA', nombres: 'MARIA EUGENIA',
        fechaNacimiento: '1997-06-25', edad: 29, sexo: 'F', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'LA PAZ', lugarTrabajo: 'HOGAR', ocupacion: 'LABORES DE CASA',
        grado: 'SARGENTO SEGUNDO', unidad: 'SERVICIO ACTIVO', fuerza: 'EJERCITO',
        tipoAsegurado: 'ESPOSA', tipoSeguro: 'MATERNIDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'EL ALTO', zona: 'VILLA ADELA', calle: 'C/ 4', numero: '120' },
        datosFamiliares: { nombrePadre: 'FELIX CONDORI', nombreMadre: 'ROSA APAZA', nombreConyuge: 'SGTO. JULIO HUANCA', personaProxima: 'SGTO. JULIO HUANCA', parentescoProximo: 'ESPOSO', telefono: '76543210' },
        vServicios: sinServicios()
    },
    {
        id: 8, carnetAsegurado: '810919JSM', carnetBeneficiario: '810919JSM',
        apellidoPaterno: 'SALAZAR', apellidoMaterno: 'MENDOZA', nombres: 'JORGE',
        fechaNacimiento: '1981-09-19', edad: 44, sexo: 'M', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'TARIJA', lugarTrabajo: 'BATALLON DE INGENIEROS', ocupacion: 'MILITAR',
        grado: 'TENIENTE CORONEL', unidad: 'BI-1 INGENIEROS', fuerza: 'EJERCITO',
        tipoAsegurado: 'ACTIVO', tipoSeguro: 'RIESGO_PROFESIONAL',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'SAN JORGE', calle: 'AV. 6 DE AGOSTO', numero: '2340' },
        datosFamiliares: { nombrePadre: 'RAMIRO SALAZAR', nombreMadre: 'LIDIA MENDOZA', nombreConyuge: 'GABRIELA RUIZ DE SALAZAR', personaProxima: 'GABRIELA RUIZ DE SALAZAR', parentescoProximo: 'ESPOSA', telefono: '70778899' },
        vServicios: sinServicios()
    },
    // ── Pacientes quirúrgicos del PISO 1 — CIRUGÍA ───────────────────────────
    {
        id: 9, carnetAsegurado: '730218RQM', carnetBeneficiario: '730218RQM',
        apellidoPaterno: 'QUISPE', apellidoMaterno: 'MAMANI', nombres: 'ROBERTO',
        fechaNacimiento: '1973-02-18', edad: 53, sexo: 'M', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'LA PAZ', ocupacion: 'MILITAR', grado: 'SUBOFICIAL MAYOR', unidad: 'ESCUELA MILITAR', fuerza: 'EJERCITO',
        tipoAsegurado: 'ACTIVO', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'VILLA FATIMA', calle: 'C/ 12', numero: '45' },
        datosFamiliares: { nombreConyuge: 'MARTHA LIMA DE QUISPE', personaProxima: 'MARTHA LIMA DE QUISPE', parentescoProximo: 'ESPOSA', telefono: '71500011' },
        vServicios: sinServicios()
    },
    {
        id: 10, carnetAsegurado: '880412SFV', carnetBeneficiario: '550210FVA',
        apellidoPaterno: 'FLORES', apellidoMaterno: 'VACA', apellidoEsposo: 'DE ROMERO', nombres: 'SANDRA',
        fechaNacimiento: '1988-04-12', edad: 38, sexo: 'F', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'SANTA CRUZ', ocupacion: 'LABORES DE CASA', grado: 'CAPITAN', unidad: 'SERVICIO ACTIVO', fuerza: 'AEREA',
        tipoAsegurado: 'ESPOSA', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'SOPOCACHI', calle: 'AV. ECUADOR', numero: '210' },
        datosFamiliares: { nombreConyuge: 'CAP. LUIS ROMERO A.', personaProxima: 'CAP. LUIS ROMERO A.', parentescoProximo: 'ESPOSO', telefono: '76200022' },
        vServicios: sinServicios()
    },
    {
        id: 11, carnetAsegurado: '810906JMC', carnetBeneficiario: '810906JMC',
        apellidoPaterno: 'MAMANI', apellidoMaterno: 'CHOQUE', nombres: 'JULIO',
        fechaNacimiento: '1981-09-06', edad: 45, sexo: 'M', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'ORURO', ocupacion: 'MILITAR', grado: 'SARGENTO PRIMERO', unidad: 'RI-2 BOLIVAR', fuerza: 'EJERCITO',
        tipoAsegurado: 'ACTIVO', tipoSeguro: 'RIESGO_PROFESIONAL',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'EL ALTO', zona: 'SENKATA', calle: 'C/ 5', numero: '78' },
        datosFamiliares: { nombreConyuge: 'ELENA APAZA DE MAMANI', personaProxima: 'ELENA APAZA DE MAMANI', parentescoProximo: 'ESPOSA', telefono: '70411033' },
        vServicios: sinServicios()
    },
    {
        id: 12, carnetAsegurado: '660725EVL', carnetBeneficiario: '350118VLA',
        apellidoPaterno: 'VARGAS', apellidoMaterno: 'LEON', apellidoEsposo: 'DE CAMPOS', nombres: 'ELENA',
        fechaNacimiento: '1966-07-25', edad: 60, sexo: 'F', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'COCHABAMBA', ocupacion: 'JUBILADA', grado: 'CORONEL', unidad: 'SERVICIO PASIVO', fuerza: 'EJERCITO',
        tipoAsegurado: 'ESPOSA', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'MIRAFLORES', calle: 'C/ DIAZ ROMERO', numero: '320' },
        datosFamiliares: { nombreConyuge: 'CNL. JORGE CAMPOS R.', personaProxima: 'CNL. JORGE CAMPOS R.', parentescoProximo: 'ESPOSO', telefono: '72655044' },
        vServicios: sinServicios()
    },
    {
        id: 13, carnetAsegurado: '970331MTA', carnetBeneficiario: '970331MTA',
        apellidoPaterno: 'TICONA', apellidoMaterno: 'APAZA', nombres: 'MARCO',
        fechaNacimiento: '1997-03-31', edad: 29, sexo: 'M', estadoCivil: 'SOLTERO(A)',
        lugarNacimiento: 'LA PAZ', ocupacion: 'MILITAR', grado: 'CADETE', unidad: 'COLEGIO MILITAR', fuerza: 'EJERCITO',
        tipoAsegurado: 'CADETE_ALUMNO', tipoSeguro: 'RIESGO_PROFESIONAL',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'IRPAVI', calle: 'C/ 3', numero: '15' },
        datosFamiliares: { nombrePadre: 'FELIX TICONA', nombreMadre: 'JUSTINA APAZA', personaProxima: 'FELIX TICONA', parentescoProximo: 'PADRE', telefono: '79355066' },
        vServicios: sinServicios()
    },
    {
        id: 14, carnetAsegurado: '850719CSR', carnetBeneficiario: '480203SRA',
        apellidoPaterno: 'SUAREZ', apellidoMaterno: 'RIVERA', apellidoEsposo: 'DE NAVA', nombres: 'CARLA',
        fechaNacimiento: '1985-07-19', edad: 41, sexo: 'F', estadoCivil: 'CASADO(A)',
        lugarNacimiento: 'TARIJA', ocupacion: 'COMERCIANTE', grado: 'MAYOR', unidad: 'SERVICIO PASIVO', fuerza: 'NAVAL',
        tipoAsegurado: 'ESPOSA', tipoSeguro: 'ENFERMEDAD',
        residencia: { departamento: 'LA PAZ', provincia: 'MURILLO', localidad: 'LA PAZ', zona: 'CALACOTO', calle: 'C/ 21', numero: '99' },
        datosFamiliares: { nombreConyuge: 'MY. RAUL NAVA L.', personaProxima: 'MY. RAUL NAVA L.', parentescoProximo: 'ESPOSO', telefono: '76900077' },
        vServicios: sinServicios()
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMISIONES HOSPITALARIAS
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_ADMISIONES: AdmisionHospitalaria[] = [
    { id: 1, pacienteId: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA', fecha: '2026-06-19', horaSolicitud: '13:58:28', estado: 'INTERNADO', servicio: 'ONCOLOGIA', cama: '12', vServicios: sinServicios(), diagnosticoAdmision: '(SAI) SIN OTRA INDICACION — SINDROME MIELODISPLASICO', medicoInterna: 'VALENCIA CARLO VERONICA ANGELA', clavemedico: 'V1613' },
    { id: 2, pacienteId: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR', fecha: '2026-06-18', horaSolicitud: '21:40:00', estado: 'INTERNADO', servicio: 'MEDICINA INTERNA', cama: '08', vServicios: sinServicios(), diagnosticoAdmision: 'NEUMONIA ADQUIRIDA EN LA COMUNIDAD', medicoInterna: 'TERRAZAS LIMACHI OSCAR', clavemedico: 'T0921' },
    { id: 3, pacienteId: 3, carnetAsegurado: '380915RTV', carnetBeneficiario: '780320MTR', fecha: '2026-06-20', horaSolicitud: '09:15:00', estado: 'INTERNADO', servicio: 'GINECOLOGIA', cama: '21', vServicios: sinServicios(), diagnosticoAdmision: 'MIOMATOSIS UTERINA — PROGRAMADA PARA HISTERECTOMIA', medicoInterna: 'CESPEDES ROMERO LAURA', clavemedico: 'C4410' },
    { id: 4, pacienteId: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM', fecha: '2026-06-17', horaSolicitud: '16:05:00', estado: 'INTERNADO', servicio: 'MEDICINA INTERNA', cama: '05', vServicios: sinServicios(), diagnosticoAdmision: 'DIABETES MELLITUS TIPO 2 DESCOMPENSADA — HTA', medicoInterna: 'TERRAZAS LIMACHI OSCAR', clavemedico: 'T0921' },
    { id: 5, pacienteId: 5, carnetAsegurado: '920304CRV', carnetBeneficiario: '610508MRV', fecha: '2026-06-21', horaSolicitud: '02:30:00', estado: 'INTERNADO', servicio: 'CIRUGIA', cama: '14', vServicios: sinServicios(), diagnosticoAdmision: 'COLECISTITIS AGUDA LITIASICA', medicoInterna: 'NINA QUISPE RICARDO', clavemedico: 'N7733' },
    { id: 6, pacienteId: 6, carnetAsegurado: '581017LFC', carnetBeneficiario: '581017LFC', fecha: '2026-06-16', horaSolicitud: '11:20:00', estado: 'INTERNADO', servicio: 'CARDIOLOGIA', cama: '03', vServicios: sinServicios(), diagnosticoAdmision: 'INSUFICIENCIA CARDIACA CONGESTIVA — FIBRILACION AURICULAR', medicoInterna: 'GUTIERREZ ARANA SANDRA', clavemedico: 'G2255' },
    { id: 7, pacienteId: 7, carnetAsegurado: '970625MCA', carnetBeneficiario: '661130JCA', fecha: '2026-06-21', horaSolicitud: '05:10:00', estado: 'INTERNADO', servicio: 'GINECOLOGIA', cama: '23', vServicios: sinServicios(), diagnosticoAdmision: 'PUERPERA POST CESAREA — EMBARAZO A TERMINO', medicoInterna: 'CESPEDES ROMERO LAURA', clavemedico: 'C4410' },
    { id: 8, pacienteId: 8, carnetAsegurado: '810919JSM', carnetBeneficiario: '810919JSM', fecha: '2026-06-15', horaSolicitud: '19:45:00', estado: 'INTERNADO', servicio: 'TRAUMATOLOGIA', cama: '17', vServicios: sinServicios(), diagnosticoAdmision: 'FRACTURA DIAFISARIA DE FEMUR DERECHO — ACCIDENTE DE TRANSITO', medicoInterna: 'PINTO SALDAÑA MARCELO', clavemedico: 'P5512' }
];

// ─────────────────────────────────────────────────────────────────────────────
// EVOLUCIÓN Y TRATAMIENTO
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_EVOLUCIONES: EvolucionTratamiento[] = [
    {
        id: 1, pacienteId: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA',
        entradas: [
            { id: 1, fecha: '2026-06-19', hora: '14:30', subjetivo: 'Refiere dolor abdominal leve, sin fiebre.', objetivo: 'PA 120/80, FC 72, FR 18, T 36.5°C. Abdomen blando, no doloroso.', analisis: 'Síndrome mielodisplásico en control. Sin signos de infección.', plan: 'Continuar tratamiento. Control de laboratorio en 24h.', tratamiento: 'Omeprazol 20mg VO c/12h. Paracetamol 500mg PRN.', medicoNombre: 'Dra. Valencia Carlo Verónica' },
            { id: 2, fecha: '2026-06-20', hora: '09:00', subjetivo: 'Refiere mejoría del dolor. Buen apetito.', objetivo: 'PA 118/76, FC 70, afebril. Mucosas algo pálidas.', analisis: 'Anemia en estudio, estable hemodinámicamente.', plan: 'Solicitar hemograma de control. Valoración por hematología.', tratamiento: 'Mantener esquema. Ácido fólico 5mg VO/día.', medicoNombre: 'Dra. Valencia Carlo Verónica' }
        ]
    },
    {
        id: 2, pacienteId: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR',
        entradas: [
            { id: 1, fecha: '2026-06-18', hora: '22:00', subjetivo: 'Tos productiva, fiebre y dolor torácico derecho de 3 días.', objetivo: 'T 38.9°C, FC 102, FR 24, SatO2 91%. Crepitantes en base derecha.', analisis: 'Neumonía adquirida en la comunidad, base derecha.', plan: 'Iniciar antibiótico EV, oxígeno por cánula. Rx de tórax.', tratamiento: 'Ceftriaxona 1g EV c/12h. O2 2L/min. Paracetamol 1g EV PRN.', medicoNombre: 'Dr. Terrazas Limachi Oscar' },
            { id: 2, fecha: '2026-06-20', hora: '08:30', subjetivo: 'Disminución de la tos, menos disnea.', objetivo: 'T 37.4°C, FC 84, FR 19, SatO2 95% aire ambiente.', analisis: 'Evolución favorable de NAC. Buena respuesta a antibiótico.', plan: 'Continuar antibiótico, retirar oxígeno. Control radiológico al 5° día.', tratamiento: 'Continuar Ceftriaxona. Suspender O2. Nebulización c/8h.', medicoNombre: 'Dr. Terrazas Limachi Oscar' }
        ]
    },
    {
        id: 4, pacienteId: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM',
        entradas: [
            { id: 1, fecha: '2026-06-17', hora: '16:30', subjetivo: 'Poliuria, polidipsia y visión borrosa de 1 semana.', objetivo: 'PA 160/95, glicemia capilar 412 mg/dl. Deshidratación leve.', analisis: 'Diabetes mellitus 2 descompensada. HTA no controlada.', plan: 'Hidratación, insulinoterapia, control de glicemia c/6h.', tratamiento: 'Sol. Fisiológica 0.9% 1000ml. Insulina cristalina según esquema. Enalapril 10mg VO c/12h.', medicoNombre: 'Dr. Terrazas Limachi Oscar' },
            { id: 2, fecha: '2026-06-19', hora: '10:00', subjetivo: 'Mejor estado general, sin visión borrosa.', objetivo: 'PA 138/85, glicemias entre 150–180 mg/dl.', analisis: 'Mejoría del control metabólico.', plan: 'Iniciar insulina basal y antidiabético oral. Educación diabetológica.', tratamiento: 'Insulina NPH 10 UI SC noche. Metformina 850mg VO c/12h. Enalapril continúa.', medicoNombre: 'Dr. Terrazas Limachi Oscar' }
        ]
    },
    {
        id: 8, pacienteId: 8, carnetAsegurado: '810919JSM', carnetBeneficiario: '810919JSM',
        entradas: [
            { id: 1, fecha: '2026-06-15', hora: '20:30', subjetivo: 'Dolor intenso en muslo derecho tras accidente de tránsito.', objetivo: 'Deformidad y acortamiento de MID. Pulsos distales presentes.', analisis: 'Fractura diafisaria de fémur derecho. Riesgo profesional.', plan: 'Inmovilización, analgesia, programar osteosíntesis.', tratamiento: 'Tracción de partes blandas. Ketorolaco 30mg EV c/8h. Profilaxis ATB.', medicoNombre: 'Dr. Pinto Saldaña Marcelo' }
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXÁMENES COMPLEMENTARIOS
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_EXAMENES: ExamenComplementario[] = [
    {
        id: 1, pacienteId: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA',
        entradas: [
            { id: 1, fecha: '2026-06-19', hora: '15:00', tipo: 'TEXTO', descripcion: 'Hemograma: Leucocitos 4500, Hb 10.2 g/dl, Plaquetas 95000. Frotis: blastos 5%.' },
            { id: 2, fecha: '2026-06-20', hora: '11:30', tipo: 'TEXTO', descripcion: 'Química: Glucosa 96, Creatinina 0.9, Urea 32. Ferritina elevada.' }
        ]
    },
    {
        id: 2, pacienteId: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR',
        entradas: [
            { id: 1, fecha: '2026-06-18', hora: '23:10', tipo: 'TEXTO', descripcion: 'Rx tórax PA: infiltrado alveolar en lóbulo inferior derecho. Senos libres.' },
            { id: 2, fecha: '2026-06-19', hora: '07:00', tipo: 'TEXTO', descripcion: 'Hemograma: Leucocitos 15200 (neutrofilia), PCR 96 mg/L. Compatible con proceso infeccioso.' }
        ]
    },
    {
        id: 3, pacienteId: 3, carnetAsegurado: '380915RTV', carnetBeneficiario: '780320MTR',
        entradas: [
            { id: 1, fecha: '2026-06-20', hora: '10:40', tipo: 'TEXTO', descripcion: 'Ecografía pélvica: útero aumentado de tamaño con miomas intramurales (mayor de 6 cm). Ovarios normales.' },
            { id: 2, fecha: '2026-06-20', hora: '12:00', tipo: 'TEXTO', descripcion: 'Pre-quirúrgicos: Hb 11.8, Grupo O Rh+, TP/TTPa normales. Apta para cirugía.' }
        ]
    },
    {
        id: 4, pacienteId: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM',
        entradas: [
            { id: 1, fecha: '2026-06-17', hora: '17:00', tipo: 'TEXTO', descripcion: 'Glicemia 412 mg/dl, HbA1c 11.2%, cetonas urinarias negativas.' },
            { id: 2, fecha: '2026-06-18', hora: '08:00', tipo: 'TEXTO', descripcion: 'Función renal: Creatinina 1.3, microalbuminuria positiva. Perfil lipídico alterado.' }
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// NOTAS DIARIAS DE ENFERMERÍA
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_NOTAS: NotaDiariaEnfermeria[] = [
    {
        id: 1, pacienteId: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA',
        vServicios: sinServicios(), establecimiento: 'HOSPITAL MILITAR CENTRAL', servicioSala: 'ONCOLOGIA', cama: '12',
        entradas: [
            { id: 1, fecha: '19/06/2026', hora: '14:00', procedente: 'EMERGENCIA', descripcionSintomas: 'Ingresa consciente, orientada. Refiere debilidad generalizada. Se canaliza vía periférica en MSI.', enfermeraNombre: 'Lic. Silva Quispe Jacquelin' },
            { id: 2, fecha: '19/06/2026', hora: '20:00', procedente: 'ONCOLOGIA', descripcionSintomas: 'Estable, tolera vía oral. Se administra medicación indicada. Diuresis presente.', enfermeraNombre: 'Lic. Mamani Flores Patricia' }
        ]
    },
    {
        id: 2, pacienteId: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR',
        vServicios: sinServicios(), establecimiento: 'HOSPITAL MILITAR CENTRAL', servicioSala: 'MEDICINA INTERNA', cama: '08',
        entradas: [
            { id: 1, fecha: '18/06/2026', hora: '22:15', procedente: 'EMERGENCIA', descripcionSintomas: 'Paciente febril (38.9°C), disneico. Se administra oxígeno 2L/min por cánula y antitérmico. Se inicia antibiótico EV.', enfermeraNombre: 'Lic. Silva Quispe Jacquelin' },
            { id: 2, fecha: '19/06/2026', hora: '06:30', procedente: 'MEDICINA INTERNA', descripcionSintomas: 'Pasó la noche con periodos de tos. Saturación 93% con O2. Tolera dieta blanda.', enfermeraNombre: 'Lic. Vargas Rojas Elena' },
            { id: 3, fecha: '20/06/2026', hora: '08:00', procedente: 'MEDICINA INTERNA', descripcionSintomas: 'Afebril. Retira oxígeno, satura 95% al ambiente. Nebulizaciones cumplidas.', enfermeraNombre: 'Lic. Mamani Flores Patricia' }
        ]
    },
    {
        id: 4, pacienteId: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM',
        vServicios: sinServicios(), establecimiento: 'HOSPITAL MILITAR CENTRAL', servicioSala: 'MEDICINA INTERNA', cama: '05',
        entradas: [
            { id: 1, fecha: '17/06/2026', hora: '16:30', procedente: 'EMERGENCIA', descripcionSintomas: 'Ingresa por descompensación diabética. Glicemia capilar 412. Se inicia hidratación e insulina según esquema.', enfermeraNombre: 'Lic. Silva Quispe Jacquelin' },
            { id: 2, fecha: '18/06/2026', hora: '12:00', procedente: 'MEDICINA INTERNA', descripcionSintomas: 'Controles de glicemia c/6h. Cifras en descenso (180). Buena tolerancia oral.', enfermeraNombre: 'Lic. Vargas Rojas Elena' }
        ]
    },
    {
        id: 5, pacienteId: 5, carnetAsegurado: '920304CRV', carnetBeneficiario: '610508MRV',
        vServicios: sinServicios(), establecimiento: 'HOSPITAL MILITAR CENTRAL', servicioSala: 'CIRUGIA', cama: '14',
        entradas: [
            { id: 1, fecha: '21/06/2026', hora: '03:00', procedente: 'EMERGENCIA', descripcionSintomas: 'Ingresa por dolor en hipocondrio derecho. NPO. Se prepara para colecistectomía laparoscópica.', enfermeraNombre: 'Lic. Mamani Flores Patricia' },
            { id: 2, fecha: '21/06/2026', hora: '16:00', procedente: 'CIRUGIA', descripcionSintomas: 'Post-operada inmediata. Herida limpia y seca. Drenaje sin débito. Maneja dolor con analgesia EV.', enfermeraNombre: 'Lic. Vargas Rojas Elena' }
        ]
    },
    {
        id: 7, pacienteId: 7, carnetAsegurado: '970625MCA', carnetBeneficiario: '661130JCA',
        vServicios: sinServicios(), establecimiento: 'HOSPITAL MILITAR CENTRAL', servicioSala: 'GINECOLOGIA', cama: '23',
        entradas: [
            { id: 1, fecha: '21/06/2026', hora: '08:00', procedente: 'QUIROFANO', descripcionSintomas: 'Puérpera post cesárea. Útero contraído, loquios hemáticos normales. Recién nacido con su madre. Inicia lactancia.', enfermeraNombre: 'Lic. Silva Quispe Jacquelin' }
        ]
    },
    {
        id: 8, pacienteId: 8, carnetAsegurado: '810919JSM', carnetBeneficiario: '810919JSM',
        vServicios: sinServicios(), establecimiento: 'HOSPITAL MILITAR CENTRAL', servicioSala: 'TRAUMATOLOGIA', cama: '17',
        entradas: [
            { id: 1, fecha: '15/06/2026', hora: '20:00', procedente: 'EMERGENCIA', descripcionSintomas: 'Ingresa por accidente de tránsito. MID inmovilizado con tracción. Dolor controlado con analgesia EV. Pulsos distales presentes.', enfermeraNombre: 'Lic. Mamani Flores Patricia' },
            { id: 2, fecha: '16/06/2026', hora: '09:00', procedente: 'TRAUMATOLOGIA', descripcionSintomas: 'Pendiente cirugía de osteosíntesis. Se cumple profilaxis antibiótica. Buen estado general.', enfermeraNombre: 'Lic. Vargas Rojas Elena' }
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE MEDICAMENTOS
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_MEDICAMENTOS: RegistroMedicamentos[] = [
    {
        id: 1, pacienteId: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA',
        vServicios: sinServicios(), servicio: 'ONCOLOGIA', unidad: 'HOSPITAL MILITAR CENTRAL', peso: 65, cama: '12',
        medicamentos: [
            { id: 1, nombre: 'Omeprazol', via: 'VO', dosis: '20mg c/12h', administraciones: [ { fecha: '2026-06-19', hora: '08:00', aplicado: true }, { fecha: '2026-06-19', hora: '20:00', aplicado: true }, { fecha: '2026-06-20', hora: '08:00', aplicado: true }, { fecha: '2026-06-20', hora: '20:00', aplicado: false } ] },
            { id: 2, nombre: 'Paracetamol', via: 'VO', dosis: '500mg PRN', administraciones: [ { fecha: '2026-06-19', hora: '14:00', aplicado: true }, { fecha: '2026-06-20', hora: '10:00', aplicado: false } ] },
            { id: 3, nombre: 'Ácido Fólico', via: 'VO', dosis: '5mg c/24h', administraciones: [ { fecha: '2026-06-20', hora: '08:00', aplicado: true } ] }
        ]
    },
    {
        id: 2, pacienteId: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR',
        vServicios: sinServicios(), servicio: 'MEDICINA INTERNA', unidad: 'HOSPITAL MILITAR CENTRAL', peso: 78, cama: '08',
        medicamentos: [
            { id: 1, nombre: 'Ceftriaxona', via: 'EV', dosis: '1g c/12h', administraciones: [ { fecha: '2026-06-18', hora: '22:00', aplicado: true }, { fecha: '2026-06-19', hora: '10:00', aplicado: true }, { fecha: '2026-06-19', hora: '22:00', aplicado: true }, { fecha: '2026-06-20', hora: '10:00', aplicado: true } ] },
            { id: 2, nombre: 'Paracetamol', via: 'EV', dosis: '1g PRN fiebre', administraciones: [ { fecha: '2026-06-18', hora: '22:10', aplicado: true }, { fecha: '2026-06-19', hora: '04:00', aplicado: true } ] },
            { id: 3, nombre: 'Salbutamol (nebulización)', via: 'INH', dosis: 'c/8h', administraciones: [ { fecha: '2026-06-19', hora: '08:00', aplicado: true }, { fecha: '2026-06-19', hora: '16:00', aplicado: true }, { fecha: '2026-06-20', hora: '08:00', aplicado: false } ] }
        ]
    },
    {
        id: 4, pacienteId: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM',
        vServicios: sinServicios(), servicio: 'MEDICINA INTERNA', unidad: 'HOSPITAL MILITAR CENTRAL', peso: 82, cama: '05',
        medicamentos: [
            { id: 1, nombre: 'Insulina cristalina', via: 'SC', dosis: 'según esquema c/6h', administraciones: [ { fecha: '2026-06-17', hora: '18:00', aplicado: true }, { fecha: '2026-06-18', hora: '00:00', aplicado: true }, { fecha: '2026-06-18', hora: '06:00', aplicado: true }, { fecha: '2026-06-18', hora: '12:00', aplicado: true } ] },
            { id: 2, nombre: 'Insulina NPH', via: 'SC', dosis: '10 UI noche', administraciones: [ { fecha: '2026-06-19', hora: '22:00', aplicado: true } ] },
            { id: 3, nombre: 'Metformina', via: 'VO', dosis: '850mg c/12h', administraciones: [ { fecha: '2026-06-19', hora: '08:00', aplicado: true }, { fecha: '2026-06-19', hora: '20:00', aplicado: false } ] },
            { id: 4, nombre: 'Enalapril', via: 'VO', dosis: '10mg c/12h', administraciones: [ { fecha: '2026-06-17', hora: '18:00', aplicado: true }, { fecha: '2026-06-18', hora: '06:00', aplicado: true } ] }
        ]
    },
    {
        id: 5, pacienteId: 5, carnetAsegurado: '920304CRV', carnetBeneficiario: '610508MRV',
        vServicios: sinServicios(), servicio: 'CIRUGIA', unidad: 'HOSPITAL MILITAR CENTRAL', peso: 60, cama: '14',
        medicamentos: [
            { id: 1, nombre: 'Ketorolaco', via: 'EV', dosis: '30mg c/8h', administraciones: [ { fecha: '2026-06-21', hora: '14:00', aplicado: true }, { fecha: '2026-06-21', hora: '22:00', aplicado: true } ] },
            { id: 2, nombre: 'Ceftriaxona', via: 'EV', dosis: '1g c/24h', administraciones: [ { fecha: '2026-06-21', hora: '14:00', aplicado: true } ] },
            { id: 3, nombre: 'Metoclopramida', via: 'EV', dosis: '10mg PRN náusea', administraciones: [ { fecha: '2026-06-21', hora: '16:30', aplicado: true } ] }
        ]
    },
    {
        id: 6, pacienteId: 6, carnetAsegurado: '581017LFC', carnetBeneficiario: '581017LFC',
        vServicios: sinServicios(), servicio: 'CARDIOLOGIA', unidad: 'HOSPITAL MILITAR CENTRAL', peso: 74, cama: '03',
        medicamentos: [
            { id: 1, nombre: 'Furosemida', via: 'EV', dosis: '40mg c/12h', administraciones: [ { fecha: '2026-06-16', hora: '12:00', aplicado: true }, { fecha: '2026-06-17', hora: '00:00', aplicado: true }, { fecha: '2026-06-17', hora: '12:00', aplicado: true } ] },
            { id: 2, nombre: 'Digoxina', via: 'VO', dosis: '0.25mg c/24h', administraciones: [ { fecha: '2026-06-16', hora: '08:00', aplicado: true }, { fecha: '2026-06-17', hora: '08:00', aplicado: true } ] },
            { id: 3, nombre: 'Warfarina', via: 'VO', dosis: '5mg c/24h', administraciones: [ { fecha: '2026-06-16', hora: '18:00', aplicado: true }, { fecha: '2026-06-17', hora: '18:00', aplicado: false } ] }
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// CUADRO DE SIGNOS VITALES
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_SIGNOS_VITALES: CuadroSignosVitales[] = [
    {
        id: 1, pacienteId: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA',
        vServicios: sinServicios(), servicio: 'ONCOLOGIA', sala: 'A', cama: '12', numeroHCE: 'HCE-2026-001', fechaIngreso: '2026-06-19',
        dias: [
            { fecha: '2026-06-19', turnos: { manana: { respiracion: 20, pulso: 78, temperatura: 36.5 }, tarde: { respiracion: 18, pulso: 82, temperatura: 36.8 }, noche: { respiracion: 19, pulso: 75, temperatura: 36.4 } }, peso: 65, dieta: 'BLANDA', presionArterial: '120/80', orina: 'PRESENTE', evacuaciones: 'PRESENTE', vomitos: 'NO', observaciones: 'Paciente estable' },
            { fecha: '2026-06-20', turnos: { manana: { respiracion: 19, pulso: 76, temperatura: 36.6 }, tarde: { respiracion: 20, pulso: 80, temperatura: 37.1 }, noche: { respiracion: 18, pulso: 74, temperatura: 36.3 } }, peso: 65, dieta: 'BLANDA', presionArterial: '118/78', orina: 'PRESENTE', evacuaciones: 'PRESENTE', vomitos: 'NO' },
            { fecha: '2026-06-21', turnos: { manana: { respiracion: 22, pulso: 88, temperatura: 37.8 }, tarde: { respiracion: 24, pulso: 92, temperatura: 38.2 }, noche: { respiracion: 20, pulso: 84, temperatura: 37.5 } }, peso: 64.5, dieta: 'LIQUIDA', presionArterial: '110/70', orina: 'ESCASA', evacuaciones: 'AUSENTE', vomitos: 'SI - 1 VEZ', observaciones: 'Pico febril vespertino, se administra antipirético' }
        ]
    },
    {
        id: 2, pacienteId: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR',
        vServicios: sinServicios(), servicio: 'MEDICINA INTERNA', sala: 'B', cama: '08', numeroHCE: 'HCE-2026-014', fechaIngreso: '2026-06-18',
        dias: [
            { fecha: '2026-06-18', turnos: { manana: {}, tarde: {}, noche: { respiracion: 24, pulso: 102, temperatura: 38.9 } }, peso: 78, dieta: 'BLANDA', presionArterial: '130/85', orina: 'PRESENTE', evacuaciones: 'PRESENTE', vomitos: 'NO', observaciones: 'Ingreso febril, disneico' },
            { fecha: '2026-06-19', turnos: { manana: { respiracion: 22, pulso: 96, temperatura: 38.1 }, tarde: { respiracion: 21, pulso: 90, temperatura: 37.6 }, noche: { respiracion: 20, pulso: 88, temperatura: 37.5 } }, peso: 78, dieta: 'BLANDA', presionArterial: '125/80', orina: 'PRESENTE', evacuaciones: 'PRESENTE', vomitos: 'NO' },
            { fecha: '2026-06-20', turnos: { manana: { respiracion: 19, pulso: 84, temperatura: 37.4 }, tarde: { respiracion: 18, pulso: 80, temperatura: 37.0 }, noche: { respiracion: 18, pulso: 78, temperatura: 36.8 } }, peso: 77.5, dieta: 'COMPLETA', presionArterial: '120/78', orina: 'PRESENTE', evacuaciones: 'PRESENTE', vomitos: 'NO', observaciones: 'Afebril, mejor patrón respiratorio' }
        ]
    },
    {
        id: 4, pacienteId: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM',
        vServicios: sinServicios(), servicio: 'MEDICINA INTERNA', sala: 'B', cama: '05', numeroHCE: 'HCE-2026-009', fechaIngreso: '2026-06-17',
        dias: [
            { fecha: '2026-06-17', turnos: { manana: {}, tarde: { respiracion: 20, pulso: 96, temperatura: 36.7 }, noche: { respiracion: 19, pulso: 90, temperatura: 36.6 } }, peso: 82, dieta: 'DIABETICA', presionArterial: '160/95', orina: 'AUMENTADA', evacuaciones: 'PRESENTE', vomitos: 'NO', observaciones: 'Glicemia 412 al ingreso' },
            { fecha: '2026-06-18', turnos: { manana: { respiracion: 18, pulso: 84, temperatura: 36.5 }, tarde: { respiracion: 18, pulso: 82, temperatura: 36.6 }, noche: { respiracion: 17, pulso: 80, temperatura: 36.4 } }, peso: 82, dieta: 'DIABETICA', presionArterial: '140/88', orina: 'PRESENTE', evacuaciones: 'PRESENTE', vomitos: 'NO' },
            { fecha: '2026-06-19', turnos: { manana: { respiracion: 18, pulso: 78, temperatura: 36.5 }, tarde: { respiracion: 18, pulso: 80, temperatura: 36.7 }, noche: {} }, peso: 81.5, dieta: 'DIABETICA', presionArterial: '135/85', orina: 'PRESENTE', evacuaciones: 'PRESENTE', vomitos: 'NO', observaciones: 'Glicemias 150–180, mejor control' }
        ]
    },
    {
        id: 5, pacienteId: 5, carnetAsegurado: '920304CRV', carnetBeneficiario: '610508MRV',
        vServicios: sinServicios(), servicio: 'CIRUGIA', sala: 'C', cama: '14', numeroHCE: 'HCE-2026-021', fechaIngreso: '2026-06-21',
        dias: [
            { fecha: '2026-06-21', turnos: { manana: { respiracion: 18, pulso: 88, temperatura: 36.8 }, tarde: { respiracion: 20, pulso: 92, temperatura: 37.2 }, noche: { respiracion: 18, pulso: 84, temperatura: 36.9 } }, peso: 60, dieta: 'NPO / LIQUIDA', presionArterial: '118/76', orina: 'PRESENTE (SONDA)', evacuaciones: 'AUSENTE', vomitos: 'NO', observaciones: 'Post-operada colecistectomía laparoscópica' }
        ]
    },
    {
        id: 6, pacienteId: 6, carnetAsegurado: '581017LFC', carnetBeneficiario: '581017LFC',
        vServicios: sinServicios(), servicio: 'CARDIOLOGIA', sala: 'A', cama: '03', numeroHCE: 'HCE-2026-006', fechaIngreso: '2026-06-16',
        dias: [
            { fecha: '2026-06-16', turnos: { manana: { respiracion: 24, pulso: 110, temperatura: 36.4 }, tarde: { respiracion: 22, pulso: 104, temperatura: 36.5 }, noche: { respiracion: 22, pulso: 100, temperatura: 36.6 } }, peso: 74, dieta: 'HIPOSODICA', presionArterial: '150/95', orina: 'ESCASA', evacuaciones: 'PRESENTE', vomitos: 'NO', observaciones: 'FA con respuesta ventricular rápida' },
            { fecha: '2026-06-17', turnos: { manana: { respiracion: 20, pulso: 92, temperatura: 36.5 }, tarde: { respiracion: 19, pulso: 88, temperatura: 36.6 }, noche: { respiracion: 18, pulso: 84, temperatura: 36.5 } }, peso: 72.5, dieta: 'HIPOSODICA', presionArterial: '135/85', orina: 'AUMENTADA', evacuaciones: 'PRESENTE', vomitos: 'NO', observaciones: 'Mejor respuesta tras diurético, baja de peso por diuresis' }
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// INFORME ESTADÍSTICO (ingreso)
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_ESTADISTICOS: InformeEstadistico[] = [
    {
        id: 2, pacienteId: 2, carnetAsegurado: '420512JCR', carnetBeneficiario: '420512JCR',
        establecimiento: 'HOSPITAL MILITAR CENTRAL', localidad: 'LA PAZ', esNuevo: true,
        ingreso: { tipoPrestacion: 'ENFERMEDAD COMUN', unidadSanitariaOrigen: 'POLICONSULTORIO MIRAFLORES', fechaIngreso: '2026-06-18', horaIngreso: '21:40', sala: 'B', cama: '08', diagnosticoPresuntivo: 'NEUMONIA ADQUIRIDA EN LA COMUNIDAD', codigoDiagnostico: 'J18.9', tipoAdmision: 'EMERGENCIA', medicoSolicita: 'TERRAZAS LIMACHI OSCAR', claveMedico: 'T0921' }
    },
    {
        id: 4, pacienteId: 4, carnetAsegurado: '651122PCM', carnetBeneficiario: '651122PCM',
        establecimiento: 'HOSPITAL MILITAR CENTRAL', localidad: 'LA PAZ', esNuevo: false,
        ingreso: { tipoPrestacion: 'ENFERMEDAD COMUN', unidadSanitariaOrigen: 'EMERGENCIAS HMC', fechaIngreso: '2026-06-17', horaIngreso: '16:05', sala: 'B', cama: '05', diagnosticoPresuntivo: 'DIABETES MELLITUS 2 DESCOMPENSADA', codigoDiagnostico: 'E11.6', tipoAdmision: 'EMERGENCIA', medicoSolicita: 'TERRAZAS LIMACHI OSCAR', claveMedico: 'T0921' }
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSENTIMIENTO INFORMADO
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_CONSENTIMIENTOS: ConsentimientoInformado[] = [
    {
        id: 3, pacienteId: 3, carnetAsegurado: '380915RTV', carnetBeneficiario: '780320MTR',
        fecha: '2026-06-20', hora: '14:30', vServicios: sinServicios(),
        firmante: { nombre: 'ROSA ELENA MARTINEZ TORREZ', ci: '2654893 OR', tipo: 'PACIENTE' }
    },
    {
        id: 5, pacienteId: 5, carnetAsegurado: '920304CRV', carnetBeneficiario: '610508MRV',
        fecha: '2026-06-21', hora: '03:20', vServicios: sinServicios(),
        firmante: { nombre: 'MARIO TERAN LOPEZ', ci: '4789122 SC', tipo: 'FAMILIAR' }
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTA EXTERNA — Cola/turnos del día (Formulario 002)
// Reutiliza los pacientes del seed; estados variados para mostrar el flujo.
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_CONSULTAS_EXTERNAS: ConsultaExterna[] = [
    {
        id: 1, pacienteId: 2, carnetAsegurado: '420512JCR',
        fecha: HOY, numeroTurno: 'CE-001', especialidad: 'MEDICINA INTERNA', medico: 'TERRAZAS LIMACHI OSCAR',
        motivoConsulta: 'Control de presión arterial y cefalea ocasional.',
        estado: 'EN_ESPERA', prioridad: 'NORMAL', horaRecepcion: '07:45'
    },
    {
        id: 2, pacienteId: 1, carnetAsegurado: '510813MCR', carnetBeneficiario: '536220PLA',
        fecha: HOY, numeroTurno: 'CE-002', especialidad: 'CARDIOLOGIA', medico: 'GUTIERREZ ARANA SANDRA',
        motivoConsulta: 'Palpitaciones y disnea de esfuerzo.',
        estado: 'EN_ESPERA', prioridad: 'PREFERENCIAL', horaRecepcion: '07:52'
    },
    {
        id: 3, pacienteId: 5, carnetAsegurado: '920304CRV', carnetBeneficiario: '610508MRV',
        fecha: HOY, numeroTurno: 'CE-003', especialidad: 'GINECOLOGIA', medico: 'CESPEDES ROMERO LAURA',
        motivoConsulta: 'Control ginecológico de rutina.',
        estado: 'EN_PREPARACION', prioridad: 'NORMAL', horaRecepcion: '08:05',
        constantes: { peso: 62, talla: 160 }
    },
    {
        id: 4, pacienteId: 8, carnetAsegurado: '810919JSM',
        fecha: HOY, numeroTurno: 'CE-004', especialidad: 'TRAUMATOLOGIA', medico: 'PINTO SALDAÑA MARCELO',
        motivoConsulta: 'Dolor lumbar mecánico de 2 semanas.',
        estado: 'LISTO_MEDICO', prioridad: 'NORMAL', horaRecepcion: '08:10', horaConstantes: '08:20',
        enfermeraNombre: 'Lic. Jacquelin Silva Quispe',
        alergias: 'Ninguna conocida',
        constantes: { paSistolica: 128, paDiastolica: 82, fc: 76, fr: 18, temperatura: 36.6, saturacion: 97, peso: 84, talla: 178, imc: 26.5 }
    },
    {
        id: 5, pacienteId: 6, carnetAsegurado: '581017LFC',
        fecha: HOY, numeroTurno: 'CE-005', especialidad: 'ENDOCRINOLOGIA', medico: 'TERRAZAS LIMACHI OSCAR',
        motivoConsulta: 'Control de diabetes — ajuste de insulina.',
        estado: 'ATENDIDO', prioridad: 'PREFERENCIAL', horaRecepcion: '07:30', horaConstantes: '07:40',
        enfermeraNombre: 'Lic. Jacquelin Silva Quispe',
        alergias: 'Penicilina',
        constantes: { paSistolica: 140, paDiastolica: 88, fc: 80, fr: 18, temperatura: 36.4, saturacion: 95, peso: 78, talla: 170, imc: 27.0, glucemia: 186 }
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// CAMAS — PISO 1 · CIRUGÍA (mapa de camas simulado)
// 12 camas: ocupadas con pacientes quirúrgicos (día post-op), libres y limpieza.
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_CAMAS: Cama[] = [
    { id: 1, pisoNumero: 1, codigo: 'C-101', estado: 'OCUPADA', pacienteId: 9, procedimiento: 'Colecistectomía laparoscópica', diaPostOp: 1 },
    { id: 2, pisoNumero: 1, codigo: 'C-102', estado: 'OCUPADA', pacienteId: 5, procedimiento: 'Colecistectomía abierta (colecistitis aguda)', diaPostOp: 1 },
    { id: 3, pisoNumero: 1, codigo: 'C-103', estado: 'OCUPADA', pacienteId: 10, procedimiento: 'Apendicectomía', diaPostOp: 2 },
    { id: 4, pisoNumero: 1, codigo: 'C-104', estado: 'LIBRE' },
    { id: 5, pisoNumero: 1, codigo: 'C-105', estado: 'OCUPADA', pacienteId: 11, procedimiento: 'Hernioplastía inguinal derecha', diaPostOp: 1 },
    { id: 6, pisoNumero: 1, codigo: 'C-106', estado: 'OCUPADA', pacienteId: 12, procedimiento: 'Hemicolectomía derecha', diaPostOp: 3 },
    { id: 7, pisoNumero: 1, codigo: 'C-107', estado: 'LIMPIEZA' },
    { id: 8, pisoNumero: 1, codigo: 'C-108', estado: 'OCUPADA', pacienteId: 13, procedimiento: 'Apendicectomía complicada (peritonitis)', diaPostOp: 4 },
    { id: 9, pisoNumero: 1, codigo: 'C-109', estado: 'OCUPADA', pacienteId: 14, procedimiento: 'Colecistectomía programada', diaPostOp: 0, preOp: true, observacion: 'En ayuno — cirugía hoy 14:00' },
    { id: 10, pisoNumero: 1, codigo: 'C-110', estado: 'LIBRE' },
    { id: 11, pisoNumero: 1, codigo: 'C-111', estado: 'OCUPADA', pacienteId: 8, procedimiento: 'Osteosíntesis de fémur (post-traumática)', diaPostOp: 5 },
    { id: 12, pisoNumero: 1, codigo: 'C-112', estado: 'RESERVADA', reservaNota: 'Ingreso programado 16:00 — hernioplastía' },

    // ── PISO 2 · MEDICINA INTERNA (para demostrar traslados entre sectores) ──
    { id: 13, pisoNumero: 2, codigo: 'C-201', estado: 'OCUPADA', pacienteId: 2, procedimiento: 'Neumonía adquirida en la comunidad (NAC)' },
    { id: 14, pisoNumero: 2, codigo: 'C-202', estado: 'OCUPADA', pacienteId: 4, procedimiento: 'Diabetes mellitus 2 descompensada', observacion: 'Control glucémico c/6h' },
    { id: 15, pisoNumero: 2, codigo: 'C-203', estado: 'LIBRE' },
    { id: 16, pisoNumero: 2, codigo: 'C-204', estado: 'RESERVADA', reservaNota: 'Reservada — traslado desde Emergencias' },
    { id: 17, pisoNumero: 2, codigo: 'C-205', estado: 'LIBRE' },
    { id: 18, pisoNumero: 2, codigo: 'C-206', estado: 'LIMPIEZA' },
    { id: 19, pisoNumero: 2, codigo: 'C-207', estado: 'LIBRE' },
    { id: 20, pisoNumero: 2, codigo: 'C-208', estado: 'LIBRE' }
];
