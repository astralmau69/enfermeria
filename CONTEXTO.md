# Contexto del proyecto — COSSMIL · Módulo de Enfermería

> **Para retomar mañana / pasar a otro agente.** Resumen completo del estado actual.
> Última actualización: 2026-06-25. (Ver también `HANDOFF.md`, más extenso.)
> El usuario escribe en **español** → responder en español.

---

## 1. Qué es

Sistema web de **historia clínica digital para enfermería** del **Hospital Militar Central —
COSSMIL (La Paz, Bolivia)**. Digitaliza los formularios en papel del piso de hospitalización
y suma procesos ambulatorios y de gestión de camas.

- **Frontend-only**: NO hay backend real. **Todos los datos son mock** (ver §6).
- **Reparto de roles (definido por el usuario, NO cambiar sin preguntar):**
  - **DOCTOR** → en piso solo llena **Resultados Exámenes Complementarios (HC-M-009)**.
  - **ENFERMERÍA** → todo lo demás.

---

## 2. Stack y cómo correr

- **Angular 21** (standalone, **zoneless**, **signals**), **PrimeNG 21** (preset Aura
  personalizado teal-pino), **Tailwind v4**, **GSAP** (animaciones), **chart.js**.
- Alias de imports: `@/` → `src/`.
- SO de desarrollo: **Windows** (PowerShell + Git Bash). El puerto 4200 lo usa otro proyecto →
  **este se levanta en 4300**.

```bash
npm install
npm start -- --port 4300     # http://localhost:4300
npm run build                # build de producción (valida tipos)
```

**Login demo (mock, sin HTTP):**
- Doctor: `vvalencia` · Enfermera: `jsilva` · Clave (ambos): `123456`

---

## 3. Arquitectura de rutas

- `/auth/login` → login con selección de rol + GSAP.
- `/app` → `AppLayout` + `AuthGuard` (sesión + `route.data.roles`):
  - `/app/doctor/**` → solo Exámenes.
  - `/app/enfermeria/**` → todo lo de enfermería (ver §4).
  - `/app` vacío → `role-home.ts` redirige por rol (enfermera → `/app/enfermeria/inicio`).
- Hojas con dos rutas: sin id (paciente activo) y con `:pacienteId` (deep-link).

**Paciente activo:** `core/services/paciente-activo.service.ts` mantiene un signal global del
paciente en contexto (selector en el topbar). El menú abre las hojas para ese paciente.

---

## 4. Módulos (rol ENFERMERÍA)

Menú lateral filtrado por rol (`core/services/menu.service.ts`):

**Enfermería**
- **Inicio de Turno** (`/app/enfermeria/inicio`) — dashboard de aterrizaje: saludo + turno por
  hora (reloj vivo), 4 KPIs, "Ronda de turno" (tarjetas de paciente con riesgo color-coded),
  "Pendientes prioritarios", acceso rápido. Indicadores derivados del censo mock.
- **Pacientes en Piso** (`/app/enfermeria/pacientes`) — hub/censo en tarjetas + buscador +
  botón "Datos demo" (reinicia el mock).
- **Mapa de Camas** (`/app/enfermeria/pisos`) — **9 pisos × 3 turnos**. Piso 1 = **Cirugía**
  (simulado a fondo: 12 camas con pacientes quirúrgicos, día post-op, pre-op). Piso 2 =
  **Medicina Interna** (8 camas). Estados de cama: **Libre / Ocupada / Reservada / Limpieza**.
  Gestión: asignar, reservar, liberar, y **traslado/derivación entre sectores** (mover paciente
  a una cama libre de otro piso → origen queda en limpieza). KPIs: tasa de ocupación %, libres,
  reservadas, post-operatorios. Selector de turno (Mañana/Tarde/Noche) con enfermera de turno.

**Consulta Externa** (proceso ambulatorio)
- **Recepción / Turnos** (`/app/enfermeria/consulta-externa`) — worklist con KPIs por estado
  (clicables = filtro), tabla de turnos, "Nueva recepción" (elige asegurado + especialidad +
  prioridad). Máquina de estados: `EN_ESPERA → EN_PREPARACION → LISTO_MEDICO → ATENDIDO`.
