# Módulo de Enfermería e Internación

Sistema web para el registro clínico de pacientes internados: signos vitales, notas de enfermería, administración de medicamentos, evolución médica y admisión.

Dos roles trabajan sobre el mismo paciente con vistas y permisos distintos — **enfermería** llena las hojas de piso, **médico** registra evolución, exámenes y consentimientos.

![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG_21-DD0031?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## El problema

La hoja de piso de un paciente internado se llena en papel y se archiva en una carpeta física. Cuando el médico pasa visita necesita ver qué registró enfermería en el turno anterior, y a menudo esa hoja está en otro lado.

Este módulo pone el registro en una sola vista por paciente, donde cada hoja queda asociada al paciente activo y visible para ambos roles según lo que a cada uno le corresponde.

---

## Funcionalidad

**Enfermería**
- Signos vitales
- Notas diarias de turno
- Administración de medicamentos

**Médico**
- Admisión del paciente
- Evolución clínica
- Solicitud de exámenes
- Consentimiento informado
- Reporte estadístico

**Transversal**
- Lista de pacientes internados como punto de entrada
- Historia clínica y archivos adjuntos

---

## Arquitectura

```
src/app/
├── core/
│   ├── guards/auth.guard.ts           # protege rutas y valida rol
│   ├── interceptors/auth.interceptor.ts  # inyecta el JWT en cada request
│   ├── models/                        # paciente, historia-clinica, evolucion,
│   │                                  # enfermeria, user, auth-response
│   └── services/                      # un servicio por dominio +
│                                      # paciente-activo.service (paciente en foco)
├── features/
│   ├── doctor/                        # admisión, evolución, exámenes,
│   │                                  # consentimiento, estadístico
│   └── enfermeria/                    # signos vitales, notas diarias, medicamentos
└── layout/                            # shell administrativo
```

Separación en tres capas: `core` (lo transversal), `features` (dominio por rol), `layout` (chrome de la aplicación).

---

## Decisiones técnicas

**Rutas cerradas por rol, no solo por sesión.** El guard no pregunta únicamente si hay token: cada rama declara qué rol la puede abrir.

```ts
{
  path: 'doctor',
  canActivate: [AuthGuard],
  data: { roles: ['DOCTOR'] },
  loadChildren: () => import('./features/doctor/doctor.routes')...
}
```

Un usuario de enfermería no carga siquiera el bundle del área médica. Al entrar a `/app`, un componente `RoleHome` redirige a cada quien a su inicio según su rol.

**Doble ruta por hoja clínica.** Cada formulario se registra dos veces — con `:pacienteId` y sin él:

```ts
...forms.flatMap((f) => [
  { path: f.path,                 loadComponent: f.load },
  { path: `${f.path}/:pacienteId`, loadComponent: f.load }
])
```

Así la misma pantalla sirve para un deep-link desde la lista de pacientes y para abrirse con el paciente activo desde el menú lateral, sin duplicar componentes. El paciente en foco lo mantiene `paciente-activo.service`.

**Zoneless change detection.** La aplicación corre con `provideZonelessChangeDetection()`, sin Zone.js — menos overhead y un ciclo de detección explícito.

**Backend intercambiable.** `MockBackendInterceptor` sirve toda la data desde mocks cuando `environment.useMocks` está activo, así el frontend se desarrolla y demuestra sin depender del API. Cambiar a la API real es cambiar una bandera.

> Este repositorio contiene únicamente el frontend, y corre sobre datos ficticios. No incluye información de pacientes reales.

---

## Correr el proyecto

```bash
npm install
npm start          # http://localhost:4200
npm run build      # build de producción
```

La API se configura en `src/environments/environment.ts` (`apiUrl`). Con `useMocks: true` no hace falta backend.

---

## Stack

`Angular 21` · `TypeScript` · `PrimeNG 21` · `Tailwind CSS 4` · `RxJS`
Standalone components · lazy loading por ruta · interceptores HTTP · guards por rol

---

**Autor** — [Mauricio Aparicio](https://github.com/astralmau69) · apariciomau3@gmail.com
