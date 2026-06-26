# Handoff — COSSMIL · Módulo de Enfermería de Piso

> Documento de traspaso para continuar el trabajo en otra PC / con otro agente.
> Última actualización: 2026-06-23.

---

## 1. Qué es este proyecto

Módulo de **historia clínica digital para enfermería en hospitalización ("piso")** del
**Hospital Militar Central — COSSMIL (La Paz, Bolivia)**. Es **frontend-only**: no hay
backend real; **todos los datos son mock** (ver §6). Digitaliza los formularios en papel
que se usan en el piso.

**Reparto de roles (definido por el usuario, NO cambiar sin preguntar):**

- **DOCTOR** → en piso solo llena **UNA** hoja: **Resultados Exámenes Complementarios (HC-M-009)**
  ("pide los exámenes y luego registra los resultados").
- **ENFERMERÍA** → llena **todo lo demás**: Signos Vitales, Notas Diarias, Medicamentos,
  Admisión, Estadístico, Consentimiento, Evolución.

Formularios (códigos oficiales reales, se muestran como insignia en cada hoja):
HC-M-002 Admisión · HC-005 Estadístico · HC-M-003 Consentimiento · HC-M-007 Evolución ·
HC-M-009 Exámenes (doctor) · HCE-002 Signos Vitales · HCE-004 Notas Diarias · HCE-006 Medicamentos.

---

## 2. Stack y entorno

- **Angular 21** (standalone components, **zoneless**, signals), **PrimeNG 21** (preset Aura),
  **Tailwind v4**, **GSAP** (animaciones), **chart.js** (gráfico de signos vitales).
- Alias de imports: `@/` → `src/` (ej. `@/app/core/services/...`).
- **SO de desarrollo:** Windows (PowerShell + Git Bash). En otra PC: solo se necesita Node + npm.
- El usuario usa el **puerto 4200 para otro proyecto** → este se levanta en **4300**.

---

## 3. Cómo correr

```bash
npm install
npm start -- --port 4300       # http://localhost:4300
npm run build                  # build de producción (validación de tipos completa)
```

**Login demo (mock, sin HTTP):**
- Doctor: usuario `vvalencia`
- Enfermera: usuario `jsilva`
- Contraseña (ambos): `123456`

---

## 4. Arquitectura

### Rutas (`src/app.routes.ts`)
- `/auth/login` → login con selección de rol + animaciones GSAP.
- `/app` → `AppLayout` + `AuthGuard` (verifica sesión y `route.data.roles`):
  - `/app/doctor/**` → `DOCTOR_ROUTES` (solo Exámenes).
  - `/app/enfermeria/**` → `ENFERMERIA_ROUTES` (el resto).
  - `/app` (vacío) → `pages/role-home.ts` redirige según rol.
- `**` → `notfound`.

Cada hoja tiene **dos rutas**: sin id (`/app/enfermeria/signos-vitales`) y con id
(`/app/enfermeria/signos-vitales/:pacienteId`). La sin-id abre con el **paciente activo**.

### Paciente activo (clave para entender el flujo)
`src/app/core/services/paciente-activo.service.ts` mantiene un signal global del paciente
en contexto (persistido en `localStorage: cossmil_paciente_activo`, por defecto id 1).
- El **topbar** tiene un `p-select` que cambia el paciente activo.
- El **menú lateral** linkea a las rutas **sin id** → abren la hoja para el paciente activo.
- Cada formulario resuelve el paciente así (patrón a respetar al tocar/añadir hojas):

```ts
private routeId = toSignal(
  this.route.paramMap.pipe(map(pm => pm.get('pacienteId') ? +pm.get('pacienteId')! : null)),
  { initialValue: null }
);
private loadedId: number | null = null;
constructor() {
  effect(() => {
    const id = this.routeId() ?? this.activo.pacienteId();
    if (id == null || id === this.loadedId) return;
    this.loadedId = id;
    this.activo.setId(id);
    this.cargar(id);   // carga paciente + datos de la hoja
  });
}
```
(Reemplazó el viejo `ngOnInit` con `route.params.subscribe`. `admision` mantiene `ngOnInit`
solo para fechas por defecto.)

### Menú (`src/app/core/services/menu.service.ts`)
Estático, filtrado por rol vía signal computado (sin API). Links a rutas `/app/...` sin id.

---

## 5. Estructura de carpetas relevante