- **Detalle** (`/app/enfermeria/consulta-externa/:id`) — **hoja de captura GUIADA**: constantes
  vitales basales con **rango normal por signo** + estado en vivo (normal/bajo/alto con color y
  etiqueta clínica: Fiebre, Taquicardia, Hipoxemia…), **medidor x/5 básicas**, **resumen de
  alertas**, **IMC autocalculado** + categoría, y **Formulario 002** (motivo, alergias,
  antecedentes). "Enviar al médico" se habilita solo con las 5 constantes básicas.

**Hojas de Enfermería** (replican el papel; cada una con `app-form-header` y código oficial)
- Signos Vitales (HCE-002, con gráfico), Notas Diarias (HCE-004), Medicamentos / Kardex (HCE-006).

**Ingreso / Egreso**
- Admisión Hospitalaria (HC-M-002), Informe Estadístico (HC-005), Consentimiento (HC-M-003),
  Evolución y Tratamiento (HC-M-007). *(Estos componentes viven en `features/doctor/` pero se
  rutean desde enfermería.)*

**Rol DOCTOR:** Pacientes en Piso + Exámenes Complementarios (HC-M-009) únicamente.

---

## 5. Sistema de diseño (identidad propia, NO templada)

- **Tipografía** (Google Fonts en `index.html` + vars en `assets/_app-polish.scss`):
  `--font-display: Saira` (títulos) · `--font-body: Public Sans` (cuerpo) ·
  `--font-mono: IBM Plex Mono` (datos/códigos).
- **Paleta teal-pino** vía `definePreset(Aura)` en `app.config.ts` (primary 500 `#108a6e`).
- **Logo COSSMIL real** (`public/img/logo_*.png`) sobre disco blanco en topbar, login y banners.
- **Elemento firma:** `app-form-header` (emblema + título + **código oficial** en mono + línea
  ECG animada) en todas las hojas. Motion con GSAP (`[appReveal]`, transición de página, login).
  Todo respeta `prefers-reduced-motion`. Soporta **claro y oscuro**.
- Estilos globales nuevos → `assets/_app-polish.scss` (importado en `styles.scss` con ruta
  **relativa**, el alias `@/` falla para parciales SCSS). Presupuesto de estilos por componente
  en `angular.json`: **6 kb warning / 10 kb error** (algunos componentes dan warning, OK).

---

## 6. Mock-backend (cómo funciona "casi real")

Carpeta `src/app/mock-backend/`:
- `seed.ts` — datos iniciales (14 pacientes, admisiones, evoluciones, exámenes, notas,
  medicamentos, signos, estadísticos, consentimientos, **consultas externas**, **camas**).
- `mock-db.ts` — DB en memoria + **persistencia en `localStorage`** (key **`cossmil_mock_db_v5`**).
  `get-or-create` por paciente, `upsertByPaciente`, `resetDb()`.
- `mock-backend.interceptor.ts` — intercepta `/api/...` (GET/POST/PUT/DELETE) con latencia
  simulada. Firma notas/evolución con el usuario logueado.

⚠️ **Al cambiar `seed.ts` hay que SUBIR `STORAGE_KEY`** (va en `v5`) o usar el botón
**"Datos demo"** del hub, si no quedan datos viejos en `localStorage`.

---

## 7. Patrones clave y "gotchas" (IMPORTANTES)

- **Zoneless + signals**: resolver el paciente con `effect(() => routeId() ?? activo.pacienteId())`
  usando `toSignal(route.paramMap)` (NO `ngOnInit` + subscribe).
- **`computed` vs métodos**: si el dato editable es un **objeto plano** (p. ej. el `c` de
  constantes, o `traslado` en camas), usar **MÉTODOS** en la plantilla (no `computed`): se
  reevalúan en cada detección de cambios, y el `(ngModelChange)` de PrimeNG la dispara. Un
  `computed()` que lee un objeto plano NO reacciona a sus mutaciones.
- **PUT que limpia campos**: para borrar un campo (p. ej. `pacienteId` al liberar una cama) el
  body debe enviar **`null`**, NO `undefined` (JSON.stringify descarta `undefined`, y el merge
  del interceptor no lo limpiaría).
