# 🌱 Proyecto Semilla Corporativo
### Angular 21 + PrimeNG 21 + Tailwind CSS v4 + Sakai Template

Plantilla base corporativa para iniciar nuevos sistemas internos. Incluye autenticación, layout administrativo, arquitectura modular con Lazy Loading y un ejemplo funcional de CRUD de usuarios y menús.

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm start        # → http://localhost:4200

# 3. Compilar producción
npm run build
```

**Credenciales de prueba:** `admin` / `admin`

---

## 🏗️ Arquitectura del Proyecto

```
src/app/
│
├── core/                          # Servicios singleton, guards e interceptors
│   ├── guards/
│   │   └── auth.guard.ts          # Protege rutas privadas (redirige a /auth/error)
│   ├── interceptors/
│   │   └── auth.interceptor.ts    # Adjunta Bearer Token a cada petición HTTP
│   ├── models/
│   │   ├── user.model.ts          # Interface User del sistema
│   │   ├── auth-response.ts       # Interface respuesta de autenticación
│   │   ├── menu-item.model.ts     # Interface para el registro de menús
│   │   └── usuario-crud.model.ts  # Interface para el CRUD de usuarios
│   └── services/
│       ├── auth.service.ts        # Lógica de login/logout con Angular Signals
│       ├── menu.service.ts        # Gestión de menús corporativos
│       ├── usuario-crud.service.ts# Gestión del CRUD de usuarios
│       └── archivo.service.ts     # Servicio para visualización e interacción de archivos (PDFs)
│
├── shared/                        # Componentes, pipes y directivas genéricas
│   └── index.ts
│
├── features/                      # Módulos de negocio principales
│   └── admin/                     # Área privada (protegida por AuthGuard)
│       ├── dashboard/
│       │   └── dashboard.component.ts # Dashboard interactivo (indicadores, visualización de PDFs)
│       ├── users/
│       │   └── users.component.ts # CRUD completo funcional
│       └── admin.routes.ts        # Rutas administrativas (/admin/*)
│
├── pages/                         # Páginas independientes de error o autenticación
│   ├── auth/
│   │   ├── access.ts              # Página de acceso denegado
│   │   └── error.ts               # Página de error genérico
│   └── notfound/
│       └── notfound.ts            # Página 404
│
└── layout/                        # Componentes de shell (Sakai NG)
    ├── component/
    │   ├── app.layout.ts          # Layout principal (sidebar + topbar)
    │   ├── app.menu.ts            # Menú lateral dinámico
    │   └── app.topbar.ts          # Barra superior con información del usuario y logout
    └── service/
        └── layout.service.ts      # Configuración de apariencia y portal
```

---

## 🔐 Autenticación e Integración con el Portal

El sistema está diseñado para integrarse perfectamente con el **Portal Institucional**. Recibe la sesión, configuración de layout de manera directa mediante parámetros en la URL y gestiona automáticamente la redirreción y almacenamiento mediante `AuthService`.

**Simular entrada desde el Portal:**
```
http://localhost:4200/?token=MI_TOKEN_JWT&user={"id":1,"name":"Juan Perez","email":"juan@cossmil.mil.bo","role":"ADMIN"}&config={"preset":"Aura","primary":"noir","surface":"zinc","darkTheme":false}
```

### Lógica de Autenticación (`AuthService`)
El `AuthService` utiliza **Angular Signals** y realiza los siguientes pasos al iniciar:
1. Busca `token`, `user` y `config` en los parámetros de la URL.
2. Si están presentes, los guarda localmente (`localStorage`), limpia la URL por seguridad y valida la sesión.
3. Si no están en la URL, busca persistencia previa.
4. Si no hay datos, cierra la sesión redirigiendo a su página correspondiente para acceso denegado.

---

## 🏛️ Configuración de Identidad Corporativa

Para adaptar la plantilla a un nuevo sistema, modifique el `LayoutService` (`src/app/layout/service/layout.service.ts`):

```typescript
// DEFAULT_CONFIG
{
    systemName: 'Mi Nuevo Sistema',
    portalUrl: 'https://portal.cossmil.mil.bo',
    // ... otras configuraciones visuales (preset, primary, darkTheme)
}
```

Esto actualizará automáticamente el nombre en la barra superior, adoptará los temas institucionales y ajustará el enlace responsivo de "Volver al Portal".

---

## ➕ Cómo Agregar un Nuevo Módulo

### 1. Crear la carpeta del feature

```bash
mkdir src/app/features/mi-modulo
```

### 2. Crear el componente principal

```typescript
// src/app/features/mi-modulo/mi-modulo.component.ts
import { Component } from '@angular/core';

@Component({ selector: 'app-mi-modulo', standalone: true, template: `<h1>Hola</h1>` })
export class MiModuloComponent { }
```

### 3. Agregar en `admin.routes.ts`

```typescript
// src/app/features/admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
    // ...
    {
        path: 'mi-modulo',
        loadComponent: () => import('../mi-modulo/mi-modulo.component').then(m => m.MiModuloComponent)
    }
];
```

### 4. Agregar al menú

Puede gestionarse a través del backend o desde la configuración del menú global del sistema conectándose con el CRUD de menús.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Angular** | 21 | Framework principal |
| **PrimeNG** | 21.0.2 | Componentes UI reusables |
| **Tailwind CSS** | v4 | Utilidades CSS / Estilos atómicos (`@tailwindcss/postcss`) |
| **Sakai NG** | - | Template de layout base |
| **Angular Signals** | built-in | Estado reactivo |
| **Chart.js** | 4.4.2 | Gráficos e indicadores |

---

## 📋 Buenas Prácticas Incluidas

- ✅ **Lazy Loading** — Cada feature y carga de página es modular.
- ✅ **Functional Guards** — `AuthGuard` implementado con la API moderna de la v21.
- ✅ **Functional Interceptors** — `AuthInterceptor` utilizando `withInterceptors()`.
- ✅ **Signals y SSR compatible** — Uso centralizado de propiedades reactivas y libre de dependencias RxJS rígidas en el `AuthService`.
- ✅ **Standalone Components** — Sin NgModules, arquitectura escalable y moderna con Angular 21.
- ✅ **Zoneless Readiness** — Arquitectura compatible con optimizaciones zoneless.

---

## 🤝 Convenciones del Equipo

- Los servicios e intefaces base van en `core/` (ej. `core/services/`, `core/models/`).
- El diseño es orientado a composición: la vista principal de la interfaz administrativa se alberga bajo el concepto de `features/admin/`.
- Cada router y carga es con `loadComponent`.
- Usar imports relativos limpios o alias.