```
src/
  app.config.ts            # providers + tema PrimeNG (definePreset teal-pino) + interceptores
  app.routes.ts            # rutas raíz
  app/
    core/
      guards/auth.guard.ts          # sesión + roles
      models/                       # paciente, historia-clinica, evolucion, enfermeria, user...
      services/
        auth.service.ts
        paciente.service.ts / paciente-activo.service.ts
        evolucion.service.ts / enfermeria.service.ts / historia-clinica.service.ts
        menu.service.ts
    features/
      doctor/        # examenes (del doctor) + admision/estadistico/consentimiento/evolucion
                     #   (estas 4 viven aquí pero se RUTEAN desde enfermería) + paciente-lista (hub)
      enfermeria/    # signos-vitales, notas-diarias, medicamentos (+ rutas a las de doctor)
    layout/          # app.layout, app.topbar (selector paciente), app.sidebar, app.menu, layout.service
    mock-backend/    # ⭐ capa mock (ver §6)
    pages/
      auth/login.ts  # login con GSAP + selección de rol
      role-home.ts   # redirección por rol
      notfound/
    shared/
      components/
        form-header/   # ⭐ encabezado firma (emblema + código + línea ECG)
        paciente-header/ paciente-search/ servicios-checkbox/
      directives/reveal.directive.ts   # [appReveal] stagger GSAP
      index.ts                          # barrel de shared
  assets/
    styles.scss          # importa layout + _app-polish
    _app-polish.scss     # ⭐ identidad visual global (fuentes, paleta, diálogos, campos)
HANDOFF.md  (este archivo)
```

---

## 6. Mock-backend (cómo funciona "casi real")

Carpeta **`src/app/mock-backend/`**:
- `seed.ts` — datos iniciales. **8 pacientes** con cuadros clínicos coherentes.
- `mock-db.ts` — "base de datos" en memoria + **persistencia en `localStorage`**
  (key **`cossmil_mock_db_v5`**). Incluye **get-or-create**: si un paciente no tiene una
  hoja, la crea vacía al vuelo (todos los pacientes son usables). `upsertByPaciente` para
  hojas de 1-por-paciente. `resetDb()` reinicia desde el seed.
- `mock-backend.interceptor.ts` — intercepta `/api/...` (GET/POST/PUT/DELETE) y responde
  desde la DB con latencia simulada. Firma notas/evolución con el nombre del usuario logueado.
- `index.ts` — barrel (exporta `MockBackendInterceptor`, `resetDb`).

Activado con `environment.useMocks = true` (`src/environments/environment.development.ts`).
Registrado en `app.config.ts` (`withInterceptors([MockBackendInterceptor, AuthInterceptor])`).

**Importante:** como los datos viven en `localStorage`, al cambiar el seed hay que **subir
la versión** del `STORAGE_KEY` (ya está en `v5`) para que se recargue, o usar el botón
**"Datos demo"** del hub (llama `resetDb()` + recarga). ⚠️ Si hay **dos dev-servers
solapados** durante las ediciones, un recompilado intermedio puede persistir un `v3`
incompleto (sin la colección nueva) → limpiar la key de `localStorage` y recargar. Los
componentes que consumen listas deben ser defensivos (`Array.isArray(d) ? d : []`).

Flujo completo: lista de pacientes (hub) → elegir paciente / topbar → abrir hoja → llenar →
guardar (POST persiste) → recargar → los datos siguen ahí.

---

## 7. Sistema de diseño (identidad propia, NO templada)

Construido con las skills **`frontend-design`** (dirección de arte) + **`ui-ux-pro-max`** +
**`ui-skills`** (CLI: `npx ui-skills start | list --category <c> | get <slug>`; imprime
markdown, no requiere Python). En esta máquina **Python no estaba instalado**, así que el
script de ui-ux-pro-max no corre; se usó su Quick Reference.

- **Tipografía** (en `index.html` Google Fonts + vars en `_app-polish.scss`):
  `--font-display: Saira` (títulos) · `--font-body: Public Sans` (cuerpo, vibe gobierno) ·
  `--font-mono: IBM Plex Mono` (datos/códigos de formulario).
- **Paleta teal-pino clínica** vía `definePreset(Aura, { semantic: { primary: {...} } })`
  en `app.config.ts` (primary 500 = `#108a6e`). NO es el emerald por defecto.