- **Consumidores de listas defensivos**: `Array.isArray(d) ? d : []` (evita spinner colgado si
  el GET devuelve algo inesperado).
- **Dev-servers solapados**: si quedan dos `ng serve` corriendo durante ediciones, un
  recompilado intermedio puede persistir un `STORAGE_KEY` incompleto → limpiar la key de
  `localStorage` y recargar.

---

## 8. Hecho en las últimas sesiones (2026-06-25)

1. **Logo COSSMIL** integrado (topbar + login).
2. **Dashboard "Inicio de Turno"** (nuevo aterrizaje de enfermería).
3. **Módulo Consulta Externa** (recepción → constantes → Form 002), luego rehecho como
   **hoja de captura guiada** (rangos, alertas, IMC, progreso).
4. **Módulo Pisos / Mapa de Camas** (9 pisos × 3 turnos; Piso 1 Cirugía simulado).
5. **Mejoras inspiradas en BedWise** (repo externo comparado, `github.com/JulianMnZodd/SistemaUncaus`):
   estado **Reservada**, **traslado entre sectores**, **tasa de ocupación**, **Piso 2** simulado.

Todo compila (`npm run build` ✅) y fue verificado en navegador (claro y oscuro).

---

## 9. Consultoría de arquitectura (para cuando exista backend real)

Resumen de la propuesta ya entregada (no implementada — el proyecto sigue mock):
- **Modelo de datos**: centrado en `paciente → episodio_atencion`; tablas por módulo
  (consulta_externa/signos_basales, triaje/traslado, registro_signos/signo_punto,
  kardex/kardex_item/administracion [ticado por hora], nota_soapie/addendum, balance/balance_mov,
  cirugia/checklist_seguro/recuento, entrega_turno, cama/asignacion_cama). Auditoría **append-only**,
  **sin hard-delete**, firmado = **inmutable** (Ley N° 3131 / expediente clínico).
- **Stack recomendado**: Angular (front, ya está) + **NestJS** + **PostgreSQL** (RLS, JSONB) +
  Prisma/TypeORM; auth OIDC/JWT + RBAC + MFA; on-premise (soberanía de datos Bolivia); cifrado
  en tránsito/reposo; storage on-prem (MinIO) para PDFs/imágenes.
- **Kardex (REST)**: el "ticado" es `POST /api/administraciones/:id/ticar` (PROGRAMADO →
  ADMINISTRADO con enfermera/hora); máquina de estados; lo administrado, inmutable.
- **SOAPIE (REST)**: borrador editable → `POST .../firmar` (inmutable) → correcciones por
  `addendum` (no editar lo firmado).

---

## 10. Pendientes / próximos pasos sugeridos (preguntar antes)

- Conectar el dashboard "Inicio de Turno" al **piso/turno seleccionado** (usar las camas reales
  del Piso 1 en la "Ronda de turno").
- Simular el resto de los pisos (3–9).
- Siguiente proceso quirúrgico: **Lista de Verificación de Cirugía Segura** (Entrada/Pausa/Salida)
  + recuento de gasas; o **Triaje de Emergencias** (Manchester); o **Balance Hídrico 24h**.
- Mejoras tipo BedWise pendientes: **reportes/estadísticas de ocupación** (PDF/tabla por sector),
  rol **Recepcionista** explícito.
- Mover físicamente Admisión/Estadístico/Consentimiento/Evolución de `features/doctor/` a
  `features/enfermeria/` (hoy se reutilizan; funcionan igual).

---

## 11. Reglas para el siguiente agente

- **No** hay backend; no conectar APIs reales salvo que el usuario lo pida.
- Mantener **zoneless + signals** y los patrones de §7.
- Al cambiar `seed.ts`, **subir `STORAGE_KEY`** en `mock-db.ts`.
- Seguir el patrón de módulo: carpeta en `features/enfermeria/<x>/`, `app-form-header` con código,
  servicio que pega a `/api/...` (lo intercepta el mock), rutas en par, menú por rol, estética
  con `[appReveal]` + paleta teal + claro/oscuro.
- Verificar con `npm run build` y, si se puede, sirviendo en 4300.