- **Elemento firma:** `app-form-header` (emblema SVG + título + **código oficial en mono** +
  **línea ECG animada**). Va en TODAS las hojas → cohesión. El latido/ECG se repite en el login.
- **Motion:** transición de página en `AppLayout` (GSAP en `NavigationEnd`), `[appReveal]`
  stagger, login con timeline GSAP. **Diálogos** con motion de modal (guía `ui-skills /
  transitions-dev`): `[transitionOptions]="'250ms cubic-bezier(0.22, 1, 0.36, 1)'"`,
  `[draggable]=false`, `[dismissableMask]=true`. Todo respeta `prefers-reduced-motion`.
- **Amabilidad de formularios (sin perder esencia de papel):** inputs solo-lectura se ven
  punteados/atenuados vs. editables; clases utilitarias `.field-label` / `.req` /
  `.field-hint` / `.empty-state`; estados vacíos amables + requeridos + textos de ayuda en
  los diálogos. Las cuadrículas tipo papel (signos vitales, etc.) se conservan intactas.

---

## 8. Estado actual / hecho

- [x] Limpieza del template Sakai (admin, operador, configurator, etc.).
- [x] Login con rol (doctor/enfermera) + GSAP.
- [x] Routing por rol + guard + redirección por rol.
- [x] Mock-backend con persistencia (8 pacientes, datos clínicos coherentes).
- [x] Identidad visual (fuentes, paleta, form-header firma) en todas las hojas.
- [x] Paciente activo (selector en topbar) → el menú abre cada hoja funcional.
- [x] Diálogos con motion suave + formularios más amigables de llenar.
- [x] Fix: cajas Día/Mes/Año de "Fecha de Ingreso" ahora muestran el número completo.
- [x] **Logo institucional COSSMIL real** (`public/img/logo_*.png`) integrado en topbar
  (escudo en disco blanco) y login (panel de marca + cabecera móvil). Reemplaza el
  ícono placeholder `pi-heart-fill`.
- [x] **Dashboard "Inicio de Turno"** (`features/enfermeria/inicio/inicio.component.ts`,
  ruta `/app/enfermeria/inicio`): banner de bienvenida con saludo/turno por hora y reloj
  vivo, 4 KPIs (censo, camas, medicación, alertas), "Ronda de turno" (tarjetas de paciente
  con cama, riesgo color-coded y accesos a hojas) y "Pendientes prioritarios". Es la nueva
  pantalla de aterrizaje de enfermería (login + role-home + redirect de `enfermeria` →
  `inicio`; el menú lo lista primero). Los indicadores se DERIVAN del censo mock de forma
  determinista (no hay datos de tareas reales). Verificado en navegador, claro y oscuro.
- [x] **Módulo Consulta Externa** (proceso ambulatorio): grupo de menú "Consulta Externa".
  - `features/enfermeria/consulta-externa/consulta-externa-lista.component.ts` — recepción/
    worklist (`/app/enfermeria/consulta-externa`): KPIs por estado (clicables = filtro),
    tabla de turnos, diálogo "Nueva recepción" (elige asegurado + especialidad + prioridad).
  - `…/consulta-externa-detalle.component.ts` (`…/consulta-externa/:id`) — **hoja de captura
    guiada**: pasos 1 (constantes) y 2 (Form 002); cada signo muestra su **rango normal** y
    marca el estado en vivo (normal/bajo/alto con color + ícono y etiqueta clínica: Fiebre,
    Taquicardia, Hipoxemia…); **medidor "x/5 básicas"**, **resumen de alertas** de valores
    fuera de rango, **IMC autocalculado** + categoría, requeridos y ayudas. "Enviar al médico"
    se habilita solo con las 5 constantes básicas (PA, FC, FR, Tº, SatO₂). Estado/normalidad
    se evalúan con MÉTODOS (no `computed`) porque `c` es objeto plano: se re-evalúan en cada CD
    (el ngModelChange de PrimeNG dispara CD en zoneless). Botones "Guardar borrador" / "Enviar".
  - **Máquina de estados** `EN_ESPERA → EN_PREPARACION → LISTO_MEDICO → ATENDIDO` (abrir un
    turno lo pasa a EN_PREPARACION; enviar al médico → LISTO_MEDICO y vuelve al worklist).
  - Capa de datos: modelo `core/models/consulta-externa.model.ts`, servicio
    `core/services/consulta-externa.service.ts`, seed `SEED_CONSULTAS_EXTERNAS` (5 turnos del
    día, fecha = HOY), colección `consultasExternas` en mock-db + 4 handlers REST
    (`GET list`, `GET :id`, `POST`, `PUT :id`) en el interceptor. **STORAGE_KEY → v3.**
    Flujo verificado en navegador (recepción → atender → IMC 26.1 → enviar → KPIs/estado OK).

- [x] **Módulo Pisos / Mapa de Camas** (`features/enfermeria/pisos/piso.component.ts`, ruta
  `/app/enfermeria/pisos`, menú "Mapa de Camas"): modela **9 pisos** (catálogo en
  `core/models/piso.model.ts`, Piso 1 = **Cirugía**) y **3 turnos** (Mañana/Tarde/Noche) con
  enfermera/auxiliar de turno (`rolDeTurno`, `turnoActual`). Selector de piso (chips), selector
  de turno (segmented), KPIs (ocupadas/libres/limpieza/post-op) y **grilla de camas**. Solo el
  **Piso 1 · Cirugía está simulado a fondo**: 12 camas (`SEED_CAMAS`) con pacientes quirúrgicos
  (día post-op, pre-op, observación), enlaces a las hojas del paciente, y **gestión de camas**
  (asignar paciente / dar de alta→limpieza / marcar disponible) vía `PisoService` + 3 handlers
  REST (`GET /api/camas/piso/:n`, `GET /api/camas`, `PUT /api/camas/:id`). Los demás pisos
  muestran empty-state. Se agregaron **6 pacientes quirúrgicos** al seed (ids 9–14) →
  **STORAGE_KEY v3 → v4**; la capacidad mostrada del dashboard se subió a 20. Verificado en
  navegador (mapa, cambio de turno=roster, cambio de piso=empty-state).

- [x] **Mejoras al Mapa de Camas inspiradas en BedWise** (repo externo Django comparado): se
  agregó el **estado RESERVADA** (camas reservadas con nota; KPI + color violeta; acciones
  Reservar/Liberar), el **traslado / derivación entre sectores** (botón "Trasladar" en camas
  ocupadas → diálogo que elige piso destino + cama libre de cualquier piso; el origen queda en
  LIMPIEZA y el paciente llega con su procedimiento/POD), y la **tasa de ocupación %**. Se
  simuló también el **Piso 2 · Medicina Interna** (8 camas, pacientes médicos sin tag de
  post-op) para que el traslado sea inter-sector. **STORAGE_KEY v4 → v5.** Verificado en
  navegador (reserva, traslado Piso 1→Piso 2 con conteos/estado actualizados).

Compila limpio (`npm run build` ✅; *warnings* de presupuesto de estilos de `inicio` 8.26 kB y
`piso` 7.28 kB, ambos < 10 kB error). Probado sirviendo en 4300 (HTTP 200, recargas OK).

---

## 9. Pendientes / próximos pasos sugeridos (preguntar al usuario antes)

- Mover físicamente las hojas de **Admisión/Estadístico/Consentimiento/Evolución** de
  `features/doctor/` a `features/enfermeria/` (hoy se reutilizan desde doctor para no romper
  imports; funcionan igual, pero la carpeta no refleja el rol).
- Extender el trato de "requeridos + ayudas" a **Admisión** y **Estadístico** (muchos campos).
- Agregar **egresos/altas** para probar el flujo de egreso en el Estadístico.
- Buscador dentro del selector de paciente del topbar (si crece el número de pacientes).
- Paciente pediátrico (para variar rangos de signos vitales).
- Marcar visualmente en el hub cuál es el paciente activo.

---

## 10. Notas para el siguiente agente

- **No** hay backend; no intentar conectar APIs reales salvo que el usuario lo pida.
- Mantener **zoneless + signals**; usar `effect`/`computed`, no `ngOnInit` con subscribe para
  resolver el paciente (seguir el patrón de §4).
- Al cambiar `seed.ts`, **subir `STORAGE_KEY`** en `mock-db.ts` (o avisar de usar "Datos demo").
- Estilos globales nuevos → `src/assets/_app-polish.scss` (importado con `@use './app-polish'`
  en `styles.scss`; **ruta relativa**, el alias `@/` falla para parciales SCSS).
- Presupuesto de estilos de componente en `angular.json` está en 6kb/10kb (subido a propósito).
- El usuario escribe en **español**; responder en español.
